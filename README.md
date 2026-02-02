<div align="center">

# 🦋 Chaos Lab

**Interactive Chaos Theory Visualizer**

Explore strange attractors, the butterfly effect, and nonlinear dynamics through stunning real-time 3D visualizations.

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-chaos--lab-88ccff?style=for-the-badge&logo=github)](https://kai-claw.github.io/chaos-lab/)
[![Built with React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.182-black?style=flat-square&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-aaffaa?style=flat-square)](LICENSE)

</div>

---

## ✨ What is Chaos Lab?

Chaos Lab is a portfolio-grade interactive web application that brings chaos theory to life. Watch as simple mathematical equations create stunningly complex, never-repeating patterns in real-time 3D.

**[→ Launch Chaos Lab](https://kai-claw.github.io/chaos-lab/)**

---

## 🎯 Chaos Systems

| System | Description | Parameters |
|--------|-------------|------------|
| **🦋 Lorenz Attractor** | The iconic "butterfly" strange attractor discovered by Edward Lorenz in 1963 | σ (sigma), ρ (rho), β (beta) |
| **🌀 Rössler Attractor** | Otto Rössler's elegant chaotic spiral with different topology | a, b, c |
| **⚡ Double Pendulum** | Classical mechanics meets chaos — trace the unpredictable path of coupled pendulums | Mass, length, gravity, damping |

---

## 🚀 Feature Highlights

### 🔬 Analysis Tools
- **Lyapunov Exponent Indicator** — Real-time computation quantifying sensitivity to initial conditions
- **Bifurcation Diagrams** — Parameter sweeps showing the route from order to chaos
- **Poincaré Sections** — Cross-sectional slices revealing attractor structure
- **Parameter Space Explorer** — Interactive heatmap of system behavior

### 🎬 Creative Experience
- **Cinematic Chase Camera** — First-person flythrough following the trail head
- **Chaos Autopilot** — Auto-morphs parameters through interesting regions with smoothstep interpolation
- **Particle Swarm** — 200 particles swarming through the attractor simultaneously (murmuration effect)
- **Chaos Sonification** — Hear the attractor as sound — pitch follows position, volume follows velocity
- **Exposure Mode** — Long-exposure point cloud accumulation
- **Ghost Trails** — Freeze the current trail as a translucent hologram for comparison
- **Floor Shadow** — 2D projection beneath the attractor

### 🦋 The Butterfly Effect
- **Side-by-Side Mode** — Run two instances with tiny initial differences
- **Perturbation** — Apply a random impulse and watch trajectories diverge with dramatic camera shake
- **Divergence Meter** — Real-time tracking of how far apart the twin systems have drifted

### 📖 Story Mode
A guided cinematic tour through 7 curated chaos theory narratives with auto-advance, crossfade transitions, chase camera, and full keyboard navigation.

### 🎨 Four Visual Themes
| Classic 🌌 | Neon 💜 | Blueprint 📐 | Terminal 💻 |
|:-----------:|:-------:|:------------:|:-----------:|
| Deep space blues | Vivid purples | Technical whites | Green phosphor |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `R` | Reset simulation |
| `1` `2` `3` | Switch system (Lorenz / Rössler / Pendulum) |
| `S` | Toggle Butterfly Mode (side-by-side) |
| `C` | Toggle cinematic chase camera |
| `A` | Toggle chaos autopilot |
| `M` | Toggle audio sonification |
| `B` | Toggle bloom glow |
| `G` | Toggle particle swarm |
| `X` | Perturb — random kick |
| `F` | Capture ghost (`Shift+F` to clear) |
| `D` | Toggle floor shadow |
| `E` | Toggle exposure (`Shift+E` to clear) |
| `T` | Cycle color themes |
| `P` | Screenshot (PNG) |
| `L` | Copy share link |
| `H` / `?` | Help overlay |

---

## ♿ Accessibility

- Full keyboard navigation with visible focus indicators
- ARIA live regions, roles, labels, and semantic HTML throughout
- Screen reader support for all controls and state changes
- `prefers-reduced-motion` respected — auto-pauses simulation, disables all animations
- Skip-to-content link
- Min 44px touch targets on mobile
- High contrast focus indicators

---

## 🧮 The Mathematics

### Lorenz System
```
dx/dt = σ(y − x)
dy/dt = x(ρ − z) − y
dz/dt = xy − βz
```

### Rössler System
```
dx/dt = −y − z
dy/dt = x + ay
dz/dt = b + z(x − c)
```

### Double Pendulum
Coupled second-order ODEs governing the angles θ₁ and θ₂ of two connected pendulums, exhibiting chaotic dynamics for most initial conditions.

All systems use **fourth-order Runge-Kutta (RK4)** integration for numerical stability, with NaN/Infinity guards and automatic state recovery.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| [React 19](https://react.dev) | UI framework |
| [TypeScript 5.9](https://typescriptlang.org) | Type safety |
| [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs) | 3D rendering |
| [React Three Drei](https://drei.docs.pmnd.rs) | R3F helpers |
| [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing) | Bloom, effects |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [Vite 7](https://vite.dev) | Build tooling |
| [Vitest](https://vitest.dev) | Unit testing (50+ tests) |

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Architecture

```
src/
├── systems/          # Core math: Lorenz, Rössler, DoublePendulum
├── store/            # Zustand state: types, themes, presets, store
├── components/       # React + R3F components
│   ├── Scene.tsx     # Main 3D canvas
│   ├── Controls.tsx  # Control panel UI
│   ├── StoryMode.tsx # Guided narrative tour
│   └── ...           # 20+ specialized components
└── hooks/            # Custom hooks: keyboard, URL state, screenshots
```

### Performance

- Zero per-frame allocations in hot path (pre-allocated scratch vectors)
- Adaptive performance monitor (auto-reduces quality at <30fps)
- Code-split analysis panels (lazy-loaded)
- Vendor chunk separation (Three.js isolated)
- DPR clamped to [1, 2] on mobile
- Throttled state updates for non-critical UI

---

## 🎓 Learn About Chaos

| Concept | What It Means |
|---------|---------------|
| **Sensitive Dependence** | Tiny changes → dramatically different outcomes |
| **Strange Attractors** | Complex, non-repeating geometric patterns that systems evolve toward |
| **Deterministic Chaos** | Predictable equations producing unpredictable behavior |
| **The Butterfly Effect** | A butterfly's wings could theoretically trigger a tornado |
| **Nonlinear Dynamics** | When the whole is vastly more complex than the sum of its parts |

---

## 📄 License

MIT — free for educational and personal use.

---

<div align="center">

*"Chaos: When the present determines the future, but the approximate present does not approximately determine the future."*
— **Edward Lorenz**

**[🦋 Launch Chaos Lab →](https://kai-claw.github.io/chaos-lab/)**

</div>
