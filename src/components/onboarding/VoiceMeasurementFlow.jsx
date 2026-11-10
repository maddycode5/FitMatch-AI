import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  Check,
  User,
  Radio,
  Layers,
  Server
} from 'lucide-react';
import { 
  DIMENSION_METADATA, 
  GUIDED_BODY_FLOW,
  parseSpokenMeasurement, 
  extractMeasurementsViaBackend,
  transcribeAndExtractAudioViaBackend,
  timbreTTS, 
  PrismaSTTEngine,
  backendVoiceManager,
  API_BASE_URL
} from '../../services/voiceMeasurementService';

export default function VoiceMeasurementFlow({ initialProfile, onSave, onBack }) {
  // Category tabs: 'upper' | 'lower'
  const [activeCategory, setActiveCategory] = useState('upper');
  const activeCategoryRef = useRef('upper');
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  
  // Current active targeted dimension (Starts strictly with Chest as Step 1 of Upper Body)
  const [activeKey, setActiveKey] = useState('chest_cm');
  const activeKeyRef = useRef('chest_cm');
  useEffect(() => { activeKeyRef.current = activeKey; }, [activeKey]);

  // Customer measurements state (in cm) - starts empty for unverified profiles
  const [measurements, setMeasurements] = useState({
    chest_cm: initialProfile?.measurements?.chest_cm || null,
    shoulder_cm: initialProfile?.measurements?.shoulder_cm || null,
    neck_cm: initialProfile?.measurements?.neck_cm || null,
    arm_length_cm: initialProfile?.measurements?.arm_length_cm || initialProfile?.measurements?.sleeve_length_cm || null,
    waist_cm: initialProfile?.measurements?.waist_cm || null,
    hip_cm: initialProfile?.measurements?.hip_cm || null,
    thigh_cm: initialProfile?.measurements?.thigh_cm || null,
    inseam_cm: initialProfile?.measurements?.inseam_cm || null,
    height_cm: initialProfile?.height_cm || null
  });
  const measurementsRef = useRef(measurements);
  useEffect(() => { measurementsRef.current = measurements; }, [measurements]);

  // Sync state if initialProfile changes (e.g. user loaded demo profile or switched profile)
  useEffect(() => {
    if (initialProfile?.measurements) {
      setMeasurements(prev => ({
        ...prev,
        chest_cm: initialProfile.measurements.chest_cm ?? prev.chest_cm,
        shoulder_cm: initialProfile.measurements.shoulder_cm ?? prev.shoulder_cm,
        neck_cm: initialProfile.measurements.neck_cm ?? prev.neck_cm,
        arm_length_cm: initialProfile.measurements.arm_length_cm ?? initialProfile.measurements.sleeve_length_cm ?? prev.arm_length_cm,
        waist_cm: initialProfile.measurements.waist_cm ?? prev.waist_cm,
        hip_cm: initialProfile.measurements.hip_cm ?? prev.hip_cm,
        thigh_cm: initialProfile.measurements.thigh_cm ?? prev.thigh_cm,
        inseam_cm: initialProfile.measurements.inseam_cm ?? prev.inseam_cm,
        height_cm: initialProfile.height_cm ?? prev.height_cm
      }));
    }
  }, [initialProfile]);

  const handleLoadDemoValues = () => {
    const demoMeasurements = {
      chest_cm: 98,
      shoulder_cm: 45,
      neck_cm: 39,
      arm_length_cm: 62,
      waist_cm: 82,
      hip_cm: 96,
      thigh_cm: 56,
      inseam_cm: 80,
      height_cm: 178
    };
    setMeasurements(demoMeasurements);
    measurementsRef.current = demoMeasurements;
    speakInstruction("Loaded sample 42R benchmark measurements. Say 'Confirm' to verify, or speak any new measurement to customize.");
  };

  // Track which measurements have been confirmed
  const [confirmedKeys, setConfirmedKeys] = useState(() => {
    if (initialProfile?.measurement_metadata?.verified_by_user && !initialProfile?.is_demo) {
      return new Set(Object.keys(initialProfile.measurements || {}).filter(k => initialProfile.measurements[k]));
    }
    return new Set();
  });
  const confirmedKeysRef = useRef(confirmedKeys);
  useEffect(() => { confirmedKeysRef.current = confirmedKeys; }, [confirmedKeys]);

  // Multi-measurement extraction pending confirmation
  const [pendingExtraction, setPendingExtraction] = useState(null);
  const pendingExtractionRef = useRef(null);
  useEffect(() => { pendingExtractionRef.current = pendingExtraction; }, [pendingExtraction]);

  // Voice Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [isSTTSupported, setIsSTTSupported] = useState(true);
  const [cloudStatus, setCloudStatus] = useState(backendVoiceManager.getStatus());

  const sttEngineRef = useRef(null);
  const interimDebounceRef = useRef(null);

  // Subscribe to Backend Voice Proxy status & active TTS playback indicator
  useEffect(() => {
    backendVoiceManager.checkHealth();
    const unsubStatus = backendVoiceManager.addStatusListener((status) => {
      setCloudStatus(status);
    });
    const unsubSpeaking = timbreTTS.addSpeakingListener((speaking) => {
      setIsTTSActive(speaking);
    });
    return () => {
      unsubStatus();
      unsubSpeaking();
    };
  }, []);

  // Initialize Speech Recognition with continuous 16kHz WAV capture + acoustic echo suppression
  useEffect(() => {
    let isMounted = true;
    sttEngineRef.current = new PrismaSTTEngine(
      ({ interim, final, backendResult }) => {
        if (!isMounted) return;
        const text = final || interim;
        if (text) setSpeechTranscript(text);

        if (backendResult) {
          handleBackendResult(backendResult);
          return;
        }

        // Only final speech utterances from browser fallback trigger text extraction
        // if WAV uploader hasn't already handled them
        if (final && final.trim().length > 0) {
          if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
          handleVoiceInput(final);
        }
      },
      (state, error) => {
        if (!isMounted) return;
        if (state === 'listening') setIsListening(true);
        if (state === 'processing') setIsProcessing(true);
        if (state === 'inactive') setIsListening(false);
        if (state === 'error' && error !== 'no-speech') {
          console.warn('STT Error:', error);
        }
      },
      timbreTTS,
      () => activeKeyRef.current
    );

    setIsSTTSupported(sttEngineRef.current.isSupported());

    // Start microphone listening
    sttEngineRef.current.start();
    setIsListening(true);

    // Initial welcoming prompt: speaks Voice Calibration Active + Step 1 Gnani Timbre Guidance,
    // then opens microphone listening once finished.
    const welcomeTimer = setTimeout(() => {
      if (isMounted && !isMuted) {
        const firstMeta = DIMENSION_METADATA[activeKeyRef.current] || DIMENSION_METADATA.chest_cm;
        speakInstruction(
          `Voice calibration active. ${firstMeta.spokenLabel || firstMeta.label}. ${firstMeta.instruction}`
        );
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(welcomeTimer);
      if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
      if (sttEngineRef.current) {
        sttEngineRef.current.stop();
      }
      timbreTTS.stop();
    };
  }, []);

  const speakInstruction = (text, onEnd = null) => {
    if (isMuted || !text) {
      if (onEnd) onEnd();
      return;
    }
    setIsTTSActive(true);
    timbreTTS.speak(text, () => {
      setIsTTSActive(false);
      if (onEnd) onEnd();
    });
  };

  const toggleListening = () => {
    if (!sttEngineRef.current) return;
    if (isListening) {
      sttEngineRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      sttEngineRef.current.start();
      setIsListening(true);
    }
  };

  const handleVoiceInput = async (rawTranscript) => {
    if (!rawTranscript || !rawTranscript.trim()) return;
    setIsProcessing(true);

    const currentActiveKey = activeKeyRef.current;
    
    // Call backend STT proxy (POST /api/voice/stt)
    const result = await transcribeAndExtractAudioViaBackend(null, currentActiveKey, rawTranscript);
    handleBackendResult(result);
  };

  const handleBackendResult = (result) => {
    setIsProcessing(false);
    if (!result) return;
    if (result.transcript) {
      setSpeechTranscript(result.transcript);
    }

    // 1. Confirm Intent: "Yes" / "Correct" / "Confirm" / "Sahi hai"
    if (result.intent === 'confirm') {
      const pending = pendingExtractionRef.current;
      if (pending && pending.measurements && pending.measurements.length > 0) {
        confirmAllPending(pending.measurements);
      } else {
        // Confirm pre-filled demo/existing value if valid
        const currKey = activeKeyRef.current;
        const currVal = measurementsRef.current[currKey];
        if (currVal !== null && currVal !== undefined && currVal > 0) {
          confirmExtractedValue(currKey, currVal);
        } else {
          const meta = DIMENSION_METADATA[currKey];
          speakInstruction(`Please speak your ${meta?.spokenLabel || meta?.label} measurement in centimetres or inches first.`);
        }
      }
      return;
    }

    // 2. Reject Intent: "No" / "Cancel" / "Wrong" / "Nahi"
    if (result.intent === 'reject') {
      setPendingExtraction(null);
      pendingExtractionRef.current = null;
      setSpeechTranscript('');
      const currKey = activeKeyRef.current;
      speakInstruction(`Cancelled. Please speak your ${DIMENSION_METADATA[currKey]?.label} again.`);
      return;
    }

    // 3. Extracted Measurement(s)
    if (result.success && result.measurements && result.measurements.length > 0) {
      setPendingExtraction(result);
      pendingExtractionRef.current = result;

      // Speak confirmation prompt via Gnani Timbre (or range warning if out of bounds)
      const validMeasures = result.measurements.filter(m => m.isValid);
      if (validMeasures.length > 0) {
        const promptToSpeak = result.confirmationPrompt || 
          `Captured ${validMeasures[0].dimensionLabel} at ${validMeasures[0].value_cm} centimetres. Is that correct?`;
        speakInstruction(promptToSpeak);
      } else {
        const warningText = result.measurements[0]?.warning || "That number seems out of range. Please speak your measurement again.";
        speakInstruction(warningText);
      }
    } else if (result.transcript && result.transcript.trim().length > 1) {
      const currKey = activeKeyRef.current;
      const label = DIMENSION_METADATA[currKey]?.label || 'measurement';
      speakInstruction(`Heard "${result.transcript}". Please speak your ${label} number, such as 82 centimetres.`);
    } else if (result.error) {
      speakInstruction(result.error);
    }
  };

  /**
   * Confirms multiple measurements extracted in compound utterances
   * e.g. "My chest is 98 centimetres and my waist is 82 centimetres."
   */
  const confirmAllPending = (measurementsList) => {
    if (!measurementsList || measurementsList.length === 0) return;

    const newMeasurements = { ...measurementsRef.current };
    const updatedConfirmed = new Set(confirmedKeysRef.current);
    const confirmedLabels = [];

    measurementsList.forEach(m => {
      if (m.isValid && m.dimensionKey) {
        newMeasurements[m.dimensionKey] = m.value_cm;
        updatedConfirmed.add(m.dimensionKey);
        const meta = DIMENSION_METADATA[m.dimensionKey];
        confirmedLabels.push(meta?.spokenLabel || m.dimensionLabel.replace(' / ', ' and ').split(' (')[0]);
      }
    });

    setMeasurements(newMeasurements);
    measurementsRef.current = newMeasurements;
    setConfirmedKeys(updatedConfirmed);
    confirmedKeysRef.current = updatedConfirmed;

    setPendingExtraction(null);
    pendingExtractionRef.current = null;
    setSpeechTranscript('');

    // Advance guided flow to next unconfirmed dimension
    advanceGuidedFlow(updatedConfirmed, confirmedLabels.join(' and '));
  };

  const confirmExtractedValue = (dimensionKey, valueCm) => {
    const targetKey = dimensionKey || activeKeyRef.current;
    const targetVal = valueCm !== undefined ? valueCm : measurementsRef.current[targetKey];

    setMeasurements(prev => {
      const next = { ...prev, [targetKey]: targetVal };
      measurementsRef.current = next;
      return next;
    });

    const updatedConfirmed = new Set(confirmedKeysRef.current);
    updatedConfirmed.add(targetKey);
    setConfirmedKeys(updatedConfirmed);
    confirmedKeysRef.current = updatedConfirmed;

    setPendingExtraction(null);
    pendingExtractionRef.current = null;
    setSpeechTranscript('');

    const targetMeta = DIMENSION_METADATA[targetKey];
    advanceGuidedFlow(updatedConfirmed, targetMeta?.spokenLabel || targetMeta?.label);
  };

  const advanceGuidedFlow = (updatedConfirmed, confirmedLabel) => {
    const upperKeys = GUIDED_BODY_FLOW.upper;
    const lowerKeys = GUIDED_BODY_FLOW.lower;
    const currentCategory = activeCategoryRef.current;

    if (currentCategory === 'upper') {
      const remainingUpper = upperKeys.filter(k => !updatedConfirmed.has(k));

      if (remainingUpper.length > 0) {
        const nextKey = remainingUpper[0];
        setActiveKey(nextKey);
        activeKeyRef.current = nextKey;
        const nextMeta = DIMENSION_METADATA[nextKey];
        speakInstruction(`${confirmedLabel} confirmed. Next, ${nextMeta.spokenLabel || nextMeta.label}. ${nextMeta.instruction}`);
      } else {
        // Upper complete, switch to lower body
        setActiveCategory('lower');
        activeCategoryRef.current = 'lower';
        const firstLowerKey = lowerKeys.find(k => !updatedConfirmed.has(k)) || lowerKeys[0];
        setActiveKey(firstLowerKey);
        activeKeyRef.current = firstLowerKey;
        const nextMeta = DIMENSION_METADATA[firstLowerKey];
        speakInstruction(`Upper body complete! Let's capture your lower body measurements. First, ${nextMeta.spokenLabel || nextMeta.label}. ${nextMeta.instruction}`);
      }
    } else {
      const remainingLower = lowerKeys.filter(k => !updatedConfirmed.has(k));

      if (remainingLower.length > 0) {
        const nextKey = remainingLower[0];
        setActiveKey(nextKey);
        activeKeyRef.current = nextKey;
        const nextMeta = DIMENSION_METADATA[nextKey];
        speakInstruction(`${confirmedLabel} confirmed. Next, ${nextMeta.spokenLabel || nextMeta.label}. ${nextMeta.instruction}`);
      } else {
        speakInstruction(`Outstanding! All upper and lower body measurements are confirmed. You can now save your universal profile.`);
      }
    }
  };

  const handleSelectDimension = (key) => {
    setActiveKey(key);
    activeKeyRef.current = key;
    setPendingExtraction(null);
    pendingExtractionRef.current = null;
    setSpeechTranscript('');
    const meta = DIMENSION_METADATA[key];
    if (meta) {
      setActiveCategory(meta.category);
      activeCategoryRef.current = meta.category;
      speakInstruction(`${meta.spokenLabel || meta.label}. ${meta.instruction}`);
    }
  };

  const handleQuickSpeechTest = (testPhrase) => {
    setSpeechTranscript(testPhrase);
    handleVoiceInput(testPhrase);
  };

  const handleSaveAll = () => {
    onSave({
      is_demo: false,
      profile_label: "Verified Customer Profile",
      height_cm: measurements.height_cm,
      weight_kg: initialProfile?.weight_kg || 72,
      measurements: {
        neck_cm: measurements.neck_cm,
        shoulder_cm: measurements.shoulder_cm,
        chest_cm: measurements.chest_cm,
        waist_cm: measurements.waist_cm,
        hip_cm: measurements.hip_cm,
        inseam_cm: measurements.inseam_cm,
        thigh_cm: measurements.thigh_cm || initialProfile?.measurements?.thigh_cm || null,
        arm_length_cm: measurements.arm_length_cm || initialProfile?.measurements?.arm_length_cm || null,
        sleeve_length_cm: measurements.arm_length_cm || initialProfile?.measurements?.sleeve_length_cm || null
      },
      measurement_metadata: {
        source: "voice_fastapi_gnani_proxy",
        confidence_score: 0.99,
        verified_by_user: true,
        is_demo: false,
        updated_at: new Date().toISOString()
      }
    });
  };

  const currentCategoryKeys = GUIDED_BODY_FLOW[activeCategory] || [];
  const categoryDimensions = currentCategoryKeys.map(k => [k, DIMENSION_METADATA[k]]);
  const activeMeta = DIMENSION_METADATA[activeKey] || DIMENSION_METADATA.chest_cm;

  const upperConfirmedCount = GUIDED_BODY_FLOW.upper.filter(k => confirmedKeys.has(k)).length;
  const lowerConfirmedCount = GUIDED_BODY_FLOW.lower.filter(k => confirmedKeys.has(k)).length;
  const isUpperComplete = upperConfirmedCount === GUIDED_BODY_FLOW.upper.length;
  const isLowerComplete = lowerConfirmedCount === GUIDED_BODY_FLOW.lower.length;
  const isAllComplete = isUpperComplete && isLowerComplete;

  return (
    <div className="space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 pr-10 sm:pr-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-semibold">
              Voice-Guided Measurement Mode
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-white/10 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-cyan-400" />
              <span>FastAPI Proxy (8000)</span>
            </span>
            {cloudStatus.isCloudActive ? (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{cloudStatus.badgeText}</span>
              </span>
            ) : (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span>{cloudStatus.badgeText}</span>
              </span>
            )}
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mt-1">
            Hands-Free Voice Calibration
          </h3>
          <p className="text-xs text-neutral-400 font-light mt-0.5">
            Hold your measuring tape and speak naturally. Say e.g. <span className="text-cyan-300 font-mono italic">"{activeMeta.testPhrases?.[0] || 'My chest is 98 centimetres'}"</span>
          </p>
        </div>

        {/* Audio Speaker Mute Toggle & Hear Instruction */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              timbreTTS.primeAudio();
              timbreTTS.lastSpokenTimestamp = 0;
              speakInstruction(activeMeta.instruction);
            }}
            className="px-3 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Hear instructions via Gnani Timbre TTS"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear Instructions</span>
          </button>
          <button
            onClick={() => {
              const muted = timbreTTS.toggleMute();
              setIsMuted(muted);
            }}
            className={`p-2 rounded-full border transition-all ${
              isMuted
                ? 'bg-neutral-800 border-white/10 text-neutral-400 hover:text-white'
                : 'bg-cyan-950/80 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
            title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
        
        {/* LEFT COLUMN: Visual Anatomical Guidance & Voice Waveform HUD (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl glass-panel p-3.5 sm:p-4 border border-white/10 bg-[#070913] flex flex-col justify-between space-y-3">
          
          {/* Active Target Banner */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                {activeCategory === 'upper' ? 'Upper Body Step' : 'Lower Body Step'}:
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {activeMeta.stepNumber} of {activeMeta.totalSteps}
              </span>
            </div>
            <span className="text-xs font-serif text-cyan-300 font-semibold uppercase tracking-wider">
              {activeMeta.label}
            </span>
          </div>

          {/* Interactive Anatomical Pose Guide */}
          <div className="relative w-full h-44 sm:h-52 rounded-xl bg-gradient-to-b from-[#030611] to-[#0a0f1d] border border-cyan-500/20 flex items-center justify-center overflow-hidden">
            
            <svg viewBox="0 15 200 300" className="w-full h-full max-h-40 sm:max-h-48 object-contain opacity-90">
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Head & Neck */}
              <circle cx="100" cy="35" r="18" fill="none" stroke="#00f0ff" strokeWidth="1.5" />
              <rect x="94" y="53" width="12" height="15" fill={activeKey === 'neck_cm' ? '#00f0ff' : 'none'} stroke="#00f0ff" strokeWidth="1.5" />

              {/* Torso & Shoulders */}
              <path d="M 60 70 L 140 70 L 130 145 L 70 145 Z" fill="url(#bodyGrad)" stroke="#00f0ff" strokeWidth="1.5" />

              {/* Arms */}
              <line x1="60" y1="70" x2="35" y2="145" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="140" y1="70" x2="165" y2="145" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />

              {/* Legs */}
              <line x1="82" y1="145" x2="75" y2="280" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
              <line x1="118" y1="145" x2="125" y2="280" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />

              {/* Highlight Overlay Bands */}
              {activeKey === 'shoulder_cm' && (
                <line x1="50" y1="70" x2="150" y2="70" stroke="#ffffff" strokeWidth="3.5" filter="url(#glow)" />
              )}
              {activeKey === 'neck_cm' && (
                <ellipse cx="100" cy="62" rx="14" ry="5" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
              )}
              {activeKey === 'chest_cm' && (
                <ellipse cx="100" cy="95" rx="35" ry="8" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
              )}
              {activeKey === 'waist_cm' && (
                <ellipse cx="100" cy="135" rx="28" ry="7" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
              )}
              {activeKey === 'hip_cm' && (
                <ellipse cx="100" cy="160" rx="38" ry="9" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
              )}
              {activeKey === 'arm_length_cm' && (
                <line x1="60" y1="70" x2="35" y2="145" stroke="#ffffff" strokeWidth="4" filter="url(#glow)" />
              )}
              {activeKey === 'thigh_cm' && (
                <ellipse cx="80" cy="185" rx="14" ry="6" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />
              )}
              {activeKey === 'inseam_cm' && (
                <line x1="85" y1="145" x2="75" y2="280" stroke="#ffffff" strokeWidth="3.5" filter="url(#glow)" />
              )}
            </svg>

            {/* Audio Waveform Indicator */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isTTSActive 
                    ? 'bg-cyan-400 animate-pulse' 
                    : isListening ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                }`} />
                <span className="text-neutral-300">
                  {isProcessing 
                    ? 'Backend Parsing...' 
                    : isTTSActive 
                      ? 'Gnani Timbre Speaking...' 
                      : isListening ? 'Listening via STT...' : 'Mic Paused'}
                </span>
              </div>
              <button 
                onClick={() => {
                  timbreTTS.lastSpokenTimestamp = 0; // Allow immediate explicit repeat
                  speakInstruction(activeMeta.instruction);
                }}
                className="text-cyan-400 hover:text-white flex items-center gap-1 font-semibold"
                title="Hear Timbre instruction again"
              >
                <Volume2 className="w-3 h-3" />
                <span>Repeat</span>
              </button>
            </div>
          </div>

          {/* Timbre Spoken Instruction Box */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300 font-light leading-relaxed">
            <span className="text-cyan-400 font-medium font-mono text-[10px] block uppercase mb-0.5">
              Gnani Timbre Guidance:
            </span>
            "{activeMeta.instruction}"
          </div>

          {/* Microphone Action Button */}
          <button
            onClick={toggleListening}
            className={`w-full py-2.5 sm:py-3 rounded-2xl text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
              isListening
                ? 'bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-pulse'
                : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Voice Listening</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Measurements List & Validation / Confirmation Card (7 Cols) */}
        <div className="md:col-span-7 space-y-3 sm:space-y-3.5">
          
          {/* Upper / Lower Body Category Selector Tabs */}
          <div className="flex rounded-xl bg-neutral-900/80 p-1 border border-white/10">
            <button
              onClick={() => {
                setActiveCategory('upper');
                activeCategoryRef.current = 'upper';
                const remaining = GUIDED_BODY_FLOW.upper.find(k => !confirmedKeys.has(k)) || 'chest_cm';
                setActiveKey(remaining);
                activeKeyRef.current = remaining;
                setPendingExtraction(null);
                pendingExtractionRef.current = null;
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'upper'
                  ? 'bg-white text-black font-semibold shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Upper Body</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isUpperComplete 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : activeCategory === 'upper' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {isUpperComplete ? '✓ Complete' : `${upperConfirmedCount}/${GUIDED_BODY_FLOW.upper.length}`}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveCategory('lower');
                activeCategoryRef.current = 'lower';
                const remaining = GUIDED_BODY_FLOW.lower.find(k => !confirmedKeys.has(k)) || 'waist_cm';
                setActiveKey(remaining);
                activeKeyRef.current = remaining;
                setPendingExtraction(null);
                pendingExtractionRef.current = null;
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'lower'
                  ? 'bg-white text-black font-semibold shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Lower Body</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLowerComplete 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : activeCategory === 'lower' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {isLowerComplete ? '✓ Complete' : `${lowerConfirmedCount}/${GUIDED_BODY_FLOW.lower.length}`}
              </span>
            </button>
          </div>

          {/* Live Recognized Speech Transcript Box */}
          <div className="p-2.5 sm:p-3 rounded-xl glass-panel border border-cyan-500/30 bg-[#080d19]/90 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Gnani Prisma Audio STT (MediaRecorder):</span>
              </span>
              <span className="text-neutral-400">{isListening ? 'Live Listening...' : 'Waiting for voice input'}</span>
            </div>
            <div className="font-mono text-xs sm:text-sm text-white italic min-h-[20px]">
              {speechTranscript ? `"${speechTranscript}"` : <span className="text-neutral-500 font-light text-xs">Speak your measurements (e.g. "My chest is 98 centimetres and my waist is 82 centimetres")...</span>}
            </div>
          </div>

          {/* Extracted Measurements & Multi-Measurement Confirmation Card */}
          {pendingExtraction && pendingExtraction.measurements && pendingExtraction.measurements.length > 0 && (
            <div className="p-3 sm:p-3.5 rounded-xl border bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all animate-fadeIn space-y-2.5">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                    Gnani Prisma Recognized Measurements
                  </span>
                  <p className="text-[10px] text-neutral-400">
                    Awaiting confirmation from user before saving to profile
                  </p>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-200 border border-cyan-500/40">
                  {pendingExtraction.measurements.length} Detected
                </span>
              </div>

              {/* List of Detected Measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pendingExtraction.measurements.map((m, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 sm:p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {m.dimensionLabel}
                      </div>
                      <div className="text-[9px] text-neutral-400 font-mono truncate max-w-[120px]">
                        "{m.clauseText || speechTranscript}"
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-base sm:text-lg font-bold text-cyan-300">
                        {m.value_cm} <span className="text-[10px] font-mono font-normal text-neutral-400">cm</span>
                      </div>
                      {m.isValid ? (
                        <span className="text-[9px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-amber-400 flex items-center justify-end gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Out of range</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Gnani Timbre Prompt Display */}
              {pendingExtraction.confirmationPrompt && (
                <div className="p-2 rounded-lg bg-white/[0.04] text-[10px] font-mono text-cyan-200 border border-cyan-500/20 flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span>Gnani Timbre: "{pendingExtraction.confirmationPrompt}"</span>
                </div>
              )}

              {/* Confirmation Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => confirmAllPending(pendingExtraction.measurements)}
                  className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-[11px] uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confirm Measurements</span>
                </button>
                <button
                  onClick={() => {
                    setPendingExtraction(null);
                    pendingExtractionRef.current = null;
                  }}
                  className="py-2 px-3 rounded-lg border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
                >
                  Speak Again
                </button>
              </div>
            </div>
          )}

          {/* Interactive Measurements List */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400 px-1">
              <span>{activeCategory === 'upper' ? `Upper Body Dimensions (1 to ${GUIDED_BODY_FLOW.upper.length})` : `Lower Body Dimensions (1 to ${GUIDED_BODY_FLOW.lower.length})`}</span>
              <span>Confirmed Value</span>
            </div>

            {categoryDimensions.map(([dimKey, meta]) => {
              const isActive = activeKey === dimKey;
              const isConfirmed = confirmedKeys.has(dimKey);
              const currentVal = measurements[dimKey];

              return (
                <div
                  key={dimKey}
                  onClick={() => handleSelectDimension(dimKey)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/40'
                      : 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-cyan-400 text-black' : isConfirmed ? 'bg-emerald-950 text-emerald-400' : 'bg-white/5 text-neutral-400'
                    }`}>
                      {isConfirmed ? <Check className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 mr-1">#{meta.stepNumber}</span>
                        <span>{meta.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                      </div>
                      <div className="text-[9px] text-neutral-400 font-light">
                        {meta.spokenAliases[meta.spokenAliases.length - 1]}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2.5">
                    <div className="font-serif text-base sm:text-lg font-bold text-white">
                      {currentVal ? (
                        <>
                          {currentVal} <span className="text-[10px] font-mono font-normal text-neutral-400">cm</span>
                        </>
                      ) : (
                        <span className="text-neutral-500 font-mono text-sm">—</span>
                      )}
                    </div>
                    {isConfirmed ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        Saved ✓
                      </span>
                    ) : currentVal && isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmExtractedValue(dimKey, currentVal);
                        }}
                        className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors shadow"
                        title="Confirm this value and move to next dimension"
                      >
                        Confirm ✓
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Voice Simulator Test Section (Compound utterances & step phrases) */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                Voice Simulator Tests:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadDemoValues}
                  className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono hover:bg-amber-500/30 transition-all font-semibold"
                  title="Populate complete 42R demo profile (4 upper + 4 lower dimensions)"
                >
                  ✦ Fill 42R Demo
                </button>
                <span className="text-[9px] font-mono text-cyan-400">1-Click Test</span>
              </div>
            </div>

            {/* Target Compound Experience Requested */}
            <div className="p-2 rounded-xl bg-neutral-900/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
              <div className="text-[10px] font-mono text-cyan-300 truncate">
                Target: "My chest is 98 cm and waist is 82 cm"
              </div>
              <button
                onClick={() => handleQuickSpeechTest("My chest is 98 centimetres and my waist is 82 centimetres.")}
                className="px-2.5 py-1 rounded-md bg-cyan-400 text-black font-semibold text-[9px] font-mono hover:bg-cyan-300 transition-all shadow whitespace-nowrap self-end sm:self-auto"
              >
                Test Compound Input
              </button>
            </div>

            {/* Hindi / Hinglish and Active step phrases */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleQuickSpeechTest("Mera chest 98 centimetre aur kamar 82 cm hai")}
                className="px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 text-[9px] font-mono text-neutral-300 hover:text-white hover:border-cyan-400/50 transition-all"
              >
                "Mera chest 98 cm aur kamar 82 cm"
              </button>
              {(activeMeta.testPhrases || ['My measurement is 98 cm.']).slice(0, 2).map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSpeechTest(phrase)}
                  className="px-2 py-0.5 rounded-md bg-neutral-900 border border-white/10 text-[9px] font-mono text-neutral-300 hover:text-white hover:border-cyan-400/50 transition-all"
                >
                  "{phrase}"
                </button>
              ))}
              <button
                onClick={() => handleQuickSpeechTest('Confirm')}
                className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 hover:bg-cyan-900 transition-all font-semibold"
              >
                "Confirm"
              </button>
            </div>
          </div>

          {/* Save to Profile Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onBack}
              className="py-2.5 px-4 rounded-full border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSaveAll}
              className={`flex-1 py-2.5 sm:py-3 rounded-full font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                isAllComplete
                  ? 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.4)] animate-pulse'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <span>Save Universal Body Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
