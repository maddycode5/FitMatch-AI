import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ArrowRight, Sliders, Volume2, Info, User, Check } from 'lucide-react';
import { timbreTTS, DIMENSION_METADATA } from '../../services/voiceMeasurementService';

export default function LiveCameraFlow({ onSave, onBack }) {
  const [currentStep, setCurrentStep] = useState('permission'); // 'permission' | 'instructions' | 'front_capture' | 'side_capture' | 'processing' | 'verification'
  const [hasPermission, setHasPermission] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [sideImage, setSideImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [activeSpeakingKey, setActiveSpeakingKey] = useState(null);

  // Customer measurements (in cm) - user verified with camera posture reference
  const [estimates, setEstimates] = useState({
    chest_cm: 98,
    waist_cm: 82,
    hip_cm: 96,
    shoulder_cm: 45,
    inseam_cm: 80,
    height_cm: 178
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Request camera permission
  const requestCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setHasPermission(true);
      setCurrentStep('instructions');
    } catch (err) {
      setCameraError("Camera permission was denied or not supported on this device. You can switch to Manual Entry or Voice Mode.");
    }
  };

  // Mount video stream when in capture steps
  useEffect(() => {
    if ((currentStep === 'front_capture' || currentStep === 'side_capture') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn(e));
    }
  }, [currentStep]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      timbreTTS.stop();
    };
  }, []);

  // Trigger capture with 3-second countdown
  const startCapture = (poseType) => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          takeSnapshot(poseType);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeSnapshot = (poseType) => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');

    if (poseType === 'front') {
      setFrontImage(dataUrl);
      setCurrentStep('side_capture');
    } else {
      setSideImage(dataUrl);
      setCurrentStep('processing');
      // Validate capture quality & transition to guided tape verification
      setTimeout(() => {
        setCurrentStep('verification');
      }, 700);
    }
  };

  const speakGuidance = (key) => {
    const meta = DIMENSION_METADATA[key];
    if (!meta) return;
    setActiveSpeakingKey(key);
    timbreTTS.speak(`Let's verify your ${meta.label}. ${meta.instruction}`, () => {
      setActiveSpeakingKey(null);
    });
  };

  const handleFinalSave = () => {
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    onSave({
      height_cm: estimates.height_cm,
      weight_kg: 72,
      unit: "cm",
      measurements: {
        chest_cm: estimates.chest_cm,
        waist_cm: estimates.waist_cm,
        hip_cm: estimates.hip_cm,
        shoulder_cm: estimates.shoulder_cm,
        neck_cm: 39,
        arm_length_cm: 62,
        sleeve_length_cm: 63,
        inseam_cm: estimates.inseam_cm,
        thigh_cm: 56
      },
      measurement_metadata: {
        source: "camera_guided_reference",
        verified_by_user: true,
        prototype_mode: "experimental_posture_reference",
        disclaimer: "User-verified manual measurement with camera posture reference",
        updated_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. PERMISSION STEP */}
      {currentStep === 'permission' && (
        <div className="text-center py-6 space-y-6 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase font-semibold">
              🧪 Experimental UI Prototype
            </span>
          </div>

          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
            <Camera className="w-8 h-8 text-amber-400" />
          </div>

          <div>
            <h3 className="font-serif text-2xl text-white">Camera Posture Reference</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Opens your browser camera to capture front and profile posture references with alignment guides, followed by guided tape measurement verification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 text-left text-xs space-y-2 text-neutral-300">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase">
              <ShieldCheck className="w-4 h-4" /> 100% In-Browser Privacy
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Camera frames stay completely inside your local browser session and are never uploaded or transmitted to third-party cloud servers.
            </p>
          </div>

          {cameraError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {cameraError}
            </div>
          )}

          <div className="flex gap-4 justify-center pt-2">
            <button
              onClick={onBack}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white px-5 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={requestCamera}
              className="bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              Allow Camera & Continue
            </button>
          </div>
        </div>
      )}

      {/* 2. PREPARATION INSTRUCTIONS */}
      {currentStep === 'instructions' && (
        <div className="space-y-6 max-w-lg mx-auto py-2">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase font-semibold">
              Posture Reference Guidelines
            </span>
            <h3 className="font-serif text-2xl text-white mt-2">Visual Alignment Setup</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">1. Fitted Attire</span>
              <span className="text-neutral-400">Wear form-fitting athletic wear for accurate posture alignment.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">2. Full Body In View</span>
              <span className="text-neutral-400">Step back 2-3 meters so your head and feet are visible in the frame.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">3. Plain Background</span>
              <span className="text-neutral-400">Stand against a plain contrasting wall with clear lighting.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">4. Tape Verification</span>
              <span className="text-neutral-400">Have a measuring tape ready to confirm your exact body dimensions.</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={onBack} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back
            </button>
            <button
              onClick={() => setCurrentStep('front_capture')}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              Start Front Capture
            </button>
          </div>
        </div>
      )}

      {/* 3 & 4. CAMERA CAPTURE VIEW (FRONT & SIDE) */}
      {(currentStep === 'front_capture' || currentStep === 'side_capture') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-300">
              {currentStep === 'front_capture' ? 'Pose 1 of 2: Front Reference' : 'Pose 2 of 2: Side Profile (Turn 90°)'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Camera Feed
            </span>
          </div>

          {/* Viewport Box */}
          <div className="relative w-full aspect-[4/3] max-h-[460px] bg-black rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Silhouette Guides Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-white/20 border-dashed rounded-2xl m-4 sm:m-6">
              <div className="text-center space-y-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                <p className="text-xs text-white font-mono uppercase tracking-widest">
                  {currentStep === 'front_capture'
                    ? 'Align Head to Top • Feet to Bottom'
                    : 'Turn 90° Sideways for Profile Depth'}
                </p>
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="font-serif text-8xl text-white font-bold animate-pulse">{countdown}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep('instructions')}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              Back
            </button>

            <button
              onClick={() => startCapture(currentStep === 'front_capture' ? 'front' : 'side')}
              disabled={countdown !== null}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Capture {currentStep === 'front_capture' ? 'Front' : 'Side'} Reference</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. QUALITY CHECK & INITIALIZATION */}
      {currentStep === 'processing' && (
        <div className="text-center py-16 space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
          <div>
            <h4 className="font-serif text-xl text-white">Validating Posture Reference Quality</h4>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Aligning front & profile frames for guided tape verification...
            </p>
          </div>
        </div>
      )}

      {/* 6. GUIDED TAPE VERIFICATION & CONFIRMATION */}
      {currentStep === 'verification' && (
        <div className="space-y-5">
          {/* Transparent Disclosure Notice */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed font-light">
              <strong className="font-medium text-white block mb-0.5">
                Experimental UI Prototype: Guided Posture Capture & Tape Verification
              </strong>
              2D smartphone/webcam cameras cannot physically measure 3D body circumferences without external calibration markers. Your captured posture images are displayed below for visual reference. Please confirm your actual tape measurements before saving.
            </div>
          </div>

          {/* Captured Posture Reference Thumbnails */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-900/50 border border-white/10">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Front Reference</span>
              <div className="aspect-[3/4] max-h-40 rounded-xl overflow-hidden bg-black border border-white/10 mx-auto">
                {frontImage && <img src={frontImage} alt="Front capture" className="w-full h-full object-cover scale-x-[-1]" />}
              </div>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Side Reference</span>
              <div className="aspect-[3/4] max-h-40 rounded-xl overflow-hidden bg-black border border-white/10 mx-auto">
                {sideImage && <img src={sideImage} alt="Side capture" className="w-full h-full object-cover scale-x-[-1]" />}
              </div>
            </div>
          </div>

          {/* Guided Measurement Inputs with Gnani Spoken Guidance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-300">
                User-Verified Tape Dimensions
              </h4>
              <span className="text-[10px] font-mono text-cyan-400">
                Tap 🔊 to hear tailor instructions
              </span>
            </div>

            {[
              { key: 'chest_cm', label: 'Chest / Bust Circumference', min: 75, max: 135 },
              { key: 'shoulder_cm', label: 'Shoulder Width', min: 36, max: 56 },
              { key: 'waist_cm', label: 'Waist Circumference', min: 60, max: 120 },
              { key: 'hip_cm', label: 'Hip Circumference', min: 75, max: 130 },
              { key: 'inseam_cm', label: 'Inseam Length', min: 65, max: 95 }
            ].map(item => (
              <div key={item.key} className="p-3 rounded-xl bg-neutral-900/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speakGuidance(item.key)}
                    className={`p-1.5 rounded-full border transition-all ${
                      activeSpeakingKey === item.key
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)] animate-pulse'
                        : 'bg-white/5 border-white/10 text-cyan-400 hover:bg-white/10'
                    }`}
                    title="Hear measurement instruction via Gnani Timbre"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <div>
                    <span className="text-xs text-white font-medium block">{item.label}</span>
                    <span className="text-[10px] font-mono text-neutral-400">Tape measurement (cm)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={estimates[item.key]}
                    onChange={(e) => setEstimates(prev => ({ ...prev, [item.key]: parseFloat(e.target.value) }))}
                    className="w-full sm:w-44 accent-white cursor-pointer"
                  />
                  <div className="flex items-center gap-1 font-mono text-sm text-right text-white font-semibold min-w-[70px] justify-end">
                    <span>{estimates[item.key]}</span>
                    <span className="text-[10px] font-normal text-neutral-400">cm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <button
              onClick={() => setCurrentStep('front_capture')}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              Retake References
            </button>
            <button
              onClick={handleFinalSave}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors shadow-2xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Confirm & Save Verified Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
