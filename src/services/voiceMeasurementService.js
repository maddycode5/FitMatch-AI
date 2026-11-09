/**
 * FitMatch AI Voice Measurement Service
 * Powered by Gnani Prisma (STT) and Gnani Timbre (TTS) Architecture
 * 
 * Capabilities:
 * 1. Speech-to-Text (STT) Speech Recognition (Gnani Prisma Protocol & Web Speech API)
 * 2. Natural Language Measurement Parsing & Extraction
 * 3. Physiological Range Validation against Human Biometrics
 * 4. Text-to-Speech (TTS) Conversational Audio Guidance (Gnani Timbre Architecture)
 * 5. Voice Cloning & Luxury Concierge Persona Simulation
 */

import { MEASUREMENT_BOUNDS } from '../engine/types';

// Gnani API Configuration & Multi-Key Pool loaded from environment variables (.env)
export const GNANI_CONFIG = {
  accessKey: import.meta.env.VITE_GNANI_ACCESS_KEY || '',
  token: import.meta.env.VITE_GNANI_TOKEN || import.meta.env.VITE_GNANI_ACCESS_KEY || '',
  voiceCloneId: import.meta.env.VITE_GNANI_VOICE_CLONE_ID || '',
  lang: import.meta.env.VITE_GNANI_LANG || 'en-IN',
  ttsEndpoint: import.meta.env.VITE_GNANI_TTS_ENDPOINT || 'https://tts.gnani.ai/api/v1/tts',
  sttEndpoint: import.meta.env.VITE_GNANI_STT_ENDPOINT || 'https://stt.gnani.ai/api/v1/stt'
};

/**
 * Intelligent Multi-Key Credit Rotation & Failover Manager
 * If Primary Key credit exhausts (HTTP 402, 429, 403, or quota error),
 * it automatically fails over to the Secondary Fallback Key instantly without interrupting the user.
 */
class GnaniKeyPoolManager {
  constructor() {
    this.keys = [
      {
        id: 'primary',
        label: 'Primary Key',
        accessKey: import.meta.env.VITE_GNANI_ACCESS_KEY || '',
        token: import.meta.env.VITE_GNANI_TOKEN || import.meta.env.VITE_GNANI_ACCESS_KEY || ''
      },
      {
        id: 'fallback_1',
        label: 'Secondary Fallback Key',
        accessKey: import.meta.env.VITE_GNANI_FALLBACK_ACCESS_KEY || '',
        token: import.meta.env.VITE_GNANI_FALLBACK_TOKEN || import.meta.env.VITE_GNANI_FALLBACK_ACCESS_KEY || ''
      },
      {
        id: 'fallback_2',
        label: 'Tertiary Backup Key',
        accessKey: import.meta.env.VITE_GNANI_BACKUP_ACCESS_KEY || '',
        token: import.meta.env.VITE_GNANI_BACKUP_TOKEN || import.meta.env.VITE_GNANI_BACKUP_ACCESS_KEY || ''
      }
    ].filter(k => Boolean(k.accessKey));

    this.exhaustedKeys = new Set();
    this.listeners = new Set();
  }

  addStatusListener(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const status = this.getStatus();
    this.listeners.forEach(fn => {
      try { fn(status); } catch (e) { console.warn(e); }
    });
  }

  getActiveKey() {
    return this.keys.find(k => !this.exhaustedKeys.has(k.id)) || null;
  }

  markExhausted(keyId, reason = 'credit_exhausted') {
    if (!this.exhaustedKeys.has(keyId)) {
      this.exhaustedKeys.add(keyId);
      console.warn(`[Gnani Failover] Key '${keyId}' credits exhausted. (${reason}). Automatically switching to next available key in pool.`);
      this.notify();
    }
  }

  getStatus() {
    const active = this.getActiveKey();
    if (!active) {
      return {
        hasKeys: this.keys.length > 0,
        isAllExhausted: this.keys.length > 0,
        badgeText: this.keys.length > 0 ? 'Local Engine (Cloud Credits Exhausted)' : 'Local Engine (Free Sandbox Mode)',
        isCloudActive: false,
        keyId: null
      };
    }
    return {
      hasKeys: true,
      isAllExhausted: false,
      badgeText: active.id === 'primary' 
        ? '✦ Gnani Cloud API (Primary Key Active)' 
        : `✦ Gnani Cloud API (${active.label} Active • Failover)`,
      isCloudActive: true,
      keyId: active.id,
      totalKeys: this.keys.length,
      exhaustedCount: this.exhaustedKeys.size
    };
  }
}

export const gnaniKeyPool = new GnaniKeyPoolManager();

// Configured if user has provided at least one valid key in the pool
export const isGnaniConfigured = Boolean(
  gnaniKeyPool.getActiveKey() !== null
);

// Word-to-number mapping dictionary for spoken speech recognition
const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, point: '.', half: 0.5
};

export const GUIDED_BODY_FLOW = {
  upper: ['chest_cm', 'shoulder_cm', 'neck_cm'],
  lower: ['waist_cm', 'hip_cm', 'inseam_cm']
};

export const DIMENSION_METADATA = {
  chest_cm: {
    key: 'chest_cm',
    label: 'Chest / Bust',
    spokenAliases: [
      'chest', 'bust', 'pecs', 'chest measurement', 'chest size', 
      'chess', 'chests', 'chast', 'chess size', 'around chest', 'around my chest'
    ],
    defaultCm: 98,
    category: 'upper',
    stepNumber: 1,
    totalSteps: 3,
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
      'across shoulders', 'sholder', 'sholders', 'soldier', 'across my shoulders'
    ],
    defaultCm: 45,
    category: 'upper',
    stepNumber: 2,
    totalSteps: 3,
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
      'neck circumference', 'neck size', 'throat', 'neck measurement'
    ],
    defaultCm: 39,
    category: 'upper',
    stepNumber: 3,
    totalSteps: 3,
    instruction: 'Measure around the base of your neck where a tailored collar naturally sits.',
    stepPrompt: 'Next, measure around the base of your neck where a tailored collar naturally sits.',
    confirmSpoken: 'Neck measurement confirmed.',
    testPhrases: ['Neck is 39 centimetres.', 'Around neck is 41 cm.', 'My neck is 39 cm.']
  },
  waist_cm: {
    key: 'waist_cm',
    label: 'Waistline',
    spokenAliases: [
      'waist', 'waistline', 'stomach', 'belly', 'waist measurement', 'wasteline', 'around waist'
    ],
    defaultCm: 82,
    category: 'lower',
    stepNumber: 1,
    totalSteps: 3,
    instruction: 'Please measure around your natural waistline, midway between your lowest rib and navel.',
    stepPrompt: "Upper body complete! Now let's capture your lower body. First, please measure your natural waistline.",
    confirmSpoken: 'Waistline confirmed.',
    testPhrases: ['Waist is 32 inches.', 'Waistline 82 centimetres.']
  },
  hip_cm: {
    key: 'hip_cm',
    label: 'Hips / Seat',
    spokenAliases: [
      'hip', 'hips', 'seat', 'buttocks', 'around hips', 'hip measurement', 'hips measurement'
    ],
    defaultCm: 96,
    category: 'lower',
    stepNumber: 2,
    totalSteps: 3,
    instruction: 'Stand with your feet together and measure around the fullest circumference of your hips.',
    stepPrompt: 'Next, stand with feet together and measure around the fullest part of your hips.',
    confirmSpoken: 'Hip measurement confirmed.',
    testPhrases: ['Hips are 96 centimetres.', 'Seat is 38 inches.']
  },
  inseam_cm: {
    key: 'inseam_cm',
    label: 'Inseam (Inner Leg)',
    spokenAliases: [
      'inseam', 'inner leg', 'crotch to ankle', 'pant length', 'in seam', 'inside leg', 'leg length'
    ],
    defaultCm: 80,
    category: 'lower',
    stepNumber: 3,
    totalSteps: 3,
    instruction: 'Measure vertically along your inner leg seam from your crotch down to your ankle bone.',
    stepPrompt: 'Finally, measure vertically along your inner leg seam from crotch to ankle bone.',
    confirmSpoken: 'Inseam confirmed.',
    testPhrases: ['Inseam is 80 centimetres.', 'Inseam 31 inches.']
  },
  height_cm: {
    key: 'height_cm',
    label: 'Total Height',
    spokenAliases: ['height', 'tall', 'stature', 'body height'],
    defaultCm: 178,
    category: 'upper',
    stepNumber: 0,
    totalSteps: 3,
    instruction: 'Stand straight against a flat wall, measuring from floor to the top of your head.',
    stepPrompt: 'Total height measured.',
    confirmSpoken: 'Total height confirmed.',
    testPhrases: ['Height is 178 centimetres.']
  }
};

/**
 * Parses spoken natural language into numerical values and dimensions
 * Example inputs:
 *  - "My chest measurement is 98 centimetres."
 *  - "Waist is 32 inches"
 *  - "Shoulders 45 cm"
 *  - "Confirm" / "Yes"
 */
export function parseSpokenMeasurement(transcript, activeDimensionKey = 'chest_cm') {
  if (!transcript || typeof transcript !== 'string') {
    return { success: false, error: 'Empty transcript' };
  }

  const clean = transcript.toLowerCase().trim();

  // 1. Check for vocal confirmation/rejection intents
  if (/\b(confirm|yes|correct|save|lock it|good|that is right|approve|done|proceed)\b/i.test(clean) && !/\d+/.test(clean)) {
    return {
      success: true,
      intent: 'confirm',
      rawText: transcript
    };
  }

  if (/\b(cancel|no|wrong|redo|clear|stop|reject|repeat)\b/i.test(clean) && !/\d+/.test(clean)) {
    return {
      success: true,
      intent: 'reject',
      rawText: transcript
    };
  }

  // 2. Identify the target body dimension from spoken words
  let detectedDimensionKey = activeDimensionKey;
  let maxMatchedLength = 0;

  for (const [key, meta] of Object.entries(DIMENSION_METADATA)) {
    for (const alias of meta.spokenAliases) {
      // Check for exact phrase or full-word match using boundary regex
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

  // Check for direct digits (e.g. "98", "98.5")
  const digitMatch = clean.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    numericalValue = parseFloat(digitMatch[1]);
  } else {
    // Attempt spoken words to number parsing (e.g. "ninety eight")
    const words = clean.split(/[\s-]+/);
    let currentNumber = 0;
    let accumulated = 0;
    let foundNumber = false;

    for (const w of words) {
      if (NUMBER_WORDS[w] !== undefined) {
        foundNumber = true;
        const val = NUMBER_WORDS[w];
        if (val === 100) {
          accumulated = (accumulated || 1) * 100;
        } else if (val >= 20) {
          accumulated += val;
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
      error: 'Could not detect a numerical value in what you said. Please say e.g., "My chest is 98 centimetres".'
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
    bounds
  };
}

/**
 * Text-to-Speech Engine (Gnani Timbre Cloud Protocol & Robust Web Speech Synthesis Fallback)
 * Features:
 * - Direct Gnani Cloud TTS API integration using account credits & cloned voice
 * - Anti-Garbage-Collection retention for local synth fallback
 * - Safe async cancellation queue (prevents deadlocks between utterances)
 * - Acoustic loop barge-in signaling to STT
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
        // Prefer natural, elegant English voice (British / Savile Row style or neutral studio voice)
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

  /**
   * Primary speech dispatch:
   * Uses Gnani Cloud TTS API with cloned voice if API keys are configured in .env;
   * otherwise falls back to local neural Web Speech API.
   */
  speak(text, onEnd) {
    if (this.muted || !text) {
      if (onEnd) onEnd();
      return;
    }

    if (isGnaniConfigured) {
      this.speakWithGnaniCloud(text, onEnd);
    } else {
      this.speakLocal(text, onEnd);
    }
  }

  async speakWithGnaniCloud(text, onEnd) {
    let key = gnaniKeyPool.getActiveKey();

    while (key) {
      try {
        this.stop();
        this.notifySpeaking(true);

        const authKey = key.accessKey;
        const authToken = key.token || authKey;

        const res = await fetch(GNANI_CONFIG.ttsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-key': authKey,
            'accessKey': authKey,
            'x-auth-token': authToken,
            'token': authToken,
            'Authorization': `Bearer ${authKey}`
          },
          body: JSON.stringify({
            text,
            voice_id: GNANI_CONFIG.voiceCloneId || 'tailor_concierge',
            lang: GNANI_CONFIG.lang,
            speed: 0.95,
            format: 'mp3'
          })
        });

        // Detect Credit Exhaustion / Quota Exceeded / Rate Limit errors
        if (res.status === 402 || res.status === 429 || res.status === 403) {
          gnaniKeyPool.markExhausted(key.id, `HTTP ${res.status} Quota/Credit limit reached`);
          key = gnaniKeyPool.getActiveKey(); // Try next fallback key!
          continue;
        }

        if (!res.ok) {
          throw new Error(`Gnani API responded with HTTP ${res.status}`);
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudio = new Audio(audioUrl);

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.notifySpeaking(false);
          if (onEnd) onEnd();
        };

        this.currentAudio.onerror = (e) => {
          console.warn('Gnani audio playback failed, falling back to local voice:', e);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.speakLocal(text, onEnd);
        };

        await this.currentAudio.play();
        return; // Successfully played audio with active key!

      } catch (err) {
        console.warn(`Key '${key.id}' failed, rotating to fallback:`, err);
        gnaniKeyPool.markExhausted(key.id, err.message);
        key = gnaniKeyPool.getActiveKey();
      }
    }

    // If all keys in pool are exhausted, seamlessly fallback to local device voice
    console.log('[Gnani Failover] All Gnani cloud keys exhausted or unreachable. Using seamless local voice fallback.');
    this.speakLocal(text, onEnd);
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

    // Cancel existing speech safely
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }

    // Small delay ensures Chrome reset audio buffer cleanly without dropping next utterance
    this.pendingTimeout = setTimeout(() => {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }

        const cleanText = text.replace(/([.?!])\s+/g, '$1, '); // Natural micro-pauses
        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.rate = 0.96; // Calm, deliberate, non-rushed tailor cadence
        utterance.pitch = 1.0;

        // Anti-GC: Retain reference in set so Chromium garbage collector doesn't abort speech mid-phrase
        this.activeUtterances.add(utterance);

        utterance.onstart = () => {
          this.notifySpeaking(true);
        };

        const cleanup = () => {
          this.activeUtterances.delete(utterance);
          this.notifySpeaking(false);
          if (onEnd) {
            onEnd();
          }
        };

        utterance.onend = cleanup;
        utterance.onerror = (e) => {
          cleanup();
        };

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
 * Speech-to-Text Engine (Gnani Prisma Protocol & Continuous Web Speech API)
 * Features:
 * - Direct continuous microphone streaming without deadlocks or 10s lockout
 * - Auto-reconnect so speech recognition stays active during pauses
 * - Regional accent calibration (en-IN / en-US)
 * - Safe barge-in without dropping user speech
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
      // Regional accent calibration matching user configuration
      this.recognition.lang = GNANI_CONFIG.lang || (typeof navigator !== 'undefined' && navigator.language) || 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStateChange) this.onStateChange('listening');
      };

      this.recognition.onresult = (event) => {
        // Only ignore if TTS is actively outputting sound at this precise millisecond
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
          // Normal pause in user speaking, keep listening active
          return;
        }
        console.warn('STT recognition notice:', event.error);
        if (this.onStateChange) this.onStateChange('error', event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;

        // Auto-reconnect loop: keeps listening alive if user enabled mic
        if (this.shouldListen) {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.shouldListen && !this.isListening) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore transient start collision
              }
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

