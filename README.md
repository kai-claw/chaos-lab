# Chaos Lab 🦋

An interactive chaos theory visualizer showcasing the beautiful complexity that emerges from simple mathematical systems.

## 🚀 Live Demo

**[Visit Chaos Lab](https://kai-claw.github.io/chaos-lab/)**

## ✨ Features

### Chaos Systems

1. **🦋 Lorenz Attractor**
   - The classic "butterfly" strange attractor discovered by Edward Lorenz
   - Real-time parameter controls: σ (sigma), ρ (rho), β (beta)
   - Color-coded trails based on velocity
   - Demonstrates sensitive dependence on initial conditions

2. **🌀 Rössler Attractor**
   - Otto Rössler's elegant chaotic system
   - Parameter controls: a, b, c
   - Different topology from the Lorenz attractor
   - Shows how simple equations can create complex behavior

3. **⚖️ Double Pendulum**
   - Classical mechanics meets chaos theory
   - Physics simulation with adjustable masses, lengths, and gravity
   - Trace the chaotic path of the second pendulum tip
   - Demonstrates how everyday systems can be chaotic

### Interactive Features

- **🎛️ Real-time Controls**: Adjust parameters on the fly and watch the system respond
- **🔄 Side-by-Side Mode**: Run two instances with slightly different initial conditions to see the butterfly effect in action
- **⏸️ Play/Pause & Speed Control**: Control the simulation speed from 0.1x to 5x
- **🎨 Beautiful Trails**: Configurable trail lengths with gradient coloring
- **📚 Educational Info Panels**: Learn about each system and what makes it chaotic
- **🎯 Presets**: Quick access to interesting parameter combinations like "Classic Lorenz", "Edge of Chaos", and "Period Doubling"
- **🌐 3D Camera Controls**: Orbit around 3D attractors with mouse controls

### Analysis Tools

- **📊 Lyapunov Exponent Indicator**: Real-time computation via variational equations — quantifies sensitivity to initial conditions
- **🔀 Bifurcation Diagrams**: Parameter sweeps showing the route from order to chaos
- **🎯 Poincaré Sections**: Cross-sectional slices of phase space revealing attractor structure
- **🗺️ Parameter Space Explorer**: Interactive heatmap of system behavior across parameter ranges
- **📸 Screenshots**: Capture the canvas as PNG (press P)
- **🔗 URL Sharing**: Full state encoded in URL hash for sharing configurations (press L)

### Accessibility & Performance

- **⌨️ Full Keyboard Navigation**: Space (play/pause), R (reset), 1-3 (systems), T (theme), S (side-by-side), H (help), P (screenshot), L (share)
- **♿ Screen Reader Support**: ARIA live regions, skip links, semantic structure
- **🎛️ Reduced Motion**: Auto-pauses when `prefers-reduced-motion` is set
- **⚡ RK4 Integration**: Fourth-order Runge-Kutta for numerically stable simulation
- **🧩 Code-Split**: Lazy-loaded analysis panels, vendor chunk separation

## 🛠️ Built With

- **React 19** + **TypeScript** — Modern UI framework with type safety
- **Vite 7** — Lightning-fast development and build tool  
- **Three.js** + **React Three Fiber** — 3D graphics and WebGL rendering
- **React Three Drei** — Useful helpers and abstractions
- **Zustand** — Lightweight state management

## 🎓 Educational Value

Chaos Lab demonstrates key concepts in chaos theory:

- **Sensitive Dependence on Initial Conditions**: Small changes lead to dramatically different outcomes
- **Strange Attractors**: Complex, non-repeating patterns that systems evolve towards  
- **Deterministic Chaos**: Predictable equations can produce unpredictable behavior
- **The Butterfly Effect**: How tiny variations can have massive consequences
- **Nonlinear Dynamics**: When the whole is more complex than the sum of its parts

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage Tips

1. **Start with Presets**: Try the built-in presets to see interesting behaviors
2. **Use Side-by-Side Mode**: Enable this to see the butterfly effect in real time
3. **Adjust Trail Length**: Longer trails show the full attractor shape, shorter trails show current motion
4. **Experiment with Parameters**: Small changes can lead to dramatically different behaviors
5. **Try Different Speeds**: Slow down to observe details, speed up to see long-term patterns

## 🧮 Mathematical Background

### Lorenz System
```
dx/dt = σ(y - x)
dy/dt = x(ρ - z) - y  
dz/dt = xy - βz
```

### Rössler System
```
dx/dt = -y - z
dy/dt = x + ay
dz/dt = b + z(x - c)
```

### Double Pendulum
Complex coupled differential equations governing the motion of two connected pendulums, leading to chaotic dynamics for certain parameter ranges.

## 📄 License

MIT License - feel free to use this for educational purposes!

---

*"Chaos: When the present determines the future, but the approximate present does not approximately determine the future." - Edward Lorenz*