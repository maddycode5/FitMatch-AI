import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import HeroSection from './components/hero/HeroSection';
import ProductStudio3D from './components/studio/ProductStudio3D';
import FitDemoSection from './components/fit-engine/FitDemoSection';
import LuxuryGrid from './components/showcase/LuxuryGrid';
import FitFinderModal from './components/onboarding/FitFinderModal';
import { INITIAL_USER_PROFILE, DEMO_USER_PROFILE } from './engine/types.js';

export default function App() {
  const [isFitFinderOpen, setIsFitFinderOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  // Load from localStorage or fallback to empty initial profile
  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fitmatch_profile');
      if (!saved) return INITIAL_USER_PROFILE;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || !parsed.measurements) {
        return INITIAL_USER_PROFILE;
      }
      return parsed;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  // Persist profile whenever it changes
  useEffect(() => {
    try {
      if (customerProfile) {
        localStorage.setItem('fitmatch_profile', JSON.stringify(customerProfile));
      }
    } catch (e) {
      console.warn("Storage not available:", e);
    }
  }, [customerProfile]);

  const handleSaveProfile = (updates) => {
    setCustomerProfile(prev => {
      const isDemo = updates.is_demo !== undefined ? Boolean(updates.is_demo) : Boolean(prev?.is_demo);
      const isVerified = isDemo
        ? false
        : (updates.measurement_metadata?.verified_by_user !== undefined
            ? Boolean(updates.measurement_metadata.verified_by_user)
            : Boolean(prev?.measurement_metadata?.verified_by_user));

      return {
        ...prev,
        ...updates,
        is_demo: isDemo,
        profile_label: isDemo
          ? "Demo Archetype (Size 42R / L)"
          : (updates.profile_label || (isVerified ? "Verified Customer Profile" : "Guest Profile (Uncalibrated)")),
        measurements: {
          ...(prev?.measurements || {}),
          ...(updates.measurements || {})
        },
        measurement_metadata: {
          ...(prev?.measurement_metadata || {}),
          ...(updates.measurement_metadata || {}),
          verified_by_user: isVerified,
          is_demo: isDemo,
          updated_at: new Date().toISOString()
        },
        fit_preferences: {
          ...(prev?.fit_preferences || {}),
          ...(updates.fit_preferences || {})
        }
      };
    });
  };

  const handleLoadDemoProfile = () => {
    setCustomerProfile(DEMO_USER_PROFILE);
  };

  const handleDeleteProfile = () => {
    try {
      localStorage.removeItem('fitmatch_profile');
    } catch (e) {
      console.warn("Storage removal error:", e);
    }
    setCustomerProfile(INITIAL_USER_PROFILE);
    setIsFitFinderOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white selection:text-black">
      {/* Floating Glassmorphic Header */}
      <Navbar
        onOpenFitFinder={() => setIsFitFinderOpen(true)}
        currentProfile={customerProfile}
      />

      <main>
        {/* Editorial Luxury 3D Hero */}
        <HeroSection
          onOpenFitFinder={() => setIsFitFinderOpen(true)}
          currentProfile={customerProfile}
        />

        {/* 3D Real-Time Atelier & Sizing Recommendation Engine */}
        <ProductStudio3D
          customerProfile={customerProfile}
          onOpenFitFinder={() => setIsFitFinderOpen(true)}
          onLoadDemoProfile={handleLoadDemoProfile}
          selectedProductIndex={selectedProductIndex}
          onSelectProduct={setSelectedProductIndex}
        />

        {/* Morphological AI Diagnostic Details */}
        <FitDemoSection
          customerProfile={customerProfile}
          selectedProductIndex={selectedProductIndex}
          onSelectProduct={setSelectedProductIndex}
        />

        {/* Curated Luxury Archive */}
        <LuxuryGrid onSelectProduct={setSelectedProductIndex} />
      </main>

      {/* Fit Finder Multi-Method Onboarding Modal */}
      <FitFinderModal
        isOpen={isFitFinderOpen}
        onClose={() => setIsFitFinderOpen(false)}
        currentProfile={customerProfile}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        onLoadDemoProfile={handleLoadDemoProfile}
      />

      {/* Minimalist Editorial Luxury Footer */}
      <footer className="w-full py-12 px-6 border-t border-white/[0.06] text-center text-xs text-neutral-400 font-mono tracking-widest uppercase">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 FitMatch AI Inc. Universal Clothing-Fit Intelligence.</span>
          <div className="flex gap-6">
            <button onClick={() => setIsFitFinderOpen(true)} className="hover:text-white transition-colors">
              Manage Body Profile
            </button>
            <a href="#studio-3d" className="hover:text-white transition-colors">3D Customizer</a>
            <a href="#" className="hover:text-white transition-colors">Privacy & Biometrics</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
