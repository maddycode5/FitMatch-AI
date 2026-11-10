import React, { useState } from 'react';
import { MEASUREMENT_BOUNDS } from '../../engine/types';
import { HelpCircle, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const GUIDE_TIPS = {
  height_cm: "Stand straight without shoes against a flat wall. Measure from base of heels to top of head.",
  chest_cm: "Place tape measure around the fullest part of your chest, under armpits, keeping tape horizontal.",
  waist_cm: "Measure around your natural waistline, typically located midway between lowest rib and top of hip bone.",
  hip_cm: "Stand with feet together and measure around the fullest circumference of your hips and buttocks.",
  shoulder_cm: "Measure from the tip of one acromion bone (shoulder point) across the natural curve of upper back to the other.",
  neck_cm: "Measure around the base of the neck where a shirt collar naturally sits, leaving room for one finger.",
  arm_length_cm: "With elbow slightly bent, measure from shoulder point down outside arm to the wrist bone.",
  inseam_cm: "Measure vertically along the inner leg seam, from the crotch point down to the bottom of ankle."
};

export default function ManualMeasurementFlow({ initialProfile, onSave, onBack }) {
  const [unit, setUnit] = useState(initialProfile?.unit || 'cm');
  const [step, setStep] = useState(1); // 1 = Entry, 2 = Review & Confirm
  const [activeTip, setActiveTip] = useState('chest_cm');
  const [isDemoData, setIsDemoData] = useState(Boolean(initialProfile?.is_demo));

  // Working state in cm - first-time visitors start empty, with example values shown as placeholders
  const [formData, setFormData] = useState({
    height_cm: initialProfile?.height_cm ?? '',
    weight_kg: initialProfile?.weight_kg ?? '',
    chest_cm: initialProfile?.measurements?.chest_cm ?? '',
    waist_cm: initialProfile?.measurements?.waist_cm ?? '',
    hip_cm: initialProfile?.measurements?.hip_cm ?? '',
    shoulder_cm: initialProfile?.measurements?.shoulder_cm ?? '',
    neck_cm: initialProfile?.measurements?.neck_cm ?? '',
    arm_length_cm: initialProfile?.measurements?.arm_length_cm ?? '',
    inseam_cm: initialProfile?.measurements?.inseam_cm ?? '',
    thigh_cm: initialProfile?.measurements?.thigh_cm ?? ''
  });

  const [errors, setErrors] = useState({});

  // Unit conversion helpers
  const displayVal = (cmVal) => {
    if (cmVal === '' || cmVal === null || cmVal === undefined) return '';
    if (unit === 'cm') return cmVal;
    return Math.round((cmVal / 2.54) * 10) / 10;
  };

  const handleFillDemoValues = () => {
    setFormData({
      height_cm: 178,
      weight_kg: 72,
      chest_cm: 98,
      waist_cm: 82,
      hip_cm: 96,
      shoulder_cm: 45,
      neck_cm: 39,
      arm_length_cm: 62,
      inseam_cm: 80,
      thigh_cm: 56
    });
    setIsDemoData(true);
    setErrors({});
  };

  const handleInputChange = (key, val) => {
    setIsDemoData(false); // Customer entered their own value, no longer pure demo data
    if (val === '') {
      setFormData(prev => ({ ...prev, [key]: '' }));
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const num = parseFloat(val);
    if (isNaN(num)) return;
    const cmValue = unit === 'in' ? Math.round(num * 2.54 * 10) / 10 : num;

    setFormData(prev => ({ ...prev, [key]: cmValue }));

    // Real-time physiological range validation
    const bound = MEASUREMENT_BOUNDS[key];
    if (bound) {
      if (cmValue < bound.min || cmValue > bound.max) {
        setErrors(prev => ({
          ...prev,
          [key]: `Standard range is ${unit === 'cm' ? bound.min : (bound.min/2.54).toFixed(0)} - ${unit === 'cm' ? bound.max : (bound.max/2.54).toFixed(0)} ${unit}`
        }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  const validateAll = () => {
    const newErrors = {};
    const requiredKeys = ['height_cm', 'chest_cm', 'waist_cm', 'shoulder_cm'];

    requiredKeys.forEach(key => {
      const bound = MEASUREMENT_BOUNDS[key];
      const val = formData[key];
      if (!val || val < bound.min || val > bound.max) {
        newErrors[key] = `Please enter a valid ${bound.label}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateAll()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = () => {
    onSave({
      is_demo: isDemoData,
      profile_label: isDemoData ? "Demo Archetype (Size 42R / L)" : "Verified Customer Profile",
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      unit,
      measurements: {
        chest_cm: formData.chest_cm ? parseFloat(formData.chest_cm) : null,
        waist_cm: formData.waist_cm ? parseFloat(formData.waist_cm) : null,
        hip_cm: formData.hip_cm ? parseFloat(formData.hip_cm) : null,
        shoulder_cm: formData.shoulder_cm ? parseFloat(formData.shoulder_cm) : null,
        neck_cm: formData.neck_cm ? parseFloat(formData.neck_cm) : null,
        arm_length_cm: formData.arm_length_cm ? parseFloat(formData.arm_length_cm) : null,
        sleeve_length_cm: formData.arm_length_cm ? parseFloat(formData.arm_length_cm) : null,
        inseam_cm: formData.inseam_cm ? parseFloat(formData.inseam_cm) : null,
        thigh_cm: formData.thigh_cm ? parseFloat(formData.thigh_cm) : null
      },
      measurement_metadata: {
        source: isDemoData ? "demo_archetype" : "manual",
        confidence: {
          chest_cm: 1.0,
          waist_cm: 1.0,
          hip_cm: 1.0,
          shoulder_cm: 1.0
        },
        verified_by_user: !isDemoData,
        is_demo: isDemoData,
        updated_at: new Date().toISOString()
      }
    });
  };

  return (
    <div className="w-full">
      {/* Unit Selector Toggle & Demo Filler */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-white/10">
        <div>
          <h3 className="font-serif text-xl text-white">Manual Body Dimensions</h3>
          <p className="text-xs text-neutral-400">Step {step} of 2: {step === 1 ? 'Dimension Entry' : 'Verify & Confirm'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFillDemoValues}
            className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors flex items-center gap-1 shadow-sm"
            title="Load standard 42R archetype demo measurements for testing"
          >
            <span>⚡ Load Demo Values (42R)</span>
          </button>
          <div className="flex items-center bg-neutral-900 border border-white/10 rounded-full p-1 text-xs">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-full transition-all ${unit === 'cm' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Metric (cm)
            </button>
            <button
              type="button"
              onClick={() => setUnit('in')}
              className={`px-3 py-1 rounded-full transition-all ${unit === 'in' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Imperial (in)
            </button>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleProceedToReview} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: Input Columns */}
            <div className="space-y-5">
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-1">
                Upper Body Core
              </div>

              {/* Chest Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <span>Chest Circumference *</span>
                    <button type="button" onClick={() => setActiveTip('chest_cm')} className="text-neutral-400 hover:text-white">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">{unit}</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={displayVal(formData.chest_cm)}
                  onChange={(e) => handleInputChange('chest_cm', e.target.value)}
                  onFocus={() => setActiveTip('chest_cm')}
                  className={`w-full bg-neutral-900/80 border ${errors.chest_cm ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors`}
                  placeholder="e.g. 98"
                />
                {errors.chest_cm && <p className="text-[11px] text-rose-400 mt-1">{errors.chest_cm}</p>}
              </div>

              {/* Shoulder Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <span>Shoulder Width *</span>
                    <button type="button" onClick={() => setActiveTip('shoulder_cm')} className="text-neutral-400 hover:text-white">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">{unit}</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={displayVal(formData.shoulder_cm)}
                  onChange={(e) => handleInputChange('shoulder_cm', e.target.value)}
                  onFocus={() => setActiveTip('shoulder_cm')}
                  className={`w-full bg-neutral-900/80 border ${errors.shoulder_cm ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors`}
                  placeholder="e.g. 45"
                />
                {errors.shoulder_cm && <p className="text-[11px] text-rose-400 mt-1">{errors.shoulder_cm}</p>}
              </div>

              {/* Waist Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-neutral-300 flex items-center gap-1.5">
                    <span>Waist Circumference *</span>
                    <button type="button" onClick={() => setActiveTip('waist_cm')} className="text-neutral-400 hover:text-white">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">{unit}</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={displayVal(formData.waist_cm)}
                  onChange={(e) => handleInputChange('waist_cm', e.target.value)}
                  onFocus={() => setActiveTip('waist_cm')}
                  className={`w-full bg-neutral-900/80 border ${errors.waist_cm ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors`}
                  placeholder="e.g. 82"
                />
                {errors.waist_cm && <p className="text-[11px] text-rose-400 mt-1">{errors.waist_cm}</p>}
              </div>

              {/* Neck & Arm Length */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Neck (Collar)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={displayVal(formData.neck_cm)}
                    onChange={(e) => handleInputChange('neck_cm', e.target.value)}
                    onFocus={() => setActiveTip('neck_cm')}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 39"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Arm Length</label>
                  <input
                    type="number"
                    step="0.5"
                    value={displayVal(formData.arm_length_cm)}
                    onChange={(e) => handleInputChange('arm_length_cm', e.target.value)}
                    onFocus={() => setActiveTip('arm_length_cm')}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 62"
                  />
                </div>
              </div>
            </div>

            {/* Right: Lower Body & Live Measurement Visualizer */}
            <div className="space-y-5">
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 border-b border-white/5 pb-1">
                Lower Body & Stature
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Height * ({unit})</label>
                  <input
                    type="number"
                    value={displayVal(formData.height_cm)}
                    onChange={(e) => handleInputChange('height_cm', e.target.value)}
                    onFocus={() => setActiveTip('height_cm')}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder={unit === 'cm' ? 'e.g. 178' : 'e.g. 70'}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || '' }))}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 72"
                  />
                </div>
              </div>

              {/* Hip & Inseam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Hip Circumference</label>
                  <input
                    type="number"
                    step="0.5"
                    value={displayVal(formData.hip_cm)}
                    onChange={(e) => handleInputChange('hip_cm', e.target.value)}
                    onFocus={() => setActiveTip('hip_cm')}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 96"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 mb-1 block">Inseam</label>
                  <input
                    type="number"
                    step="0.5"
                    value={displayVal(formData.inseam_cm)}
                    onChange={(e) => handleInputChange('inseam_cm', e.target.value)}
                    onFocus={() => setActiveTip('inseam_cm')}
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="e.g. 80"
                  />
                </div>
              </div>

              {/* Visual Tip Box */}
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-white/10 mt-4">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 uppercase mb-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>How to Measure: {MEASUREMENT_BOUNDS[activeTip]?.label || activeTip}</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  {GUIDE_TIPS[activeTip] || "Keep measuring tape level with the floor and tension snug without pulling tight into the skin."}
                </p>
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onBack}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white px-4 py-2"
            >
              Choose Different Method
            </button>
            <button
              type="submit"
              className="bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Review Dimensions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        /* Step 2: Verification Screen */
        <div className="space-y-6">
          {/* Distinct Demo Data vs Verified Customer Profile Banner */}
          {isDemoData ? (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start justify-between gap-3 text-xs text-amber-200">
              <div className="space-y-0.5">
                <span className="flex items-center gap-2 font-mono text-[11px] font-semibold text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Demo Profile Active (Size 42R Archetype)</span>
                </span>
                <p className="text-[11px] text-amber-300/80 font-light">
                  This profile uses standardized sample measurements for testing. It will be saved as unverified sample data.
                </p>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                Demo
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200 font-mono text-[11px]">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Customer Profile: Measurements entered manually by customer</span>
            </div>
          )}

          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <h4 className="text-sm font-medium text-white mb-3">
              {isDemoData ? 'Demo 42R Dimensions' : 'Confirm Your Personal Tape Dimensions'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Height</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.height_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Chest</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.chest_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Shoulder</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.shoulder_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Waist</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.waist_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Hips</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.hip_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Neck</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.neck_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Inseam</span>
                <span className="text-white text-sm font-semibold">{displayVal(formData.inseam_cm)} {unit}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl">
                <span className="text-neutral-500 block">Weight</span>
                <span className="text-white text-sm font-semibold">{formData.weight_kg} kg</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white px-4 py-2 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Numbers</span>
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className={`px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors shadow-2xl ${
                isDemoData
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isDemoData ? 'Save as Demo Profile (Unverified)' : 'Confirm & Save Verified Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

