import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Camera, Upload, Check, ShieldCheck, Trash2 } from 'lucide-react';
import ManualMeasurementFlow from './ManualMeasurementFlow';
import LiveCameraFlow from './LiveCameraFlow';
import PhotoUploadFlow from './PhotoUploadFlow';

export default function FitFinderModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  onDeleteProfile
}) {
  const [selectedMethod, setSelectedMethod] = useState(null); // 'manual' | 'camera' | 'photo' | null
  const [fitPreference, setFitPreference] = useState(currentProfile?.fit_preferences?.default_fit || 'regular');
  const [stage, setStage] = useState('method_selection'); // 'method_selection' | 'collecting' | 'preference_selection' | 'completed'

  if (!isOpen) return null;

  const handleProfileDataSaved = (profileUpdates) => {
    onSaveProfile({
      ...profileUpdates,
      fit_preferences: { default_fit: fitPreference }
    });
    setStage('preference_selection');
  };

  const handleFinalPreferenceSaved = (pref) => {
    setFitPreference(pref);
    onSaveProfile({
      fit_preferences: { default_fit: pref }
    });
    setStage('completed');
    setTimeout(() => {
      onClose();
      setStage('method_selection');
      setSelectedMethod(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-3xl glass-panel bg-[#0d0d0f] rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-10 my-8 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white hover:text-black flex items-center justify-center text-neutral-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STAGE 1: METHOD SELECTION */}
        {stage === 'method_selection' && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400">
                Fit Finder Engine
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal">
                Find Your Perfect Fit
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                Create your universal body profile once and discover the mathematically verified size for every product. Never compare across brands again.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block text-center">
                How would you like to provide your body measurements?
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Method A: Manual */}
                <button
                  onClick={() => {
                    setSelectedMethod('manual');
                    setStage('collecting');
                  }}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-white/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-base text-white font-medium mb-1">
                      Manual Measurement
                    </h3>
                    <p className="text-xs text-neutral-400 font-light">
                      Enter your tape measurements with our interactive visual placement guide.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-4 block">
                    Highest Reliability
                  </span>
                </button>

                {/* Method B: Live Camera */}
                <button
                  onClick={() => {
                    setSelectedMethod('camera');
                    setStage('collecting');
                  }}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-white/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                      <Camera className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-base text-white font-medium mb-1">
                      Live Camera Scan
                    </h3>
                    <p className="text-xs text-neutral-400 font-light">
                      Guided front and side posture capture with real-time pose silhouette tracking.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 mt-4 block">
                    Private & In-Browser
                  </span>
                </button>

                {/* Method C: Photo Upload */}
                <button
                  onClick={() => {
                    setSelectedMethod('photo');
                    setStage('collecting');
                  }}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-white/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-base text-white font-medium mb-1">
                      Upload Photos
                    </h3>
                    <p className="text-xs text-neutral-400 font-light">
                      Select full-body front and side pictures from your camera roll or device.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 mt-4 block">
                    Calibrated Estimates
                  </span>
                </button>
              </div>
            </div>

            {/* Profile Deletion & Privacy Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Zero third-party telemetry. You own your biometric data.
              </span>

              {onDeleteProfile && (
                <button
                  onClick={onDeleteProfile}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors font-mono text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Profile</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STAGE 2: ACTIVE COLLECTION FLOW */}
        {stage === 'collecting' && (
          <div>
            {selectedMethod === 'manual' && (
              <ManualMeasurementFlow
                initialProfile={currentProfile}
                onSave={handleProfileDataSaved}
                onBack={() => setStage('method_selection')}
              />
            )}
            {selectedMethod === 'camera' && (
              <LiveCameraFlow
                onSave={handleProfileDataSaved}
                onBack={() => setStage('method_selection')}
              />
            )}
            {selectedMethod === 'photo' && (
              <PhotoUploadFlow
                onSave={handleProfileDataSaved}
                onBack={() => setStage('method_selection')}
              />
            )}
          </div>
        )}

        {/* STAGE 3: FIT PREFERENCE SELECTION */}
        {stage === 'preference_selection' && (
          <div className="space-y-8 max-w-xl mx-auto py-4 text-center">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400">
              Profile Customization
            </span>
            <h2 className="font-serif text-3xl text-white">
              How do you prefer your clothes to fit?
            </h2>
            <p className="text-xs text-neutral-400">
              Fit preferences guide our target ease allowances without altering your true body dimensions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* Slim */}
              <button
                onClick={() => handleFinalPreferenceSaved('slim')}
                className={`p-5 rounded-2xl border transition-all ${
                  fitPreference === 'slim'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/10 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                }`}
              >
                <div className="font-serif text-lg font-medium text-white mb-1">Slim Fit</div>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Closer to the body. Minimal extra fabric ease for a contoured silhouette.
                </p>
                <span className="text-[10px] font-mono text-neutral-500 mt-4 block">
                  Target: +4cm to +8cm
                </span>
              </button>

              {/* Regular */}
              <button
                onClick={() => handleFinalPreferenceSaved('regular')}
                className={`p-5 rounded-2xl border transition-all ${
                  fitPreference === 'regular'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/10 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                }`}
              >
                <div className="font-serif text-lg font-medium text-white mb-1">Regular Fit</div>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Everyday tailored comfort. Natural ease allowing unrestricted mobility.
                </p>
                <span className="text-[10px] font-mono text-neutral-500 mt-4 block">
                  Target: +8cm to +14cm
                </span>
              </button>

              {/* Oversized */}
              <button
                onClick={() => handleFinalPreferenceSaved('oversized')}
                className={`p-5 rounded-2xl border transition-all ${
                  fitPreference === 'oversized'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/10 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                }`}
              >
                <div className="font-serif text-lg font-medium text-white mb-1">Oversized Fit</div>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Relaxed drape. Generous ease with dropped seams and architectural volume.
                </p>
                <span className="text-[10px] font-mono text-neutral-500 mt-4 block">
                  Target: +16cm to +24cm
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: COMPLETED BANNER */}
        {stage === 'completed' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-2xl">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl text-white">Universal Profile Established</h3>
            <p className="text-xs font-mono text-neutral-400">
              Synchronizing with the 3D Studio and Product Size Charts...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

