/**
 * FitMatch AI Voice Measurement Service
 * Secure Backend Proxy Architecture (FastAPI + Gnani Prisma STT & Timbre TTS)
 * 
 * Architecture:
 * - React Frontend: Microphone capture, audio playback, measurement UI
 * - FastAPI Backend (http://localhost:8000): Secure proxy, validation, fallback management
 * - Gnani Prisma: Speech-to-Text (STT)
 * - Gnani Timbre: Text-to-Speech (TTS)
 * - FitMatch AI: Multi-measurement extraction, confirmation & body profile
 * 
 * ZERO secrets are stored in or exposed by the frontend bundle.
 */

import { MEASUREMENT_BOUNDS } from '../engine/types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Backend Voice Proxy Status & Key Pool Listener
 */
class BackendVoiceManager {
  constructor() {
    this.status = {
      isBackendOnline: false,
      hasKeys: false,
      activeKeyId: 'primary',
      activeKeyLabel: 'Primary Key',
      isAllExhausted: false,
      badgeText: 'Connecting to Secure Voice Backend...',
      isCloudActive: false,
      voiceCloneId: 'tailor_concierge',
      lang: 'en-IN'
    };
    this.listeners = new Set();
    this.checkHealth();
  }

  addStatusListener(fn) {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.status); } catch (e) { console.warn(e); }
    });
  }

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/status`, {
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const pool = data.keyPool || {};
        const isCloud = pool.has_keys && !pool.all_exhausted;

        let badge = '✦ Secure Proxy • Local Speech Engine';
        if (isCloud) {
          badge = pool.active_key_id === 'primary'
            ? '✦ Gnani Cloud (Primary Key Active)'
            : `✦ Gnani Cloud (${pool.active_key_label || 'Fallback'} Active • Failover)`;
        } else if (pool.all_exhausted) {
          badge = 'Local Engine (Cloud Quota Exhausted)';
        }

        this.status = {
          isBackendOnline: true,
          hasKeys: Boolean(pool.has_keys),
          activeKeyId: pool.active_key_id || null,
          activeKeyLabel: pool.active_key_label || 'Primary Key',
          isAllExhausted: Boolean(pool.all_exhausted),
          badgeText: badge,
          isCloudActive: isCloud,
          voiceCloneId: data.gnaniConfig?.voiceCloneId || 'tailor_concierge',
          lang: data.gnaniConfig?.lang || 'en-IN'
        };
      } else {
        this.status = {
          ...this.status,
          isBackendOnline: false,
          badgeText: 'Local Neural Speech Engine (Backend Offline)',
          isCloudActive: false
        };
      }
    } catch (err) {
      this.status = {
        ...this.status,
        isBackendOnline: false,
        badgeText: 'Local Neural Speech Engine (Standby)',
        isCloudActive: false
      };
    }
    this.notify();
  }

  getStatus() {
    return this.status;
  }
}

export const backendVoiceManager = new BackendVoiceManager();

// Compatibility alias for existing UI components
export const gnaniKeyPool = {
  getStatus: () => backendVoiceManager.getStatus(),
  addStatusListener: (fn) => backendVoiceManager.addStatusListener(fn)
};

export const GUIDED_BODY_FLOW = {
  upper: ['chest_cm', 'shoulder_cm', 'neck_cm', 'arm_length_cm'],
  lower: ['waist_cm', 'hip_cm', 'thigh_cm', 'inseam_cm']
};

export const DIMENSION_METADATA = {
  chest_cm: {
    key: 'chest_cm',
    label: 'Chest / Bust',
    spokenAliases: [
      'chest', 'bust', 'pecs', 'chest measurement', 'chest size', 
      'chess', 'chests', 'chast', 'chess size', 'around chest', 'around my chest',
      'chhati', 'seena', 'chaati'
    ],
    defaultCm: 98,
    category: 'upper',
    stepNumber: 1,
    totalSteps: 4,
    instruction: 'Please measure around the fullest part of your chest, keeping the tape level under your armpits.',
    stepPrompt: "First, let's measure your chest. Please measure around the fullest part of your chest, keeping the tape level under your arms.",
    confirmSpoken: 'Chest measurement confirmed.',
    testPhrases: ['My chest measurement is 98 centimetres.', 'Chest is 100 cm.', 'Chest size is 98 cm.']
  },
  shoulder_cm: {
    key: 'shoulder_cm',
    label: 'Shoulder Width',
    spokenAliases: [
      'shoulder', 'shoulders', 'shoulder width', 'shoulder span', 
      'across shoulders', 'sholder', 'sholders', 'soldier', 'across my shoulders',
      'kandha', 'kandhe', 'kandho'
    ],
    defaultCm: 45,
    category: 'upper',
    stepNumber: 2,
    totalSteps: 4,
    instruction: 'Measure across the back of your shoulders from one bone point to the other.',
    stepPrompt: 'Next, measure across the back of your shoulders from bone to bone.',
    confirmSpoken: 'Shoulder width confirmed.',
    testPhrases: ['Shoulder width is 45 centimetres.', 'Shoulders 46 cm.']
  },
  neck_cm: {
    key: 'neck_cm',
    label: 'Neck Circumference',
    spokenAliases: [
      'neck', 'collar', 'around neck', 'around my neck', 'my neck', 
      'neck circumference', 'neck size', 'throat', 'neck measurement',
      'gala', 'gale', 'kanth'
    ],
    defaultCm: 39,
    category: 'upper',
    stepNumber: 3,
    totalSteps: 4,
    instruction: 'Measure around the base of your neck where a tailored collar naturally sits.',
    stepPrompt: 'Next, measure around the base of your neck where a tailored collar naturally sits.',
    confirmSpoken: 'Neck measurement confirmed.',
    testPhrases: ['Neck is 39 centimetres.', 'Around neck is 41 cm.', 'My neck is 39 cm.']
  },
  waist_cm: {
    key: 'waist_cm',
    label: 'Waistline',
    spokenAliases: [
      'waist', 'waistline', 'stomach', 'belly', 'waist measurement', 'wasteline', 'around waist',
      'kamar', 'pet'
    ],
    defaultCm: 82,
    category: 'lower',
    stepNumber: 1,
    totalSteps: 4,
    instruction: 'Please measure around your natural waistline, midway between your lowest rib and navel.',
    stepPrompt: "Upper body complete! Now let's capture your lower body. First, please measure your natural waistline.",
    confirmSpoken: 'Waistline confirmed.',
    testPhrases: ['Waist is 32 inches.', 'Waistline 82 centimetres.']
  },
  hip_cm: {
    key: 'hip_cm',
    label: 'Hips / Seat',
    spokenAliases: [
      'hip', 'hips', 'seat', 'buttocks', 'around hips', 'hip measurement', 'hips measurement',
      'kulhe'
    ],
    defaultCm: 96,
    category: 'lower',
    stepNumber: 2,
    totalSteps: 4,
    instruction: 'Stand with your feet together and measure around the fullest circumference of your hips.',
    stepPrompt: 'Next, stand with feet together and measure around the fullest part of your hips.',
    confirmSpoken: 'Hip measurement confirmed.',
    testPhrases: ['Hips are 96 centimetres.', 'Seat is 38 inches.']
  },
  arm_length_cm: {
    key: 'arm_length_cm',
    label: 'Arm / Sleeve Length',
    spokenAliases: [
      'arm length', 'arm', 'arms', 'sleeve', 'sleeves', 'sleeve length', 'sleeve size',
      'baanh', 'bazu', 'haath'
    ],
    defaultCm: 63,
    category: 'upper',
    stepNumber: 4,
    totalSteps: 4,
    instruction: 'Measure from your shoulder point along the outer arm to your wrist bone.',
    stepPrompt: 'Finally for upper body, measure from your shoulder point down to your wrist bone.',
    confirmSpoken: 'Arm and sleeve length confirmed.',
    testPhrases: ['Sleeve length is 63 centimetres.', 'Arm length 62 cm.']
  },
  thigh_cm: {
    key: 'thigh_cm',
    label: 'Thigh Circumference',
    spokenAliases: [
      'thigh', 'thighs', 'around thigh', 'thigh circumference', 'thigh measurement',
      'jaangh', 'jangh', 'raan'
    ],
    defaultCm: 56,
    category: 'lower',
    stepNumber: 3,
    totalSteps: 4,
    instruction: 'Measure around the fullest part of your upper thigh just below the crotch.',
    stepPrompt: 'Next, measure around the fullest part of your upper thigh just below your crotch.',
    confirmSpoken: 'Thigh circumference confirmed.',
    testPhrases: ['Thigh is 56 centimetres.', 'Around thigh 55 cm.']
  },
  inseam_cm: {
    key: 'inseam_cm',
    label: 'Inseam (Inner Leg)',
    spokenAliases: [
      'inseam', 'inner leg', 'crotch to ankle', 'pant length', 'in seam', 'inside leg', 'leg length',
      'pair', 'taang'
    ],
    defaultCm: 80,
    category: 'lower',
    stepNumber: 4,
    totalSteps: 4,
    instruction: 'Measure vertically along your inner leg seam from your crotch down to your ankle bone.',
    stepPrompt: 'Finally, measure vertically along your inner leg seam from crotch to ankle bone.',
    confirmSpoken: 'Inseam confirmed.',
    testPhrases: ['Inseam is 80 centimetres.', 'Inseam 31 inches.']
  },
  height_cm: {
    key: 'height_cm',
    label: 'Total Height',
    spokenAliases: ['height', 'tall', 'stature', 'body height', 'lambai', 'kad', 'kadd'],
    defaultCm: 178,
    category: 'upper',
    stepNumber: 0,
    totalSteps: 4,
    instruction: 'Stand straight against a flat wall, measuring from floor to the top of your head.',
    stepPrompt: 'Total height measured.',
    confirmSpoken: 'Total height confirmed.',
    testPhrases: ['Height is 178 centimetres.']
  }
};

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, point: '.', half: 0.5
};

/**
 * Local fallback natural language measurement parser
 * Used when backend is unavailable or offline
 */
export function parseSpokenMeasurement(transcript, activeDimensionKey = 'chest_cm') {
  if (!transcript || typeof transcript !== 'string') {
    return { success: false, error: 'Empty transcript' };
  }

  const clean = transcript.toLowerCase().trim();

  // 1. Check for confirmation / rejection intents
  if (/\b(confirm|yes|correct|save|lock it|good|that is right|approve|done|proceed|sahi hai|haan|theek hai)\b/i.test(clean) && !/\d+/.test(clean)) {
    return {
      success: true,
      intent: 'confirm',
      rawText: transcript
    };
  }

  if (/\b(cancel|no|wrong|redo|clear|stop|reject|repeat|nahi|galat|dobara|badlo)\b/i.test(clean) && !/\d+/.test(clean)) {
    return {
      success: true,
      intent: 'reject',
      rawText: transcript
    };
  }

  // 2. Identify target body dimension
  let detectedDimensionKey = activeDimensionKey;
  let maxMatchedLength = 0;

  for (const [key, meta] of Object.entries(DIMENSION_METADATA)) {
    for (const alias of meta.spokenAliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`, 'i');
      if (wordRegex.test(clean)) {
        if (alias.length > maxMatchedLength) {
          detectedDimensionKey = key;
          maxMatchedLength = alias.length;
        }
      }
    }
  }

  // 3. Extract numerical value
  let numericalValue = null;
  const digitMatch = clean.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    numericalValue = parseFloat(digitMatch[1]);
  } else {
    const words = clean.split(/[\s-]+/);
    let accumulated = 0;
    let foundNumber = false;

    for (const w of words) {
      if (NUMBER_WORDS[w] !== undefined) {
        foundNumber = true;
        const val = NUMBER_WORDS[w];
        if (val === 100) {
          accumulated = (accumulated || 1) * 100;
        } else {
          accumulated += val;
        }
      }
    }
    if (foundNumber && accumulated > 0) {
      numericalValue = accumulated;
    }
  }

  if (numericalValue === null || isNaN(numericalValue)) {
    return {
      success: false,
      intent: 'unknown_number',
      rawText: transcript,
      detectedDimension: detectedDimensionKey,
      error: 'Could not detect a numerical value. Please say e.g., "My chest is 98 centimetres".'
    };
  }

  // 4. Identify Unit (Inches vs Centimeters)
  let unitSpoken = 'cm';
  let valueInCm = numericalValue;

  if (clean.includes('inch') || clean.includes('inches') || clean.includes('inche')) {
    unitSpoken = 'inches';
    valueInCm = Math.round(numericalValue * 2.54 * 10) / 10;
  } else {
    unitSpoken = 'cm';
    valueInCm = Math.round(numericalValue * 10) / 10;
  }

  // 5. Physiological Bounds Validation
  const bounds = MEASUREMENT_BOUNDS[detectedDimensionKey] || { min: 40, max: 200, label: 'Dimension' };
  const isValid = valueInCm >= bounds.min && valueInCm <= bounds.max;
  const meta = DIMENSION_METADATA[detectedDimensionKey] || { label: 'Measurement' };

  let warning = null;
  if (!isValid) {
    warning = `${meta.label} of ${valueInCm} cm is outside typical physiological range (${bounds.min} - ${bounds.max} cm). Please verify or repeat.`;
  }

  return {
    success: true,
    intent: 'measurement',
    dimensionKey: detectedDimensionKey,
    dimensionLabel: meta.label,
    rawText: transcript,
    value_cm: valueInCm,
    originalValue: numericalValue,
    unitSpoken,
    isValid,
    warning,
    bounds,
    measurements: [{
      dimensionKey: detectedDimensionKey,
      dimensionLabel: meta.label,
      value_cm: valueInCm,
      originalValue: numericalValue,
      unitSpoken,
      isValid,
      warning,
      bounds
    }],
    confirmationPrompt: isValid 
      ? `Your ${meta.label} is ${valueInCm} centimetres. Is that correct?`
      : warning
  };
}

/**
 * Backend Voice API Client
 * Sends speech transcripts or audio to the secure FastAPI proxy
 */
export async function extractMeasurementsViaBackend(transcript, activeDimensionKey = 'chest_cm') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/voice/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        default_dimension: activeDimensionKey
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        rawText: transcript
      };
    }
  } catch (err) {
    console.warn('[Backend Voice Proxy] Offline or unreachable, using local fallback:', err);
  }

  // Fallback to client-side extraction
  return parseSpokenMeasurement(transcript, activeDimensionKey);
}

/**
 * Text-to-Speech Engine
 * Routes through FastAPI backend proxy (POST /api/voice/tts) to Gnani Timbre,
 * falling back seamlessly to Web Speech API if backend requests fallback or is offline.
 */
class TimbreTTSEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.muted = false;
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.activeUtterances = new Set();
    this.speakingListeners = new Set();
    this.pendingTimeout = null;
    this.currentAudio = null;

    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        this.selectedVoice = 
          voices.find(v => v.lang.includes('en-GB') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Google UK English')) ||
          voices.find(v => v.lang.startsWith('en')) || 
          voices[0];
      };

      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  }

  addSpeakingListener(fn) {
    this.speakingListeners.add(fn);
    return () => this.speakingListeners.delete(fn);
  }

  notifySpeaking(speaking) {
    this.isSpeaking = speaking;
    this.speakingListeners.forEach(fn => {
      try { fn(speaking); } catch (e) { console.warn(e); }
    });
  }

  speak(text, onEnd) {
    if (this.muted || !text) {
      if (onEnd) onEnd();
      return;
    }

    this.speakWithBackendProxy(text, onEnd);
  }

  async speakWithBackendProxy(text, onEnd) {
    try {
      this.stop();
      this.notifySpeaking(true);

      const status = backendVoiceManager.getStatus();

      const res = await fetch(`${API_BASE_URL}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: status.voiceCloneId || 'tailor_concierge',
          lang: status.lang || 'en-IN',
          speed: 0.95
        })
      });

      // If backend indicates fallback (e.g. quota exhausted or cloud unreachable)
      if (res.headers.get('X-Voice-Fallback') === 'true' || !res.ok) {
        console.log('[TTS Proxy] Backend requested local fallback:', res.headers.get('X-Voice-Error') || `HTTP ${res.status}`);
        backendVoiceManager.checkHealth(); // Refresh status badge
        this.speakLocal(text, onEnd);
        return;
      }

      const audioBlob = await res.blob();
      if (audioBlob.size === 0) {
        this.speakLocal(text, onEnd);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.notifySpeaking(false);
        if (onEnd) onEnd();
      };

      this.currentAudio.onerror = (e) => {
        console.warn('[TTS Proxy] Audio playback failed, using local speech:', e);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.speakLocal(text, onEnd);
      };

      await this.currentAudio.play();

    } catch (err) {
      console.warn('[TTS Proxy] Connection error, using local speech fallback:', err);
      this.speakLocal(text, onEnd);
    }
  }

  speakLocal(text, onEnd) {
    if (this.muted || !this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }

    this.pendingTimeout = setTimeout(() => {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }

        const cleanText = text.replace(/([.?!])\s+/g, '$1, ');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.rate = 0.96;
        utterance.pitch = 1.0;

        this.activeUtterances.add(utterance);

        utterance.onstart = () => {
          this.notifySpeaking(true);
        };

        const cleanup = () => {
          this.activeUtterances.delete(utterance);
          this.notifySpeaking(false);
          if (onEnd) onEnd();
        };

        utterance.onend = cleanup;
        utterance.onerror = () => cleanup();

        this.synth.speak(utterance);
      } catch (err) {
        console.warn('TTS speak error:', err);
        this.notifySpeaking(false);
        if (onEnd) onEnd();
      }
    }, 60);
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.activeUtterances.clear();
      this.notifySpeaking(false);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stop();
    }
    return this.muted;
  }
}

/**
 * Speech-to-Text Engine
 * Uses continuous browser speech recognition with accent calibration
 * and routes speech to backend /api/voice/extract for multi-measurement parsing
 */
class PrismaSTTEngine {
  constructor(onTranscript, onStateChange, ttsInstance = null) {
    this.onTranscript = onTranscript;
    this.onStateChange = onStateChange;
    this.ttsInstance = ttsInstance;
    this.recognition = null;
    this.isListening = false;
    this.shouldListen = false;
    this.restartTimer = null;

    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStateChange) this.onStateChange('listening');
      };

      this.recognition.onresult = (event) => {
        if (this.ttsInstance && this.ttsInstance.isSpeaking) {
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript + ' ';
          }
        }

        const cleanFinal = finalTranscript.trim();
        const cleanInterim = interimTranscript.trim();

        if (this.onTranscript && (cleanFinal || cleanInterim)) {
          this.onTranscript({
            interim: cleanInterim,
            final: cleanFinal
          });
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          return;
        }
        console.warn('STT recognition notice:', event.error);
        if (this.onStateChange) this.onStateChange('error', event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;

        if (this.shouldListen) {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.shouldListen && !this.isListening) {
              try {
                this.recognition.start();
              } catch (e) {}
            }
          }, 150);
        } else {
          if (this.onStateChange) this.onStateChange('inactive');
        }
      };
    }
  }

  start() {
    this.shouldListen = true;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Speech recognition start failed or already active:', e);
      }
    }
  }

  stop() {
    this.shouldListen = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Speech recognition stop failed:', e);
      }
    }
  }

  isSupported() {
    return Boolean(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
  }
}

export const timbreTTS = new TimbreTTSEngine();
export { PrismaSTTEngine };
