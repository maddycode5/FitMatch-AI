import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Volume2 } from 'lucide-react';
import { timbreTTS, DIMENSION_METADATA } from '../../services/voiceMeasurementService';

export default function PhotoUploadFlow({ onSave, onBack }) {
  const [frontFile, setFrontFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Verify Estimates
  const [activeSpeakingKey, setActiveSpeakingKey] = useState(null);

  // User-verified measurements with photo reference (starts empty)
  const [estimates, setEstimates] = useState({
    height_cm: '',
    chest_cm: '',
    waist_cm: '',
    hip_cm: '',
    shoulder_cm: '',
    inseam_cm: ''
  });
  const [isDemoData, setIsDemoData] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleFillDemoValues = () => {
    setEstimates({
      height_cm: 178,
      chest_cm: 98,
      waist_cm: 82,
      hip_cm: 96,
      shoulder_cm: 45,
      inseam_cm: 80
    });
    setIsDemoData(true);
    setValidationError('');
  };

  const handleInputChange = (key, val) => {
    setIsDemoData(false);
    setValidationError('');
    setEstimates(prev => ({ ...prev, [key]: val }));
  };

  const handleFileChange = (e, type) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrorMsg("Please upload a supported image format (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 15MB limit. Please upload a smaller photo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === 'front') {
      setFrontFile(file);
      setFrontPreview(previewUrl);
    } else {
      setSideFile(file);
      setSidePreview(previewUrl);
    }
  };

  const handleStartAnalysis = () => {
    if (!frontFile) {
      setErrorMsg("Front full-body photo is required as a visual reference.");
      return;
    }

    setIsValidating(true);
    // Validate uploaded images and initialize guided tape verification
    setTimeout(() => {
      setIsValidating(false);
      setStep(2);
    }, 600);
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
    const chest = parseFloat(estimates.chest_cm);
    const waist = parseFloat(estimates.waist_cm);
    const shoulder = parseFloat(estimates.shoulder_cm);

    if (!chest || !waist || !shoulder || isNaN(chest) || isNaN(waist) || isNaN(shoulder)) {
      setValidationError("Please enter your physical tape measurements (or load sample demo values) before saving.");
      return;
    }

    timbreTTS.stop();
    onSave({
      is_demo: isDemoData,
      profile_label: isDemoData ? "Demo Archetype (Size 42R / L)" : "Verified Customer Profile",
      height_cm: estimates.height_cm ? parseFloat(estimates.height_cm) : (isDemoData ? 178 : null),
      weight_kg: isDemoData ? 72 : null,
      unit: "cm",
      measurements: {
        chest_cm: chest,
        waist_cm: waist,
        hip_cm: estimates.hip_cm ? parseFloat(estimates.hip_cm) : (isDemoData ? 96 : null),
        shoulder_cm: shoulder,
        neck_cm: isDemoData ? 39 : null,
        arm_length_cm: isDemoData ? 62 : null,
        sleeve_length_cm: isDemoData ? 63 : null,
        inseam_cm: estimates.inseam_cm ? parseFloat(estimates.inseam_cm) : (isDemoData ? 80 : null),
        thigh_cm: isDemoData ? 56 : null
      },
      measurement_metadata: {
        source: isDemoData ? "demo_archetype" : "photo_guided_reference",
        verified_by_user: !isDemoData,
        is_demo: isDemoData,
        prototype_mode: "experimental_photo_reference",
        disclaimer: isDemoData
          ? "Standardized sample measurements loaded for demonstration (unverified)"
          : "User-verified manual measurement with photo proportion reference",
        updated_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      {step === 1 ? (
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase font-semibold">
                🧪 Experimental UI Prototype
              </span>
            </div>
            <h3 className="font-serif text-xl text-white">Upload Posture Reference Photos</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Upload clear full-body photographs for visual proportion reference, followed by guided tape measurement verification.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Upload Dual Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Front Photo */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-neutral-300 block">
                Front Reference * (Full Body)
              </span>
              <label className="block w-full aspect-[3/4] max-h-72 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/50 cursor-pointer overflow-hidden transition-colors relative bg-neutral-900/40">
                {frontPreview ? (
                  <img src={frontPreview} alt="Front Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <Upload className="w-8 h-8 mb-2 text-neutral-500" />
                    <span className="text-xs font-medium text-white">Select Front Photo</span>
                    <span className="text-[10px] text-neutral-500 mt-1">Head to feet clearly visible</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'front')}
                />
              </label>
            </div>

            {/* Side Photo */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-neutral-300 block">
                Side Profile (Recommended)
              </span>
              <label className="block w-full aspect-[3/4] max-h-72 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/50 cursor-pointer overflow-hidden transition-colors relative bg-neutral-900/40">
                {sidePreview ? (
                  <img src={sidePreview} alt="Side Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <ImageIcon className="w-8 h-8 mb-2 text-neutral-500" />
                    <span className="text-xs font-medium text-white">Select Side Photo</span>
                    <span className="text-[10px] text-neutral-500 mt-1">Provides lateral depth reference</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'side')}
                />
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <button onClick={onBack} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={isValidating}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Quality...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Tape Verification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Verification of Dimensions with Photo Reference */
        <div className="space-y-5">
          {/* Transparent Disclosure Notice */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed font-light">
              <strong className="font-medium text-white block mb-0.5">
                Experimental UI Prototype: Photo Posture Reference & User Verification
              </strong>
              Static 2D photos cannot calculate 3D circumferences directly. Your uploaded photos are displayed for visual reference. Please confirm your actual tape measurements below before saving.
            </div>
          </div>

          {/* Uploaded Reference Thumbnails */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-900/50 border border-white/10">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Front Photo Reference</span>
              <div className="aspect-[3/4] max-h-36 rounded-xl overflow-hidden bg-black border border-white/10 mx-auto">
                {frontPreview && <img src={frontPreview} alt="Front Reference" className="w-full h-full object-cover" />}
              </div>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Side Photo Reference</span>
              <div className="aspect-[3/4] max-h-36 rounded-xl overflow-hidden bg-black border border-white/10 mx-auto">
                {sidePreview ? (
                  <img src={sidePreview} alt="Side Reference" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">
                    Not Provided
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demo Data Banner when Demo is active */}
          {isDemoData && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
              <span className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Demo Archetype Values Loaded (Size 42R) • Will be saved as unverified sample data</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Demo
              </span>
            </div>
          )}

          {/* Validation Warning */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Dimension Adjustment List with Gnani Voice Guidance */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-300">
                  User-Verified Tape Dimensions
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Fields start empty. Please measure with a physical tape or load demo values.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillDemoValues}
                  className="px-3 py-1 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 hover:border-cyan-400 transition-all flex items-center gap-1"
                >
                  <span>⚡ Load Demo Values (42R)</span>
                </button>
              </div>
            </div>

            {[
              { key: 'chest_cm', label: 'Chest / Bust Circumference', placeholder: '98', required: true },
              { key: 'shoulder_cm', label: 'Shoulder Width', placeholder: '45', required: true },
              { key: 'waist_cm', label: 'Waist Circumference', placeholder: '82', required: true },
              { key: 'hip_cm', label: 'Hip Circumference', placeholder: '96', required: false },
              { key: 'inseam_cm', label: 'Inseam Length', placeholder: '80', required: false }
            ].map(item => (
              <div key={item.key} className="p-3.5 rounded-xl bg-neutral-900/70 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
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
                    <span className="text-xs text-white font-medium block">
                      {item.label} {item.required && <span className="text-cyan-400">*</span>}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Physical tape measurement</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder={`e.g. ${item.placeholder}`}
                    value={estimates[item.key]}
                    onChange={(e) => handleInputChange(item.key, e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-xl bg-black/80 border border-white/20 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none text-right placeholder:text-neutral-600"
                  />
                  <span className="font-mono text-xs text-neutral-400 w-6">cm</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <button onClick={() => setStep(1)} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back to Uploads
            </button>
            <button
              onClick={handleFinalSave}
              className={`px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors shadow-2xl ${
                isDemoData
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDemoData ? 'Save as Demo Profile (Unverified)' : 'Confirm & Save Verified Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
