import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { X, ChevronRight, ChevronLeft, Info } from 'lucide-react';

export default function TourGuide({ tourId, steps }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [userSettingsId, setUserSettingsId] = useState(null);
  const [completedTours, setCompletedTours] = useState([]);

  // Load user settings and check if tour is completed
  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const settings = await base44.entities.UserSettings.filter({ user_id: user.id });
        
        if (settings.length > 0) {
          setUserSettingsId(settings[0].id);
          const tours = settings[0].completed_tours || [];
          setCompletedTours(tours);
          if (!tours.includes(tourId)) {
            // Delay slightly to allow UI to render
            setTimeout(() => setIsVisible(true), 1000);
          }
        } else {
          // Create settings if not exist
          const newSettings = await base44.entities.UserSettings.create({
            user_id: user.id,
            completed_tours: []
          });
          setUserSettingsId(newSettings.id);
          setTimeout(() => setIsVisible(true), 1000);
        }
      } catch (error) {
        console.error("Error checking tour status:", error);
      }
    };

    checkTourStatus();
  }, [tourId]);

  // Update target rect when step changes or resize
  const updateTarget = useCallback(() => {
    if (!isVisible || !steps[currentStep]) return;

    const targetEl = document.querySelector(steps[currentStep].target);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
      });
      
      // Scroll to element
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // If target not found, try next step or just wait
        console.warn(`Tour target not found: ${steps[currentStep].target}`);
    }
  }, [currentStep, isVisible, steps]);

  useEffect(() => {
    updateTarget();
    window.addEventListener('resize', updateTarget);
    return () => window.removeEventListener('resize', updateTarget);
  }, [updateTarget]);

  const handleComplete = async () => {
    setIsVisible(false);
    try {
      const newCompletedTours = [...completedTours, tourId];
      if (userSettingsId) {
        await base44.entities.UserSettings.update(userSettingsId, {
          completed_tours: newCompletedTours
        });
      }
    } catch (error) {
      console.error("Error saving tour progress:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || !targetRect) return null;

  const currentStepData = steps[currentStep];

  // Calculate tooltip position (simplified)
  // Default to bottom, flip if not enough space
  let tooltipTop = targetRect.bottom + 10; // Added some scrollY offset in targetRect already? 
  // Wait, rect is absolute page coords. overlay is fixed.
  // Let's use fixed positioning for overlay elements
  
  const fixedRect = {
      top: targetRect.top - window.scrollY,
      left: targetRect.left - window.scrollX,
      width: targetRect.width,
      height: targetRect.height
  };

  const isBottom = window.innerHeight - fixedRect.top - fixedRect.height > 250;
  const tooltipStyle = isBottom 
      ? { top: fixedRect.top + fixedRect.height + 16, left: fixedRect.left + fixedRect.width / 2 }
      : { bottom: window.innerHeight - fixedRect.top + 16, left: fixedRect.left + fixedRect.width / 2 };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
        {/* Dimmed Overlay using simple rects */}
        {/* Top */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
          className="absolute bg-black pointer-events-auto"
          style={{ top: 0, left: 0, right: 0, height: fixedRect.top }}
        />
        {/* Bottom */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
            className="absolute bg-black pointer-events-auto"
            style={{ top: fixedRect.top + fixedRect.height, left: 0, right: 0, bottom: 0 }}
        />
        {/* Left */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
            className="absolute bg-black pointer-events-auto"
            style={{ top: fixedRect.top, left: 0, width: fixedRect.left, height: fixedRect.height }}
        />
        {/* Right */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
            className="absolute bg-black pointer-events-auto"
            style={{ top: fixedRect.top, left: fixedRect.left + fixedRect.width, right: 0, height: fixedRect.height }}
        />
        
        {/* Highlight Border */}
        <motion.div 
            className="absolute border-2 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.5)] pointer-events-none"
            layoutId="tour-highlight"
            style={{ 
                top: fixedRect.top - 4, 
                left: fixedRect.left - 4, 
                width: fixedRect.width + 8, 
                height: fixedRect.height + 8 
            }}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          key={currentStep} // Re-animate on step change
          className="absolute pointer-events-auto w-[320px] max-w-[90vw]"
          style={{
             ...tooltipStyle,
             transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 relative">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg shrink-0">
                  <Info className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {currentStepData.content}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-cyan-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                   <Button size="sm" variant="ghost" onClick={handlePrev} className="h-8 px-2">
                      <ChevronRight className="w-4 h-4 ml-1" /> قبلی
                   </Button>
                )}
                <Button size="sm" onClick={handleNext} className="h-8 bg-cyan-600 hover:bg-cyan-700 text-white">
                  {currentStep === steps.length - 1 ? 'پایان' : 'بعدی'}
                  {currentStep < steps.length - 1 && <ChevronLeft className="w-4 h-4 mr-1" />}
                </Button>
              </div>
            </div>

            <button 
                onClick={handleSkip}
                className="absolute top-3 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}