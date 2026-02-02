import React from 'react';
import { useStore, type ChaosSystem } from '../store/useStore';
import './InfoPanel.css';

const SYSTEM_INFO: Record<ChaosSystem, {
  title: string;
  description: string;
  equations: string[];
  whatMakesChaotic: string;
  parameters: Record<string, string>;
}> = {
  lorenz: {
    title: 'Lorenz Attractor',
    description: 'The Lorenz attractor is a set of chaotic solutions of the Lorenz system, discovered by Edward Lorenz in 1963. It arises from a simplified model of atmospheric convection.',
    equations: [
      'dx/dt = σ(y - x)',
      'dy/dt = x(ρ - z) - y',
      'dz/dt = xy - βz'
    ],
    whatMakesChaotic: 'The system is chaotic because small changes in initial conditions lead to drastically different outcomes over time. This is the famous "butterfly effect" — a butterfly flapping its wings in Brazil could theoretically cause a tornado in Texas.',
    parameters: {
      'σ (sigma)': 'Prandtl number — relates viscosity to thermal conductivity',
      'ρ (rho)': 'Rayleigh number — measures temperature difference',
      'β (beta)': 'Geometric factor related to the size of convection cells'
    }
  },
  rossler: {
    title: 'Rössler Attractor',
    description: 'The Rössler attractor is another chaotic system, developed by Otto Rössler in 1976. It was designed to be simpler than the Lorenz system while still exhibiting chaotic behavior.',
    equations: [
      'dx/dt = -y - z',
      'dy/dt = x + ay',
      'dz/dt = b + z(x - c)'
    ],
    whatMakesChaotic: 'The Rössler system shows how even simple nonlinear equations can produce chaos. The attractor has a characteristic spiral structure that folds back on itself, creating sensitive dependence on initial conditions.',
    parameters: {
      'a': 'Controls the rate of expansion in the y direction',
      'b': 'Constant term that affects the z component',
      'c': 'Controls the folding and stretching of the attractor'
    }
  },
  doublePendulum: {
    title: 'Double Pendulum',
    description: 'A double pendulum consists of two pendulums attached end to end. Despite being a deterministic system governed by well-known physical laws, it exhibits chaotic motion.',
    equations: [
      'Complex coupled differential equations',
      'involving angles θ₁, θ₂ and their',
      'angular velocities ω₁, ω₂'
    ],
    whatMakesChaotic: 'The chaos arises from the nonlinear coupling between the two pendulums. Small changes in the initial angles or velocities can lead to completely different trajectories. This demonstrates that chaos can emerge from simple, everyday systems.',
    parameters: {
      'Mass 1, Mass 2': 'Masses of the first and second pendulum bobs',
      'Length 1, Length 2': 'Lengths of the first and second pendulum arms',
      'Gravity': 'Gravitational acceleration',
      'Damping': 'Energy loss due to friction (0 = no damping)'
    }
  }
};

export const InfoPanel: React.FC = () => {
  const { currentSystem, showInfoPanel, setShowInfoPanel } = useStore();

  if (!showInfoPanel) {
    return (
      <button
        className="info-toggle collapsed"
        onClick={() => setShowInfoPanel(true)}
        aria-label="Show system information panel"
      >
        ℹ️
      </button>
    );
  }

  const info = SYSTEM_INFO[currentSystem];

  return (
    <aside className="info-panel" role="complementary" aria-label="System information">
      <div className="info-header">
        <h2>{info.title}</h2>
        <button
          className="info-close"
          onClick={() => setShowInfoPanel(false)}
          aria-label="Close information panel"
        >
          ✕
        </button>
      </div>

      <div className="info-content">
        <section aria-labelledby="info-overview">
          <h3 id="info-overview">Overview</h3>
          <p>{info.description}</p>
        </section>

        <section aria-labelledby="info-equations">
          <h3 id="info-equations">Equations</h3>
          <div className="equations" role="math" aria-label="System equations">
            {info.equations.map((equation, index) => (
              <div key={index} className="equation">
                {equation}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="info-chaos">
          <h3 id="info-chaos">What Makes It Chaotic?</h3>
          <p>{info.whatMakesChaotic}</p>
        </section>

        <section aria-labelledby="info-params">
          <h3 id="info-params">Parameters</h3>
          <dl className="parameters">
            {Object.entries(info.parameters).map(([param, description]) => (
              <div key={param} className="parameter">
                <dt><strong>{param}</strong></dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="info-tips">
          <h3 id="info-tips">Tips</h3>
          <ul>
            <li>Try the side-by-side mode to see how small changes create big differences</li>
            <li>Experiment with different presets to explore various behaviors</li>
            <li>Adjust the trail length to see more or less of the trajectory</li>
            <li>Use the speed control to slow down and observe the motion closely</li>
          </ul>
        </section>
      </div>
    </aside>
  );
};
