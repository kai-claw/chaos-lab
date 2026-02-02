import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import './QuickStart.css';

interface QuickStartStep {
  title: string;
  description: string;
  highlight?: string;
}

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    title: 'Welcome to Chaos Lab! 🦋',
    description: 'Explore the beautiful world of chaos theory through interactive visualizations. Watch as simple equations create complex, unpredictable patterns.',
  },
  {
    title: 'Try Side-by-Side Mode',
    description: "Enable 'Butterfly Mode' to see the butterfly effect in action. Two systems with tiny differences will evolve completely differently!",
    highlight: 'side-by-side',
  },
  {
    title: 'Experiment with Parameters',
    description: 'Adjust the sliders to see how small changes in parameters can dramatically alter the behavior. Try the preset configurations for interesting starting points.',
    highlight: 'parameters',
  },
  {
    title: 'Explore Different Systems',
    description: 'Switch between Lorenz Attractor, Rössler Attractor, and Double Pendulum to see different types of chaotic behavior.',
    highlight: 'systems',
  },
  {
    title: 'Hear the Chaos 🔊',
    description: "Press M or click 'Sonify' to hear the chaos as sound! The pitch follows the attractor's position and the volume pulses with its velocity. Best with headphones.",
    highlight: 'audio',
  },
  {
    title: 'Learn More',
    description: 'Click the info button (ℹ️) to learn about the mathematics and physics behind each system. Ready to explore chaos?',
    highlight: 'info',
  },
];

export const QuickStart: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { setSideBySideMode, setShowInfoPanel } = useStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('chaosLabTutorial');
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  // Focus trap: focus modal when visible
  useEffect(() => {
    if (isVisible && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isVisible, currentStep]);

  const completeTutorial = useCallback(() => {
    localStorage.setItem('chaosLabTutorial', 'completed');
    setIsVisible(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < QUICK_START_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep, completeTutorial]);

  const handleStepAction = useCallback(() => {
    const step = QUICK_START_STEPS[currentStep];
    switch (step.highlight) {
      case 'side-by-side':
        setSideBySideMode(true);
        break;
      case 'info':
        setShowInfoPanel(true);
        break;
    }
    nextStep();
  }, [currentStep, nextStep, setSideBySideMode, setShowInfoPanel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      completeTutorial();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nextStep();
    }
  }, [completeTutorial, nextStep]);

  if (!isVisible) return null;

  const currentStepData = QUICK_START_STEPS[currentStep];
  const isLastStep = currentStep === QUICK_START_STEPS.length - 1;

  return (
    <div
      className="quick-start-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Quick start tutorial"
      onKeyDown={handleKeyDown}
    >
      <div className="quick-start-modal" ref={modalRef} tabIndex={-1}>
        <div className="quick-start-header">
          <h2 id="qs-title">{currentStepData.title}</h2>
          <button
            className="quick-start-close"
            onClick={completeTutorial}
            aria-label="Close tutorial"
          >
            ✕
          </button>
        </div>

        <div className="quick-start-content">
          <p id="qs-desc">{currentStepData.description}</p>

          <div className="quick-start-progress" role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={QUICK_START_STEPS.length}
            aria-label={`Step ${currentStep + 1} of ${QUICK_START_STEPS.length}`}
          >
            {QUICK_START_STEPS.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="quick-start-actions">
          <button
            className="quick-start-skip"
            onClick={completeTutorial}
          >
            Skip Tutorial
          </button>

          <button
            className="quick-start-next"
            onClick={currentStepData.highlight ? handleStepAction : nextStep}
            aria-describedby="qs-desc"
          >
            {isLastStep ? "Let's Explore!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
