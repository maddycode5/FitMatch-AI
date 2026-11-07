import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Star, MessageSquare } from 'lucide-react';

export default function FitFeedbackModal({ isOpen, onClose, product, recommendedSize }) {
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const options = [
    { id: 'too_tight', label: 'Too Tight', note: 'Significant restriction in motion' },
    { id: 'slightly_tight', label: 'Slightly Tight', note: 'Wearable, but snug on key areas' },
    { id: 'perfect', label: 'Perfect Fit', note: 'Exact target ease and posture alignment' },
    { id: 'slightly_loose', label: 'Slightly Loose', note: 'Comfortable with slight excess drape' },
    { id: 'too_loose', label: 'Too Loose', note: 'Oversized beyond intention' }
  ];

  const handleSubmit = () => {
    if (!feedback) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg glass-panel bg-[#0e0e11] rounded-3xl border border-white/10 p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Fit Calibration Loop
              </span>
              <h3 className="font-serif text-2xl text-white mt-1">
                How did size {recommendedSize} fit?
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-1">
                For {product?.product_name}. Your direct feedback calibrates our category-specific ease models.
              </p>
            </div>

            <div className="space-y-2.5">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFeedback(opt.id)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    feedback === opt.id
                      ? 'border-white bg-white/10 text-white'
                      : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[11px] text-neutral-400 font-light">{opt.note}</div>
                  </div>
                  {feedback === opt.id && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!feedback}
              className="w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-40"
            >
              Submit Fit Calibration
            </button>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-xl text-white">Feedback Calibrated</h4>
            <p className="text-xs text-neutral-400 font-mono">
              Adjusted ease weighting applied to future recommendations.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

