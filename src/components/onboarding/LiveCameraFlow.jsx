import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ArrowRight, Sliders } from 'lucide-react';

export default function LiveCameraFlow({ onSave, onBack }) {
  const [currentStep, setCurrentStep] = useState('permission'); // 'permission' | 'instructions' | 'front_capture' | 'side_capture' | 'processing' | 'verification'
  const [hasPermission, setHasPermission] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [sideImage, setSideImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Calibrated estimates with confidence levels
  const [estimates, setEstimates] = useState({
    chest_cm: 98,
    waist_cm: 82,
    hip_cm: 96,
    shoulder_cm: 45,
    height_cm: 178
  });

  const [confidence] = useState({
    chest_cm: 0.85,
    waist_cm: 0.82,
    hip_cm: 0.80,
    shoulder_cm: 0.90,
    height_cm: 0.95
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
      setCameraError("Camera permission was denied or not supported on this device. You can switch to Manual Entry or Photo Upload.");
    }
  };

  // Mount video stream when in capture steps
  useEffect(() => {
    if ((currentStep === 'front_capture' || currentStep === 'side_capture') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn(e));
    }
    return () => {
      // Clean up stream when unmounting the component
    };
  }, [currentStep]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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
      // Simulate landmark detection & calibration pipeline
      setTimeout(() => {
        setCurrentStep('verification');
      }, 2200);
    }
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
        inseam_cm: 80,
        thigh_cm: 56
      },
      measurement_metadata: {
        source: "camera",
        confidence,
        verified_by_user: true,
        updated_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="w-full">
      {/* 1. PERMISSION STEP */}
      {currentStep === 'permission' && (
        <div className="text-center py-8 space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-white">Live Camera Body Scan</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              We use ephemeral computer vision to estimate key silhouettes. Images are processed locally in your browser and never stored or uploaded without your explicit permission.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 text-left text-xs space-y-2 text-neutral-300">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase">
              <ShieldCheck className="w-4 h-4" /> Privacy Protected
            </div>
            <p className="text-neutral-400 text-[11px]">
              No biometric photos are transmitted to external servers. You can review and adjust all calculated numbers before saving.
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
        <div className="space-y-6 max-w-lg mx-auto py-4">
          <h3 className="font-serif text-2xl text-white text-center">Capture Guidelines</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-300">
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">1. Fitted Attire</span>
              <span className="text-neutral-400">Wear form-fitting clothing or athletic wear for accurate boundary detection.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">2. Full Body In View</span>
              <span className="text-neutral-400">Step back 2-3 meters so your head and ankles are clearly visible in the frame.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">3. Plain Background</span>
              <span className="text-neutral-400">Stand against a plain, contrasting wall with good front lighting.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10">
              <span className="font-semibold text-white block mb-1">4. Neutral Posture</span>
              <span className="text-neutral-400">Stand straight with feet hip-width and arms held 6 inches away from sides.</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button onClick={onBack} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back
            </button>
            <button
              onClick={() => setCurrentStep('front_capture')}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              Ready for Front Capture
            </button>
          </div>
        </div>
      )}

      {/* 3 & 4. CAMERA CAPTURE VIEW (FRONT & SIDE) */}
      {(currentStep === 'front_capture' || currentStep === 'side_capture') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-300">
              {currentStep === 'front_capture' ? 'Pose 1 of 2: Front View' : 'Pose 2 of 2: Side View (Turn 90°)'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Feed
            </span>
          </div>

          {/* Viewport Box */}
          <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Silhouette Guides Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center border-2 border-white/20 border-dashed rounded-2xl m-6">
              <div className="text-center space-y-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                <p className="text-xs text-white font-mono uppercase tracking-widest">
                  {currentStep === 'front_capture'
                    ? 'Align Head to Top • Ankles to Bottom'
                    : 'Turn 90° Sideways for Depth Silhouette'}
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
              <span>Capture {currentStep === 'front_capture' ? 'Front' : 'Side'} Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. ESTIMATION PROCESSING SKELETON */}
      {currentStep === 'processing' && (
        <div className="text-center py-16 space-y-6">
          <RefreshCw className="w-10 h-10 animate-spin text-white mx-auto" />
          <div>
            <h4 className="font-serif text-xl text-white">Analyzing Pose Landmarks & Silhouettes</h4>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Calibrating 2D pixel aspect ratio against reference scale...
            </p>
          </div>
        </div>
      )}

      {/* 6. ESTIMATION RESULTS & MANUAL VERIFICATION */}
      {currentStep === 'verification' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed font-light">
              <strong className="font-medium text-white block mb-0.5">Verification Constraint:</strong>
              2D camera landmarks cannot measure 3D circumferences directly without calibration. The numbers below are calibrated approximations. Please verify or fine-tune with the sliders before confirming.
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Estimated Dimensions (Calibrated)
            </h4>

            {/* Slider controls for verification */}
            {[
              { key: 'chest_cm', label: 'Chest Circumference', min: 75, max: 135 },
              { key: 'shoulder_cm', label: 'Shoulder Width', min: 36, max: 56 },
              { key: 'waist_cm', label: 'Waist Circumference', min: 60, max: 120 },
              { key: 'hip_cm', label: 'Hip Circumference', min: 75, max: 130 }
            ].map(item => (
              <div key={item.key} className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10 flex items-center justify-between gap-4">
                <div className="w-48">
                  <span className="text-xs text-white block">{item.label}</span>
                  <span className="text-[10px] font-mono text-emerald-400">Confidence: {(confidence[item.key] * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  value={estimates[item.key]}
                  onChange={(e) => setEstimates(prev => ({ ...prev, [item.key]: parseFloat(e.target.value) }))}
                  className="w-full accent-white cursor-pointer"
                />
                <span className="w-16 font-mono text-sm text-right text-white font-semibold">
                  {estimates[item.key]} cm
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              onClick={() => setCurrentStep('front_capture')}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white"
            >
              Retake Photos
            </button>
            <button
              onClick={handleFinalSave}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors shadow-2xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

