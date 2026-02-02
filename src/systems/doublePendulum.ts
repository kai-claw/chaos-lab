import { Vector2, Vector3 } from 'three';

export interface DoublePendulumParams {
  mass1: number;
  mass2: number;
  length1: number;
  length2: number;
  gravity: number;
  damping: number;
}

export interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

export class DoublePendulumSystem {
  public points: Vector3[] = [];
  public positions: { p1: Vector2; p2: Vector2 }[] = [];
  private state: PendulumState;
  private params: DoublePendulumParams;
  private dt: number = 0.005;

  // Lyapunov exponent computation (for phase space)
  private pertState: PendulumState = { theta1: 1e-6, theta2: 0, omega1: 0, omega2: 0 };
  private lyapunovSum: number = 0;
  private lyapunovSteps: number = 0;
  public lyapunovExponent: number = 0;
  private readonly RENORM_INTERVAL = 20;
  private stepsSinceRenorm = 0;

  // Poincaré section: theta2 = 0 crossings with omega2 > 0
  private prevTheta2: number = 0;
  public poincarePoints: [number, number][] = [];
  private readonly MAX_POINCARE = 5000;

  constructor(
    initialState: PendulumState = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
    params: DoublePendulumParams
  ) {
    this.state = { ...initialState };
    this.params = params;
    this.prevTheta2 = initialState.theta2;

    const pos = this.calculatePositions();
    this.positions = [pos];
    this.points = [new Vector3(pos.p2.x, pos.p2.y, 0)];
  }

  private calculatePositions(): { p1: Vector2; p2: Vector2 } {
    const { length1, length2 } = this.params;
    const { theta1, theta2 } = this.state;

    const p1 = new Vector2(
      length1 * Math.sin(theta1),
      -length1 * Math.cos(theta1)
    );
    const p2 = new Vector2(
      p1.x + length2 * Math.sin(theta2),
      p1.y - length2 * Math.cos(theta2)
    );

    return { p1, p2 };
  }

  /** Compute angular accelerations for given state */
  private accelerations(s: PendulumState): { alpha1: number; alpha2: number } {
    const { mass1, mass2, length1, length2, gravity, damping } = this.params;
    const { theta1, theta2, omega1, omega2 } = s;

    const m1 = mass1, m2 = mass2, l1 = length1, l2 = length2, g = gravity;
    const cos12 = Math.cos(theta1 - theta2);
    const sin12 = Math.sin(theta1 - theta2);
    const sin1 = Math.sin(theta1);
    const sin2 = Math.sin(theta2);

    const den1 = (m1 + m2) * l1 - m2 * l1 * cos12 * cos12;
    const den2 = (l2 / l1) * den1;

    const num1 = -m2 * l1 * omega1 * omega1 * sin12 * cos12 +
                  m2 * g * sin2 * cos12 +
                  m2 * l2 * omega2 * omega2 * sin12 -
                  (m1 + m2) * g * sin1;

    const num2 = -m2 * l2 * omega2 * omega2 * sin12 * cos12 +
                  (m1 + m2) * g * sin1 * cos12 +
                  (m1 + m2) * l1 * omega1 * omega1 * sin12 -
                  (m1 + m2) * g * sin2;

    let alpha1 = num1 / den1;
    let alpha2 = num2 / den2;
    alpha1 -= damping * omega1;
    alpha2 -= damping * omega2;

    return { alpha1, alpha2 };
  }

  /** State derivative for RK4 */
  private stateDerivative(s: PendulumState): PendulumState {
    const { alpha1, alpha2 } = this.accelerations(s);
    return {
      theta1: s.omega1,
      theta2: s.omega2,
      omega1: alpha1,
      omega2: alpha2,
    };
  }

  /** Add two PendulumStates */
  private addStates(a: PendulumState, b: PendulumState, scale: number): PendulumState {
    return {
      theta1: a.theta1 + b.theta1 * scale,
      theta2: a.theta2 + b.theta2 * scale,
      omega1: a.omega1 + b.omega1 * scale,
      omega2: a.omega2 + b.omega2 * scale,
    };
  }

  public step(speed: number = 1.0): Vector3 {
    const dt = this.dt * speed;

    // RK4 integration
    const k1 = this.stateDerivative(this.state);
    const k2 = this.stateDerivative(this.addStates(this.state, k1, 0.5 * dt));
    const k3 = this.stateDerivative(this.addStates(this.state, k2, 0.5 * dt));
    const k4 = this.stateDerivative(this.addStates(this.state, k3, dt));

    this.state.theta1 += (dt / 6) * (k1.theta1 + 2 * k2.theta1 + 2 * k3.theta1 + k4.theta1);
    this.state.theta2 += (dt / 6) * (k1.theta2 + 2 * k2.theta2 + 2 * k3.theta2 + k4.theta2);
    this.state.omega1 += (dt / 6) * (k1.omega1 + 2 * k2.omega1 + 2 * k3.omega1 + k4.omega1);
    this.state.omega2 += (dt / 6) * (k1.omega2 + 2 * k2.omega2 + 2 * k3.omega2 + k4.omega2);

    // Stability guard: reset on NaN or extreme divergence
    if (!isFinite(this.state.theta1) || !isFinite(this.state.theta2) ||
        !isFinite(this.state.omega1) || !isFinite(this.state.omega2) ||
        Math.abs(this.state.omega1) > 1e6 || Math.abs(this.state.omega2) > 1e6) {
      this.state = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 };
    }

    // Calculate positions
    const pos = this.calculatePositions();
    this.positions.push(pos);
    this.points.push(new Vector3(pos.p2.x, pos.p2.y, 0));

    // --- Lyapunov exponent (perturbation of theta1) ---
    // Evolve perturbation via linearized equations (finite diff approximation)
    const eps = 1e-7;
    const perturbedState: PendulumState = {
      theta1: this.state.theta1 + this.pertState.theta1 * eps,
      theta2: this.state.theta2 + this.pertState.theta2 * eps,
      omega1: this.state.omega1 + this.pertState.omega1 * eps,
      omega2: this.state.omega2 + this.pertState.omega2 * eps,
    };
    const dBase = this.stateDerivative(this.state);
    const dPert = this.stateDerivative(perturbedState);
    this.pertState.theta1 += ((dPert.theta1 - dBase.theta1) / eps) * dt;
    this.pertState.theta2 += ((dPert.theta2 - dBase.theta2) / eps) * dt;
    this.pertState.omega1 += ((dPert.omega1 - dBase.omega1) / eps) * dt;
    this.pertState.omega2 += ((dPert.omega2 - dBase.omega2) / eps) * dt;

    this.stepsSinceRenorm++;
    if (this.stepsSinceRenorm >= this.RENORM_INTERVAL) {
      const norm = Math.sqrt(
        this.pertState.theta1 ** 2 + this.pertState.theta2 ** 2 +
        this.pertState.omega1 ** 2 + this.pertState.omega2 ** 2
      );
      if (norm > 0 && isFinite(norm)) {
        this.lyapunovSum += Math.log(norm);
        this.lyapunovSteps++;
        this.pertState.theta1 /= norm;
        this.pertState.theta2 /= norm;
        this.pertState.omega1 /= norm;
        this.pertState.omega2 /= norm;
        const totalTime = this.lyapunovSteps * this.RENORM_INTERVAL * this.dt;
        this.lyapunovExponent = this.lyapunovSum / totalTime;
      }
      this.stepsSinceRenorm = 0;
    }

    // --- Poincaré section: theta2 crosses 0 from negative to positive ---
    const normTheta2 = ((this.state.theta2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const normPrev = ((this.prevTheta2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (normPrev > Math.PI && normTheta2 <= Math.PI && normTheta2 < 1 && this.points.length > 100) {
      this.poincarePoints.push([this.state.theta1, this.state.omega1]);
      if (this.poincarePoints.length > this.MAX_POINCARE) {
        this.poincarePoints.splice(0, this.poincarePoints.length - this.MAX_POINCARE);
      }
    }
    this.prevTheta2 = this.state.theta2;

    return new Vector3(pos.p2.x, pos.p2.y, 0);
  }

  public reset(initialState: PendulumState = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }): void {
    this.state = { ...initialState };
    const pos = this.calculatePositions();
    this.positions = [pos];
    this.points = [new Vector3(pos.p2.x, pos.p2.y, 0)];
    this.pertState = { theta1: 1e-6, theta2: 0, omega1: 0, omega2: 0 };
    this.lyapunovSum = 0;
    this.lyapunovSteps = 0;
    this.lyapunovExponent = 0;
    this.stepsSinceRenorm = 0;
    this.prevTheta2 = initialState.theta2;
    this.poincarePoints = [];
  }

  public updateParams(params: Partial<DoublePendulumParams>): void {
    this.params = { ...this.params, ...params };
  }

  /** In-place trim using splice (avoids creating new arrays via slice) */
  public trimTrail(maxLength: number): void {
    if (this.points.length > maxLength) {
      const excess = this.points.length - maxLength;
      this.points.splice(0, excess);
      this.positions.splice(0, excess);
    }
  }

  public getSpeed(): number {
    if (this.points.length < 2) return 0;
    const current = this.points[this.points.length - 1];
    const previous = this.points[this.points.length - 2];
    return current.distanceTo(previous);
  }

  public getCurrentPositions(): { p1: Vector2; p2: Vector2 } {
    return this.positions[this.positions.length - 1];
  }

  public getState(): PendulumState {
    return { ...this.state };
  }

  /** Apply a random perturbation to the current state.
   *  Angles get a small kick, angular velocities get a larger one. */
  public perturb(amount: number): void {
    this.state.theta1 += (Math.random() - 0.5) * amount * 0.3;
    this.state.theta2 += (Math.random() - 0.5) * amount * 0.3;
    this.state.omega1 += (Math.random() - 0.5) * amount * 3;
    this.state.omega2 += (Math.random() - 0.5) * amount * 3;
  }
}
