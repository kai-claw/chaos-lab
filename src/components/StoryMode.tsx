import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useStore, STORY_PRESETS, THEMES } from '../store/useStore';
import './StoryMode.css';

/**
 * Story Mode — a guided cinematic journey through chaos theory.
 * Uses the existing STORY_PRESETS to take users on an
 * auto-advancing narrative tour with smooth transitions.
 */

const DWELL_TIME = 12000; // ms to stay on each story before auto-advancing
const TRANSITION_DURATION = 2000; // ms for crossfade between stories

export const StoryMode: React.FC = () => {
  const {
    storyMode, setStoryMode,
    currentStoryIndex, setCurrentStoryIndex,
    setCurrentSystem, setLorenzParams, setRosslerParams, setDoublePendulumParams,
    setTrailLength, setSpeed, setSideBySideMode, setInitialOffset,
    setCurrentPreset, setAutoRotate, resetSimulation,
    colorTheme, setCinematicCamera, setParticleSwarm,
  } = useStore();

  const theme = THEMES[colorTheme];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [displayIdx, setDisplayIdx] = useState(0);

  /** Apply a story preset's settings */
  const applyPreset = useCallback((index: number) => {
    const story = STORY_PRESETS[index];
    if (!story) return;

    setCurrentSystem(story.system);
    setTrailLength(story.trailLength);
    setSpeed(story.speed);
    setSideBySideMode(story.sideBySide);
    setInitialOffset(story.offset);
    setCurrentPreset(null);
    setAutoRotate(true);

    // Auto-enable cinematic camera for single-attractor stories (not side-by-side)
    // This creates an immersive first-person flythrough experience
    setCinematicCamera(!story.sideBySide);

    // Auto-enable particle swarm for the murmuration story
    setParticleSwarm(story.name === 'The Murmuration');

    // Apply system-specific parameters
    switch (story.system) {
      case 'lorenz':
        setLorenzParams(story.params);
        break;
      case 'rossler':
        setRosslerParams(story.params);
        break;
      case 'doublePendulum':
        setDoublePendulumParams(story.params);
        break;
    }

    // Brief reset to reinitialize
    resetSimulation();
  }, [
    setCurrentSystem, setLorenzParams, setRosslerParams, setDoublePendulumParams,
    setTrailLength, setSpeed, setSideBySideMode, setInitialOffset,
    setCurrentPreset, setAutoRotate, setCinematicCamera, setParticleSwarm, resetSimulation,
  ]);

  /** Advance to next story */
  const advance = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      const nextIdx = (currentStoryIndex + 1) % STORY_PRESETS.length;
      setCurrentStoryIndex(nextIdx);
      applyPreset(nextIdx);
      setDisplayIdx(nextIdx);
      setTimeout(() => setTransitioning(false), 100);
    }, TRANSITION_DURATION / 2);
  }, [currentStoryIndex, setCurrentStoryIndex, applyPreset]);

  /** Go to previous story */
  const goBack = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      const prevIdx = (currentStoryIndex - 1 + STORY_PRESETS.length) % STORY_PRESETS.length;
      setCurrentStoryIndex(prevIdx);
      applyPreset(prevIdx);
      setDisplayIdx(prevIdx);
      setTimeout(() => setTransitioning(false), 100);
    }, TRANSITION_DURATION / 2);
  }, [currentStoryIndex, setCurrentStoryIndex, applyPreset]);

  // Apply initial preset when story mode activates
  useEffect(() => {
    if (storyMode) {
      applyPreset(currentStoryIndex);
      setDisplayIdx(currentStoryIndex);
    }
  }, [storyMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance timer
  useEffect(() => {
    if (!storyMode) return;

    timerRef.current = setTimeout(advance, DWELL_TIME);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storyMode, currentStoryIndex, advance]);

  /** Exit story mode */
  const exitStoryMode = useCallback(() => {
    setStoryMode(false);
    setCinematicCamera(false);
    setParticleSwarm(false);
    setAutoRotate(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [setStoryMode, setCinematicCamera, setParticleSwarm, setAutoRotate]);

  // Handle keyboard
  useEffect(() => {
    if (!storyMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitStoryMode();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [storyMode, advance, goBack, exitStoryMode]);

  if (!storyMode) return null;

  const story = STORY_PRESETS[displayIdx];
  if (!story) return null;

  return (
    <div
      className={`story-mode-overlay ${transitioning ? 'transitioning' : ''}`}
      style={{
        '--story-accent': theme.accent,
        '--story-bg': theme.panelBg,
        '--story-text': theme.text,
        '--story-border': theme.panelBorder,
      } as React.CSSProperties}
    >
      {/* Top bar: progress dots */}
      <div className="story-progress">
        {STORY_PRESETS.map((_, i) => (
          <button
            key={i}
            className={`story-dot ${i === displayIdx ? 'active' : ''} ${i < displayIdx ? 'visited' : ''}`}
            onClick={() => {
              setTransitioning(true);
              setTimeout(() => {
                setCurrentStoryIndex(i);
                applyPreset(i);
                setDisplayIdx(i);
                setTimeout(() => setTransitioning(false), 100);
              }, TRANSITION_DURATION / 2);
            }}
            aria-label={`Go to story ${i + 1}: ${STORY_PRESETS[i].name}`}
          />
        ))}
      </div>

      {/* Main story card — bottom center */}
      <div className="story-card">
        <div className="story-emoji">{story.emoji}</div>
        <div className="story-text">
          <h2 className="story-title">{story.name}</h2>
          <p className="story-description">{story.description}</p>
        </div>
        <div className="story-counter">
          {displayIdx + 1} / {STORY_PRESETS.length}
        </div>
      </div>

      {/* Navigation */}
      <div className="story-nav">
        <button className="story-nav-btn" onClick={goBack} aria-label="Previous story">
          ←
        </button>
        <button className="story-nav-btn story-exit" onClick={exitStoryMode} aria-label="Exit story mode">
          ✕ Exit
        </button>
        <button className="story-nav-btn" onClick={advance} aria-label="Next story">
          →
        </button>
      </div>
    </div>
  );
};
