import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './QuickStart.css';

interface QuickStartStep {
  title: string;
  description: string;
  action?: () => void;
  highlight?: string;
}

const QUICK_START_STEPS: QuickStartStep[] = [
  {
    title: "Welcome to Chaos Lab! 🦋",
    description: "Explore the beautiful world of chaos theory through interactive visualizations. Watch as simple equations create complex, unpredictable patterns."
  },
  {
    title: "Try Side-by-Side Mode",
    description: "Enable 'Side-by-Side Mode' to see the butterfly effect in action. Two systems with tiny differences will evolve completely differently!",
    highlight: "side-by-side"
  },
  {
    title: "Experiment with Parameters",
    description: "Adjust the sliders to see how small changes in parameters can dramatically alter the behavior. Try the preset configurations for interesting starting points.",
    highlight: "parameters"
  },
  {
    title: "Explore Different Systems",
    description: "Switch between Lorenz Attractor, Rössler Attractor, and Double Pendulum to see different types of chaotic behavior.",
    highlight: "systems"
  },
  {
    title: "Learn More",
    description: "Click the info button (ℹ️) to learn about the mathematics and physics behind each system. Ready to explore chaos?",
    highlight: "info"
  }
];

export const QuickStart: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { setSideBySideMode, setShowInfoPanel } = useStore();

  useEffect(() => {
    // Show tutorial if first visit
    const hasSeenTutorial = localStorage.getItem('chaosLabTutorial');
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < QUICK_START_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    localStorage.setItem('chaosLabTutorial', 'completed');
    setIsVisible(false);
  };

  const handleStepAction = () => {
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
  };

  if (!isVisible) return null;

  const currentStepData = QUICK_START_STEPS[currentStep];
  const isLastStep = currentStep === QUICK_START_STEPS.length - 1;

  return (
    <div className="quick-start-overlay">
      <div className="quick-start-modal">
        <div className="quick-start-header">
          <h2>{currentStepData.title}</h2>
          <button 
            className="quick-start-close"
            onClick={skipTutorial}
            title="Skip Tutorial"
          >
            ✕
          </button>
        </div>
        
        <div className="quick-start-content">
          <p>{currentStepData.description}</p>
          
          <div className="quick-start-progress">
            {QUICK_START_STEPS.map((_, index) => (
              <div 
                key={index}
                className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        
        <div className="quick-start-actions">
          <button 
            className="quick-start-skip"
            onClick={skipTutorial}
          >
            Skip Tutorial
          </button>
          
          <button 
            className="quick-start-next"
            onClick={currentStepData.action ? handleStepAction : nextStep}
          >
            {isLastStep ? "Let's Explore!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};