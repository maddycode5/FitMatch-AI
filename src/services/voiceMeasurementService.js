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
    spokenLabel: 'Chest and Bust',
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
    stepPrompt: "First for lower body, please measure around your natural waistline.",
    confirmSpoken: 'Waistline confirmed.',
    testPhrases: ['Waist is 32 inches.', 'Waistline 82 centimetres.']
  },
  hip_cm: {
    key: 'hip_cm',
    label: 'Hips / Seat',
    spokenLabel: 'Hips and Seat',
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
    spokenLabel: 'Arm and Sleeve Length',
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
 * Transcribes audio via Gnani Prisma STT (POST /api/voice/stt)
 * and extracts biometric measurements with physiological validation.
 */
export async function transcribeAndExtractAudioViaBackend(audioBlob, activeDimensionKey = 'chest_cm', textFallback = null) {
  try {
    const formData = new FormData();
    if (audioBlob) {
      const mime = audioBlob.type || 'audio/webm';
      const filename = mime.includes('wav') ? 'audio_recording.wav' : 'audio_recording.webm';
      formData.append('file', audioBlob, filename);
    }
    formData.append('active_dimension', activeDimensionKey);
    formData.append('lang', 'en-IN');
    if (textFallback) {
      formData.append('text_fallback', textFallback);
    }

    const res = await fetch(`${API_BASE_URL}/api/voice/stt`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        rawText: data.transcript || textFallback || ''
      };
    }
  } catch (err) {
    console.warn('[Backend STT Proxy] Offline or unreachable, using local fallback:', err);
  }

  // Fallback to client-side extraction if backend is offline
  if (textFallback) {
    return parseSpokenMeasurement(textFallback, activeDimensionKey);
  }
  return {
    success: false,
    error: 'Speech recognition failed. Please try speaking again.'
  };
}

/**
 * Compatibility wrapper for text-based utterances (e.g. test phrases)
 * Routes directly through POST /api/voice/stt with text_fallback
 */
export async function extractMeasurementsViaBackend(transcript, activeDimensionKey = 'chest_cm') {
  return transcribeAndExtractAudioViaBackend(null, activeDimensionKey, transcript);
}

function selectConsistentMaleVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const malePatterns = [
    /Microsoft Ravi/i,
    /Microsoft Prabhat/i,
    /Microsoft George/i,
    /Microsoft Mark/i,
    /Microsoft David/i,
    /Google UK English Male/i,
    /Daniel/i,
    /Rishi/i,
    /Alex/i,
    /Guy/i,
    /Ryan/i,
    /\bMale\b/i
  ];
  for (const pattern of malePatterns) {
    const match = voices.find(v => pattern.test(v.name));
    if (match) return match;
  }
  // Avoid common female default OS voices so tone never clashes between male and female
  const nonFemaleEn = voices.find(v =>
    v.lang.startsWith('en') &&
    !/(Zira|Hazel|Heera|Susan|Linda|Neerja|Samantha|Victoria|Karen|Female|Aria|Jenny|Natasha|Libby|Sonia)/i.test(v.name)
  );
  return nonFemaleEn || voices.find(v => v.lang.startsWith('en')) || voices[0];
}

/**
 * Text-to-Speech Engine
 * Routes through FastAPI backend proxy (POST /api/voice/tts) to Gnani Timbre (Male voice Vikrant),
 * falling back seamlessly to consistent Male Web Speech voice only if backend is unreachable.
 */
class TimbreTTSEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.muted = false;
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.lastSpeechEndedAt = 0;
    this.activeUtterances = new Set();
    this.speakingListeners = new Set();
    this.pendingTimeout = null;
    this.currentAudio = null;
    this.persistentAudio = typeof Audio !== 'undefined' ? new Audio() : null;
    this.currentPlayId = 0;
    this.abortController = null;
    this.lastSpokenText = '';
    this.lastSpokenTimestamp = 0;
    this.audioUrlCache = new Map();
    this.speakingWatchdog = null;

    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        if (voices && voices.length > 0) {
          this.selectedVoice = selectConsistentMaleVoice(voices);
        }
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

  isInEchoCooldown(cooldownMs = 450) {
    return this.isSpeaking || (Date.now() - this.lastSpeechEndedAt < cooldownMs);
  }

  notifySpeaking(speaking, durationHintMs = 10000) {
    if (this.speakingWatchdog) {
      clearTimeout(this.speakingWatchdog);
      this.speakingWatchdog = null;
    }
    if (!speaking && this.isSpeaking) {
      this.lastSpeechEndedAt = Date.now();
    }
    this.isSpeaking = speaking;
    if (speaking) {
      // Safety watchdog: releases lock if browser audio/speech event fails to fire
      this.speakingWatchdog = setTimeout(() => {
        if (this.isSpeaking) {
          console.warn('[TTS] Safety watchdog released speaking lock');
          this.lastSpeechEndedAt = Date.now();
          this.isSpeaking = false;
          this.speakingListeners.forEach(fn => { try { fn(false); } catch (e) {} });
        }
      }, durationHintMs);
    }
    this.speakingListeners.forEach(fn => {
      try { fn(speaking); } catch (e) { console.warn(e); }
    });
  }

  primeAudio() {
    // Proactively unlocks persistent HTML5 Audio element & SpeechSynthesis on user click
    try {
      if (this.synth) {
        if (this.synth.paused) this.synth.resume();
      }
      if (this.persistentAudio) {
        this.persistentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.persistentAudio.play().then(() => {
          this.persistentAudio.pause();
          this.persistentAudio.currentTime = 0;
        }).catch(() => {});
      }
    } catch (e) {}
  }

  async prefetch(text) {
    if (!text || !text.trim() || this.audioUrlCache.has(text.trim())) return;
    try {
      const status = backendVoiceManager.getStatus();
      const res = await fetch(`${API_BASE_URL}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: status.voiceCloneId || 'Vikrant',
          lang: status.lang || 'en-IN',
          speed: 0.95
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          this.audioUrlCache.set(text.trim(), url);
        }
      }
    } catch (e) {}
  }

  silenceActiveAudio() {
    if (this.abortController) {
      try { this.abortController.abort(); } catch (e) {}
      this.abortController = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        // Do NOT revoke ObjectURL here because audioUrlCache stores cached blobs for instant replay!
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      try { this.synth.cancel(); } catch (e) {}
      this.activeUtterances.clear();
    }
  }

  speak(text, onEnd) {
    if (this.muted || !text || !text.trim()) {
      if (onEnd) onEnd();
      return;
    }

    const trimmed = text.trim();
    const now = Date.now();

    // Deduplicate: skip redundant speak requests within 1.5s unless previously stopped
    if (trimmed === this.lastSpokenText && (now - this.lastSpokenTimestamp < 1500)) {
      if (onEnd) onEnd();
      return;
    }

    this.lastSpokenText = trimmed;
    this.lastSpokenTimestamp = now;

    const playId = ++this.currentPlayId;
    this.speakWithBackendProxy(trimmed, onEnd, playId);
  }

  async playAudioUrl(audioUrl, text, onEnd, playId) {
    if (this.currentPlayId !== playId) return false;
    const audio = this.persistentAudio || new Audio();
    this.currentAudio = audio;
    audio.src = audioUrl;

    audio.onended = () => {
      if (this.currentPlayId === playId) {
        this.currentAudio = null;
        this.notifySpeaking(false);
        if (onEnd) onEnd();
      }
    };

    audio.onerror = () => {
      if (this.currentPlayId === playId) {
        this.currentAudio = null;
        this.speakLocal(text, onEnd, playId);
      }
    };

    try {
      this.notifySpeaking(true, Math.max(6000, text.length * 110));
      await audio.play();
      return true;
    } catch (playErr) {
      console.warn('[TTS Proxy] HTMLAudio play blocked/failed, using Web Speech fallback:', playErr);
      if (this.currentPlayId === playId) {
        this.currentAudio = null;
        this.speakLocal(text, onEnd, playId);
      }
      return false;
    }
  }

  async speakWithBackendProxy(text, onEnd, playId) {
    try {
      this.silenceActiveAudio();

      // Instant 0ms Cache Hit: play cached audio immediately
      if (this.audioUrlCache && this.audioUrlCache.has(text)) {
        const cachedUrl = this.audioUrlCache.get(text);
        await this.playAudioUrl(cachedUrl, text, onEnd, playId);
        return;
      }

      this.abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const status = backendVoiceManager.getStatus();

      // If backend is known to be offline/unconfigured, use local speech immediately with 0ms delay
      if (!status.isBackendOnline && !status.hasKeys) {
        this.speakLocal(text, onEnd, playId);
        return;
      }

      // Pause echo during synthesis + wait reliably for Gnani Male Vikrant WAV (only fallback > 9000ms)
      this.notifySpeaking(true, 16000);
      let fallbackTriggered = false;
      const timeoutId = setTimeout(() => {
        fallbackTriggered = true;
        if (this.currentPlayId === playId && !this.currentAudio) {
          console.log('[TTS Proxy] Cloud synthesis exceeded 9.0s threshold, using male local speech');
          if (this.abortController) {
            try { this.abortController.abort(); } catch (e) {}
          }
          this.speakLocal(text, onEnd, playId);
        }
      }, 9000);

      const res = await fetch(`${API_BASE_URL}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController?.signal,
        body: JSON.stringify({
          text,
          voice_id: status.voiceCloneId || 'Vikrant',
          lang: status.lang || 'en-IN',
          speed: 0.95
        })
      });

      clearTimeout(timeoutId);

      // Discard stale or already-fallback response
      if (this.currentPlayId !== playId || fallbackTriggered) return;

      // If backend indicates fallback (e.g. quota exhausted or cloud unreachable)
      if (res.headers.get('X-Voice-Fallback') === 'true' || !res.ok) {
        this.speakLocal(text, onEnd, playId);
        return;
      }

      const audioBlob = await res.blob();
      if (this.currentPlayId !== playId || fallbackTriggered) return;

      if (!audioBlob || audioBlob.size === 0) {
        this.speakLocal(text, onEnd, playId);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      if (this.audioUrlCache) {
        this.audioUrlCache.set(text, audioUrl);
      }

      await this.playAudioUrl(audioUrl, text, onEnd, playId);

    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Expected when superseded or aborted on timeout
      }
      if (this.currentPlayId === playId) {
        this.speakLocal(text, onEnd, playId);
      }
    }
  }

  speakLocal(text, onEnd, playId) {
    if (this.muted || !this.synth || !text || this.currentPlayId !== playId) {
      this.notifySpeaking(false);
      if (onEnd) onEnd();
      return;
    }

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Small 80ms gap prevents Chromium SpeechSynthesis cancel+speak race from silently dropping utterances
    this.pendingTimeout = setTimeout(() => {
      if (this.currentPlayId !== playId) return;

      try {
        if (this.synth.paused) {
          this.synth.resume();
        }

        // Always enforce consistent Male OS voice if fallback runs
        const voices = this.synth.getVoices();
        if (voices && voices.length > 0) {
          this.selectedVoice = selectConsistentMaleVoice(voices);
        }

        const utterance = new SpeechSynthesisUtterance(text);

        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.rate = 0.96;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Retain strong reference (prevents Chromium GC from truncating mid-sentence after 1 word)
        this.activeUtterances.add(utterance);
        if (typeof window !== 'undefined') {
          window.__fitmatchActiveUtterance = utterance;
        }

        this.notifySpeaking(true, Math.max(6000, text.length * 110));

        utterance.onstart = () => {
          if (this.currentPlayId === playId) {
            this.notifySpeaking(true, Math.max(6000, text.length * 110));
          }
        };

        const cleanup = () => {
          this.activeUtterances.delete(utterance);
          if (typeof window !== 'undefined' && window.__fitmatchActiveUtterance === utterance) {
            window.__fitmatchActiveUtterance = null;
          }
          if (this.currentPlayId === playId) {
            this.notifySpeaking(false);
            if (onEnd) onEnd();
          }
        };

        utterance.onend = cleanup;
        utterance.onerror = () => cleanup();

        this.synth.speak(utterance);
      } catch (err) {
        console.warn('TTS speak error:', err);
        if (this.currentPlayId === playId) {
          this.notifySpeaking(false);
          if (onEnd) onEnd();
        }
      }
    }, 80);
  }

  stop() {
    this.currentPlayId++;
    this.lastSpokenTimestamp = 0;
    this.silenceActiveAudio();
    this.notifySpeaking(false);
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
 * Downsample Float32 PCM buffer from native hardware sampleRate (e.g. 48000Hz) to 16000Hz
 */
function downsampleBuffer(buffer, inputSampleRate, outputSampleRate = 16000) {
  if (inputSampleRate === outputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function writeWavString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encodes Float32 PCM samples into a 16-bit 16kHz Mono PCM WAV Blob
 * (Directly supported by Gnani Prisma STT v3 without format errors)
 */
function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeWavString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeWavString(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeWavString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Speech-to-Text Engine powered by Web Audio 16kHz WAV Capture & Gnani Prisma STT
 * Pauses capture during active TTS playback + 450ms echo cooldown to guarantee zero self-cancellation
 * or speaker feedback, then records clean WAV audio to transmit to POST /api/voice/stt.
 */
class PrismaSTTEngine {
  constructor(onTranscript, onStateChange, ttsInstance = null, getActiveDimension = null) {
    this.onTranscript = onTranscript;
    this.onStateChange = onStateChange;
    this.ttsInstance = ttsInstance;
    this.getActiveDimension = getActiveDimension || (() => 'chest_cm');

    this.audioStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.scriptProcessor = null;
    this.muteGain = null;
    this.pcmChunks = [];
    this.preSpeechBuffer = [];
    this.vadInterval = null;
    this.isListening = false;
    this.shouldListen = false;
    this.speechDetected = false;
    this.lastSpeechTime = 0;
    this.isTransmitting = false;

    // Optional background browser recognition for live real-time character typing preview & instant numeric fast-path
    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    this.browserRecognition = SpeechRec ? new SpeechRec() : null;
    this.lastInterimText = '';
    this.lastFinalSubmittedAt = 0;
    this.setupBrowserPreview();
  }

  setupBrowserPreview() {
    if (!this.browserRecognition) return;
    try {
      this.browserRecognition.continuous = true;
      this.browserRecognition.interimResults = true;
      this.browserRecognition.lang = 'en-IN';

      this.browserRecognition.onresult = (event) => {
        // Acoustic Echo Rejection: ignore speech recognized while TTS is playing or cooling down
        if (this.ttsInstance && this.ttsInstance.isInEchoCooldown(450)) {
          return;
        }

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
          else interim += event.results[i][0].transcript + ' ';
        }
        const text = (final || interim).trim();
        if (text) {
          this.lastInterimText = text;
          if (this.onTranscript) {
            this.onTranscript({ interim: text });
          }

          // Instant fast-trigger if browser recognized a clear number or confirmation keyword
          if (final && (/\d+/.test(final) || /\b(confirm|yes|correct|save|lock|sahi|haan|bilkul|no|cancel|wrong|theek)\b/i.test(final))) {
            this.lastFinalSubmittedAt = Date.now();
            this.finalizeWavUtterance(final.trim());
          }
        }
      };

      this.browserRecognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.debug('Preview recognition notice:', e.error);
        }
      };

      this.browserRecognition.onend = () => {
        if (this.shouldListen && this.browserRecognition) {
          try { this.browserRecognition.start(); } catch (e) {}
        }
      };
    } catch (e) {
      console.debug('Browser preview init skipped:', e);
    }
  }

  async finalizeWavUtterance(explicitFallbackText = null) {
    if (this.isTransmitting) return;

    const chunksToEncode = this.pcmChunks.splice(0, this.pcmChunks.length);
    const fallbackText = explicitFallbackText || this.lastInterimText;
    this.lastInterimText = '';
    this.speechDetected = false;

    // Require either non-empty text fallback or at least ~0.25s of speech samples
    const totalSamples = chunksToEncode.reduce((acc, c) => acc + c.length, 0);
    const sampleRate = this.audioContext?.sampleRate || 48000;
    const minSamples = Math.round(sampleRate * 0.25);

    if (totalSamples < minSamples && (!fallbackText || !fallbackText.trim())) {
      return;
    }

    this.isTransmitting = true;
    try {
      let wavBlob = null;
      if (totalSamples >= minSamples) {
        const merged = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of chunksToEncode) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        const downsampled = downsampleBuffer(merged, sampleRate, 16000);
        wavBlob = encodeWAV(downsampled, 16000);
      }

      const currentActiveKey = this.getActiveDimension ? this.getActiveDimension() : 'chest_cm';
      if (this.onStateChange) this.onStateChange('processing');

      const result = await transcribeAndExtractAudioViaBackend(wavBlob, currentActiveKey, fallbackText);

      if (this.onTranscript) {
        this.onTranscript({
          final: result.transcript || fallbackText,
          backendResult: result
        });
      }
    } finally {
      this.isTransmitting = false;
      if (this.shouldListen && this.onStateChange) {
        this.onStateChange('listening');
      }
    }
  }

  async start() {
    this.shouldListen = true;
    if (this.isListening) return;

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser environment');
      }

      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);

        // Capture uncompressed Float32 PCM frames for 16kHz WAV encoding
        this.pcmChunks = [];
        this.preSpeechBuffer = [];
        this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.muteGain = this.audioContext.createGain();
        this.muteGain.gain.value = 0; // Mute passthrough to avoid feedback while keeping processor running

        this.scriptProcessor.onaudioprocess = (e) => {
          if (!this.shouldListen) return;

          // Acoustic Echo Protection: never record while TTS is actively speaking or cooling down
          if (this.ttsInstance && this.ttsInstance.isInEchoCooldown(450)) {
            if (!this.speechDetected) {
              this.pcmChunks = [];
              this.preSpeechBuffer = [];
            }
            return;
          }

          const frame = new Float32Array(e.inputBuffer.getChannelData(0));
          if (this.speechDetected) {
            this.pcmChunks.push(frame);
          } else {
            // Retain up to 3 pre-speech frames (~250ms) so initial consonant isn't cut off
            this.preSpeechBuffer.push(frame);
            if (this.preSpeechBuffer.length > 3) {
              this.preSpeechBuffer.shift();
            }
          }
        };

        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.muteGain);
        this.muteGain.connect(this.audioContext.destination);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.vadInterval = setInterval(() => {
          if (!this.shouldListen || !this.analyser) return;

          // Suspend VAD while TTS is speaking so speaker output never interrupts TTS or triggers fake STT!
          if (this.ttsInstance && this.ttsInstance.isInEchoCooldown(450)) {
            this.speechDetected = false;
            this.pcmChunks = [];
            return;
          }

          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;

          // Speech onset threshold (sensitive enough for gentle "yes"/"confirm", echo-gated during TTS)
          if (avg > 10) {
            if (!this.speechDetected) {
              this.speechDetected = true;
              if (this.preSpeechBuffer.length > 0) {
                this.pcmChunks.push(...this.preSpeechBuffer);
                this.preSpeechBuffer = [];
              }
            }
            this.lastSpeechTime = Date.now();
          } else if (this.speechDetected) {
            // Finalize utterance cleanly after 600ms of silence
            const elapsed = Date.now() - this.lastSpeechTime;
            if (elapsed > 600) {
              this.finalizeWavUtterance();
            }
          }
        }, 100);
      }

      this.isListening = true;
      if (this.onStateChange) this.onStateChange('listening');

      // Start background browser preview for real-time live typing display
      if (this.browserRecognition) {
        try { this.browserRecognition.start(); } catch (e) {}
      }

    } catch (err) {
      console.warn('Microphone access error:', err);
      this.isListening = false;
      if (this.onStateChange) this.onStateChange('error', err.message);
    }
  }

  stop() {
    this.shouldListen = false;
    this.isListening = false;
    this.speechDetected = false;
    this.pcmChunks = [];
    this.preSpeechBuffer = [];

    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
      } catch (e) {}
      this.scriptProcessor = null;
    }

    if (this.muteGain) {
      try { this.muteGain.disconnect(); } catch (e) {}
      this.muteGain = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }

    if (this.browserRecognition) {
      try { this.browserRecognition.stop(); } catch (e) {}
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
      this.audioStream = null;
    }

    if (this.onStateChange) this.onStateChange('inactive');
  }

  flushRecording() {
    this.finalizeWavUtterance();
  }

  isSupported() {
    return typeof window !== 'undefined' && Boolean(
      (navigator.mediaDevices && (window.AudioContext || window.webkitAudioContext)) ||
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    );
  }
}

export const timbreTTS = new TimbreTTSEngine();
export { PrismaSTTEngine };
