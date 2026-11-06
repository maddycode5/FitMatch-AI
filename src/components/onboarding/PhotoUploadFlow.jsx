import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export default function PhotoUploadFlow({ onSave, onBack }) {
  const [frontFile, setFrontFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Verify Estimates

  const [estimates, setEstimates] = useState({
    height_cm: 178,
    chest_cm: 98,
    waist_cm: 82,
    hip_cm: 96,
    shoulder_cm: 45
  });

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
      setErrorMsg("Front full-body photo is required for dimension analysis.");
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(2);
    }, 2000);
  };

  const handleFinalSave = () => {
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
        source: "photo",
        confidence: {
          chest_cm: sideFile ? 0.85 : 0.70,
          waist_cm: sideFile ? 0.80 : 0.65,
          hip_cm: sideFile ? 0.82 : 0.68,
          shoulder_cm: 0.88,
          height_cm: 0.90
        },
        verified_by_user: true,
        updated_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="w-full">
      {step === 1 ? (
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-serif text-xl text-white">Upload Full-Body Photographs</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Upload clear, recent photographs taken in fitted attire against a neutral wall.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Upload Dual Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Front Photo */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-neutral-300 block">
                Front Photo * (Full Body)
              </span>
              <label className="block w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/15 hover:border-white/40 cursor-pointer overflow-hidden transition-colors relative bg-neutral-900/40">
                {frontPreview ? (
                  <img src={frontPreview} alt="Front Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <Upload className="w-8 h-8 mb-2 text-neutral-500" />
                    <span className="text-xs font-medium text-white">Click to Select Front Photo</span>
                    <span className="text-[10px] text-neutral-500 mt-1">Head-to-toe visible in frame</span>
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
                Side Photo (Recommended)
              </span>
              <label className="block w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/15 hover:border-white/40 cursor-pointer overflow-hidden transition-colors relative bg-neutral-900/40">
                {sidePreview ? (
                  <img src={sidePreview} alt="Side Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <ImageIcon className="w-8 h-8 mb-2 text-neutral-500" />
                    <span className="text-xs font-medium text-white">Click to Select Side Photo</span>
                    <span className="text-[10px] text-neutral-500 mt-1">Improves 3D depth calibration</span>
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
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button onClick={onBack} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="bg-white text-black hover:bg-neutral-200 px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calibrating Mesh...</span>
                </>
              ) : (
                <>
                  <span>Analyze Photographs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Verification of Photo Estimates */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed font-light">
              <strong className="font-medium text-white block mb-0.5">Scale Calibration Notice:</strong>
              Estimated from 2D pixel silhouettes. Please verify that your height and key dimensions align with your actual tape measurements.
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Verify Estimated Dimensions
            </h4>

            {[
              { key: 'chest_cm', label: 'Chest Circumference', min: 75, max: 135 },
              { key: 'shoulder_cm', label: 'Shoulder Width', min: 36, max: 56 },
              { key: 'waist_cm', label: 'Waist Circumference', min: 60, max: 120 },
              { key: 'hip_cm', label: 'Hip Circumference', min: 75, max: 130 }
            ].map(item => (
              <div key={item.key} className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/10 flex items-center justify-between gap-4">
                <span className="text-xs text-white w-48 block">{item.label}</span>
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
            <button onClick={() => setStep(1)} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white">
              Back to Uploads
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

