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
  Layers
} from 'lucide-react';
import { 
  DIMENSION_METADATA, 
  GUIDED_BODY_FLOW,
  parseSpokenMeasurement, 
  timbreTTS, 
  PrismaSTTEngine,
  gnaniKeyPool
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

  // Customer measurements state (in cm)
  const [measurements, setMeasurements] = useState({
    chest_cm: initialProfile?.measurements?.chest_cm || 98,
    shoulder_cm: initialProfile?.measurements?.shoulder_cm || 45,
    neck_cm: initialProfile?.measurements?.neck_cm || 39,
    waist_cm: initialProfile?.measurements?.waist_cm || 82,
    hip_cm: initialProfile?.measurements?.hip_cm || 96,
    inseam_cm: initialProfile?.measurements?.inseam_cm || 80,
    height_cm: initialProfile?.height_cm || 178
  });
  const measurementsRef = useRef(measurements);
  useEffect(() => { measurementsRef.current = measurements; }, [measurements]);

  // Track which measurements have been confirmed (guided flow starts fresh)
  const [confirmedKeys, setConfirmedKeys] = useState(new Set());
  const confirmedKeysRef = useRef(new Set());
  useEffect(() => { confirmedKeysRef.current = confirmedKeys; }, [confirmedKeys]);

  // Voice Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [lastExtracted, setLastExtracted] = useState(null);
  const lastExtractedRef = useRef(null);
  useEffect(() => { lastExtractedRef.current = lastExtracted; }, [lastExtracted]);

  const [isMuted, setIsMuted] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [isSTTSupported, setIsSTTSupported] = useState(true);
  const [cloudStatus, setCloudStatus] = useState(gnaniKeyPool.getStatus());

  const sttEngineRef = useRef(null);
  const interimDebounceRef = useRef(null);

  // Subscribe to Gnani Key Pool failover status
  useEffect(() => {
    return gnaniKeyPool.addStatusListener((status) => {
      setCloudStatus(status);
    });
  }, []);

  // Initialize Speech Recognition with continuous live microphone streaming
  useEffect(() => {
    sttEngineRef.current = new PrismaSTTEngine(
      ({ interim, final }) => {
        const text = final || interim;
        setSpeechTranscript(text);

        if (final && final.trim().length > 0) {
          if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
          handleVoiceInput(final);
        } else if (interim && interim.trim().length > 0) {
          // Live stream calibration: if interim contains digits or confirmation, process after natural 800ms pause
          if (/\d+/.test(interim) || /\b(confirm|yes|correct|save)\b/i.test(interim)) {
            if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
            interimDebounceRef.current = setTimeout(() => {
              handleVoiceInput(interim);
            }, 800);
          }
        }
      },
      (state, error) => {
        if (state === 'listening') setIsListening(true);
        if (state === 'inactive') setIsListening(false);
        if (state === 'error' && error !== 'no-speech') {
          console.warn('STT Error:', error);
        }
      },
      timbreTTS
    );

    setIsSTTSupported(sttEngineRef.current.isSupported());

    // Auto-start microphone listening immediately
    sttEngineRef.current.start();
    setIsListening(true);

    // Speak initial welcoming instruction strictly for Upper Body Step 1 (Chest)
    const activeMeta = DIMENSION_METADATA.chest_cm;
    if (activeMeta && !isMuted) {
      speakInstruction(`Voice Measurement Mode active. Let's start with your upper body. ${activeMeta.stepPrompt}`);
    }

    return () => {
      if (interimDebounceRef.current) clearTimeout(interimDebounceRef.current);
      if (sttEngineRef.current) {
        sttEngineRef.current.stop();
      }
      timbreTTS.stop();
    };
  }, []);

  const speakInstruction = (text) => {
    if (isMuted) return;
    setIsTTSActive(true);
    timbreTTS.speak(text, () => {
      setIsTTSActive(false);
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

  const handleVoiceInput = (rawTranscript) => {
    // Always use activeKeyRef to avoid stale closures from the speech recognition listener
    const currentActiveKey = activeKeyRef.current;
    const result = parseSpokenMeasurement(rawTranscript, currentActiveKey);

    if (result.intent === 'confirm') {
      // Voice confirmation intent: "Confirm" / "Yes"
      const pending = lastExtractedRef.current;
      if (pending && pending.isValid) {
        confirmExtractedValue(pending.dimensionKey, pending.value_cm);
      } else {
        // Confirm the active key's current value
        const currKey = activeKeyRef.current;
        confirmExtractedValue(currKey, measurementsRef.current[currKey]);
      }
      return;
    }

    if (result.intent === 'reject') {
      setLastExtracted(null);
      lastExtractedRef.current = null;
      setSpeechTranscript('');
      const currKey = activeKeyRef.current;
      speakInstruction(`Cancelled. Please say your ${DIMENSION_METADATA[currKey]?.label} again.`);
      return;
    }

    if (result.success && result.value_cm) {
      setLastExtracted(result);
      lastExtractedRef.current = result;

      if (result.isValid) {
        // Speak confirmation prompt via Gnani Timbre
        speakInstruction(`${result.dimensionLabel} captured at ${result.value_cm} centimetres. Say "Confirm" or tap below.`);
      } else {
        speakInstruction(result.warning);
      }
    } else if (result.error) {
      speakInstruction(result.error);
    }
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

    setLastExtracted(null);
    lastExtractedRef.current = null;
    setSpeechTranscript('');

    const upperKeys = GUIDED_BODY_FLOW.upper;
    const lowerKeys = GUIDED_BODY_FLOW.lower;
    const currentCategory = activeCategoryRef.current;

    // Check if we are currently in the Upper Body sequence
    if (currentCategory === 'upper') {
      const remainingUpper = upperKeys.filter(k => !updatedConfirmed.has(k));

      if (remainingUpper.length > 0) {
        // Step to next upper body measurement
        const nextKey = remainingUpper[0];
        setActiveKey(nextKey);
        activeKeyRef.current = nextKey;
        const nextMeta = DIMENSION_METADATA[nextKey];
        speakInstruction(`${DIMENSION_METADATA[targetKey]?.label} confirmed. ${nextMeta.stepPrompt}`);
      } else {
        // All upper body measurements are done! Transition to Lower Body!
        setActiveCategory('lower');
        activeCategoryRef.current = 'lower';
        const firstLowerKey = lowerKeys[0];
        setActiveKey(firstLowerKey);
        activeKeyRef.current = firstLowerKey;
        const nextMeta = DIMENSION_METADATA[firstLowerKey];
        speakInstruction(`Upper body complete! Now let's capture your lower body measurements. ${nextMeta.stepPrompt}`);
      }
    } else {
      // Currently in Lower Body sequence
      const remainingLower = lowerKeys.filter(k => !updatedConfirmed.has(k));

      if (remainingLower.length > 0) {
        // Step to next lower body measurement
        const nextKey = remainingLower[0];
        setActiveKey(nextKey);
        activeKeyRef.current = nextKey;
        const nextMeta = DIMENSION_METADATA[nextKey];
        speakInstruction(`${DIMENSION_METADATA[targetKey]?.label} confirmed. ${nextMeta.stepPrompt}`);
      } else {
        // All upper and lower body measurements are completed!
        speakInstruction(`Outstanding! All upper and lower body measurements are confirmed. You can now save your universal profile.`);
      }
    }
  };

  const handleSelectDimension = (key) => {
    setActiveKey(key);
    activeKeyRef.current = key;
    setLastExtracted(null);
    lastExtractedRef.current = null;
    setSpeechTranscript('');
    const meta = DIMENSION_METADATA[key];
    if (meta) {
      setActiveCategory(meta.category);
      activeCategoryRef.current = meta.category;
      speakInstruction(`Selected ${meta.label}. ${meta.instruction}`);
    }
  };

  const handleQuickSpeechTest = (testPhrase) => {
    setSpeechTranscript(testPhrase);
    handleVoiceInput(testPhrase);
  };

  const handleSaveAll = () => {
    onSave({
      height_cm: measurements.height_cm,
      weight_kg: initialProfile?.weight_kg || 72,
      measurements: {
        neck_cm: measurements.neck_cm,
        shoulder_cm: measurements.shoulder_cm,
        chest_cm: measurements.chest_cm,
        waist_cm: measurements.waist_cm,
        hip_cm: measurements.hip_cm,
        inseam_cm: measurements.inseam_cm,
        arm_length_cm: initialProfile?.measurements?.arm_length_cm || 62,
        thigh_cm: initialProfile?.measurements?.thigh_cm || 56
      },
      measurement_metadata: {
        source: "voice_gnani_guided",
        confidence_score: 0.99,
        verified_by_user: true
      }
    });
  };

  // Structured in exact sequential order: Upper (Neck -> Shoulder -> Chest) and Lower (Waist -> Hips -> Inseam)
  const currentCategoryKeys = GUIDED_BODY_FLOW[activeCategory] || [];
  const categoryDimensions = currentCategoryKeys.map(k => [k, DIMENSION_METADATA[k]]);
  const activeMeta = DIMENSION_METADATA[activeKey] || DIMENSION_METADATA.neck_cm;

  // Status counters
  const upperConfirmedCount = GUIDED_BODY_FLOW.upper.filter(k => confirmedKeys.has(k)).length;
  const lowerConfirmedCount = GUIDED_BODY_FLOW.lower.filter(k => confirmedKeys.has(k)).length;
  const isUpperComplete = upperConfirmedCount === GUIDED_BODY_FLOW.upper.length;
  const isAllComplete = isUpperComplete && lowerConfirmedCount === GUIDED_BODY_FLOW.lower.length;

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-semibold">
              Voice-Guided Measurement Mode
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
          <h3 className="font-serif text-2xl text-white font-medium mt-1">
            Hands-Free Voice Calibration
          </h3>
          <p className="text-xs text-neutral-400 font-light mt-0.5">
            Hold your measuring tape and speak naturally. Say e.g. <span className="text-cyan-300 font-mono italic">"{activeMeta.testPhrases?.[0] || 'My measurement is 98 cm'}"</span>
          </p>
        </div>

        {/* Audio Speaker Mute Toggle */}
        <div className="flex items-center gap-2">
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
            title={isMuted ? 'Unmute Gnani Timbre Voice' : 'Mute Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Visual Anatomical Guidance & Voice Waveform HUD (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl glass-panel p-5 border border-white/10 bg-[#070913] flex flex-col justify-between space-y-4">
          
          {/* Active Target Banner */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
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
          <div className="relative w-full h-56 rounded-xl bg-gradient-to-b from-[#030611] to-[#0a0f1d] border border-cyan-500/20 flex items-center justify-center overflow-hidden">
            
            {/* SVG Anatomical Silhouette with Highlighted Target Zone */}
            <svg viewBox="0 0 200 320" className="w-full h-full max-h-52 object-contain opacity-85">
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
              {activeKey === 'inseam_cm' && (
                <line x1="85" y1="145" x2="75" y2="280" stroke="#ffffff" strokeWidth="3.5" filter="url(#glow)" />
              )}
            </svg>

            {/* Audio Waveform Indicator */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between glass-pill px-3 py-1.5 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
                <span className="text-neutral-300">
                  {isListening ? 'Listening via Prisma STT...' : 'Mic Paused'}
                </span>
              </div>
              <button 
                onClick={() => speakInstruction(activeMeta.instruction)}
                className="text-cyan-400 hover:text-white flex items-center gap-1 font-semibold"
                title="Hear Timbre instruction again"
              >
                <Volume2 className="w-3 h-3" />
                <span>Repeat</span>
              </button>
            </div>
          </div>

          {/* Timbre Spoken Instruction Box */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300 font-light leading-relaxed">
            <span className="text-cyan-400 font-medium font-mono text-[10px] block uppercase mb-1">
              Gnani Timbre Guidance:
            </span>
            "{activeMeta.instruction}"
          </div>

          {/* Microphone Action Button */}
          <button
            onClick={toggleListening}
            className={`w-full py-3.5 rounded-2xl text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${
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
        <div className="md:col-span-7 space-y-5">
          
          {/* Upper / Lower Body Category Selector Tabs with Progress Badges */}
          <div className="flex rounded-xl bg-neutral-900/80 p-1 border border-white/10">
            <button
              onClick={() => {
                setActiveCategory('upper');
                // Select first unconfirmed upper key or default to chest
                const remaining = GUIDED_BODY_FLOW.upper.find(k => !confirmedKeys.has(k)) || 'chest_cm';
                setActiveKey(remaining);
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
                {isUpperComplete ? '✓ Complete' : `${upperConfirmedCount}/3`}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveCategory('lower');
                const remaining = GUIDED_BODY_FLOW.lower.find(k => !confirmedKeys.has(k)) || 'waist_cm';
                setActiveKey(remaining);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'lower'
                  ? 'bg-white text-black font-semibold shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Lower Body</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                lowerConfirmedCount === 3 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : activeCategory === 'lower' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {lowerConfirmedCount === 3 ? '✓ Complete' : `${lowerConfirmedCount}/3`}
              </span>
            </button>
          </div>

          {/* Live Recognized Speech Transcript Box */}
          <div className="p-3.5 rounded-2xl glass-panel border border-cyan-500/30 bg-[#080d19]/90 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Prisma Speech Recognition:</span>
              </span>
              <span className="text-neutral-400">{isListening ? 'Live Listening...' : 'Waiting for voice input'}</span>
            </div>
            <div className="font-mono text-sm text-white italic min-h-[24px]">
              {speechTranscript ? `"${speechTranscript}"` : <span className="text-neutral-500 font-light text-xs">Speak your measurement (e.g. "{activeMeta.testPhrases?.[0]}")...</span>}
            </div>
          </div>

          {/* Extracted Measurement & Confirmation Card (Steps 5, 6, 7 in prompt) */}
          {lastExtracted && (
            <div className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
              lastExtracted.isValid 
                ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
                : 'bg-amber-950/40 border-amber-500'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                    Extracted Measurement
                  </span>
                  <div className="font-serif text-3xl font-bold text-white mt-0.5">
                    {lastExtracted.dimensionLabel} — {lastExtracted.value_cm} cm
                  </div>
                  <div className="text-xs text-neutral-300 font-mono mt-1">
                    Spoken: "{lastExtracted.rawText}" • Unit: {lastExtracted.unitSpoken}
                  </div>
                </div>

                <div className="text-right">
                  {lastExtracted.isValid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      <Check className="w-3 h-3" />
                      <span>Validated ✓</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
                      <AlertCircle className="w-3 h-3" />
                      <span>Out of Bounds</span>
                    </span>
                  )}
                </div>
              </div>

              {lastExtracted.warning && (
                <p className="text-xs text-amber-300 mt-2 font-mono">
                  {lastExtracted.warning}
                </p>
              )}

              {/* Confirmation Action Buttons */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={() => confirmExtractedValue(lastExtracted.dimensionKey, lastExtracted.value_cm)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirm Value (or say "Confirm")</span>
                </button>
                <button
                  onClick={() => setLastExtracted(null)}
                  className="py-2.5 px-4 rounded-xl border border-white/10 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                >
                  Speak Again
                </button>
              </div>
            </div>
          )}

          {/* Interactive Measurements List (Exact Upper/Lower Sequence) */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400 px-1">
              <span>{activeCategory === 'upper' ? 'Upper Body Dimensions (1 to 3)' : 'Lower Body Dimensions (1 to 3)'}</span>
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
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/40'
                      : 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-cyan-400 text-black' : isConfirmed ? 'bg-emerald-950 text-emerald-400' : 'bg-white/5 text-neutral-400'
                    }`}>
                      {isConfirmed ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 mr-1">#{meta.stepNumber}</span>
                        <span>{meta.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-light">
                        {meta.spokenAliases[meta.spokenAliases.length - 1]}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div className="font-serif text-lg font-bold text-white">
                      {currentVal} <span className="text-xs font-mono font-normal text-neutral-400">cm</span>
                    </div>
                    {isConfirmed ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        Saved ✓
                      </span>
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

          {/* Quick Voice Simulator Test Pills (Adapts dynamically to the active step) */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block">
              Quick Voice Test Simulator for #{activeMeta.stepNumber} ({activeMeta.label}):
            </span>
            <div className="flex flex-wrap gap-2">
              {(activeMeta.testPhrases || ['My measurement is 98 cm.']).map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSpeechTest(phrase)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/10 text-[10px] font-mono text-neutral-300 hover:text-white hover:border-cyan-400/50 transition-all"
                >
                  "{phrase}"
                </button>
              ))}
              <button
                onClick={() => handleQuickSpeechTest('Confirm')}
                className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 hover:bg-cyan-900 transition-all font-semibold"
              >
                "Confirm"
              </button>
            </div>
          </div>

          {/* Save to Profile Action */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={onBack}
              className="py-3 px-5 rounded-full border border-white/10 text-xs font-mono text-neutral-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSaveAll}
              className={`flex-1 py-3.5 rounded-full font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
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

