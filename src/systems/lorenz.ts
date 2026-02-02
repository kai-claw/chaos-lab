import { Vector3 } from 'three';

export interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

export class LorenzSystem {
  public points: Vector3[] = [];
  private position: Vector3;
  private params: LorenzParams;
  private dt: number = 0.01;

  // Lyapunov exponent computation
  private perturbation: Vector3 = new Vector3(1, 0, 0);
  private lyapunovSum: number = 0;
  private lyapunovSteps: number = 0;
  public lyapunovExponent: number = 0;
  private readonly RENORM_INTERVAL = 10;
  private stepsSinceRenorm = 0;

  // Poincaré section tracking
  private prevZ: number = 0;
  private prevDz: number = 0;
  public poincarePoints: [number, number][] = [];
  private readonly MAX_POINCARE = 5000;

  constructor(initialPosition: Vector3 = new Vector3(1, 1, 1), params: LorenzParams) {
    this.position = initialPosition.clone();
    this.params = params;
    this.points = [this.position.clone()];
    this.prevZ = initialPosition.z;
  }

  /** RK4 derivatives for Lorenz */
  private derivatives(x: number, y: number, z: number): [number, number, number] {
    const { sigma, rho, beta } = this.params;
    return [
      sigma * (y - x),
      x * (rho - z) - y,
      x * y - beta * z,
    ];
  }

  /** Jacobian of Lorenz system at (x, y, z) applied to perturbation (dx, dy, dz) */
  private jacobianApply(x: number, y: number, z: number, dx: number, dy: number, dz: number): [number, number, number] {
    const { sigma, rho, beta } = this.params;
    return [
      sigma * (dy - dx),
      (rho - z) * dx - dy - x * dz,
      y * dx + x * dy - beta * dz,
    ];
  }

  public step(speed: number = 1.0): Vector3 {
    const dt = this.dt * speed;
    const { x, y, z } = this.position;

    // RK4 integration for main trajectory
    const [k1x, k1y, k1z] = this.derivatives(x, y, z);
    const [k2x, k2y, k2z] = this.derivatives(
      x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, z + 0.5 * dt * k1z
    );
    const [k3x, k3y, k3z] = this.derivatives(
      x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, z + 0.5 * dt * k2z
    );
    const [k4x, k4y, k4z] = this.derivatives(
      x + dt * k3x, y + dt * k3y, z + dt * k3z
    );

    this.position.x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    this.position.y += (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    this.position.z += (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);

    // Stability guard: reset on divergence / NaN
    if (!isFinite(this.position.x) || !isFinite(this.position.y) || !isFinite(this.position.z) ||
        Math.abs(this.position.x) > 1e6) {
      this.position.set(1, 1, 1);
    }

    this.points.push(new Vector3(this.position.x, this.position.y, this.position.z));

    // --- Lyapunov exponent via variational equation ---
    const px = this.perturbation.x;
    const py = this.perturbation.y;
    const pz = this.perturbation.z;
    const [jx, jy, jz] = this.jacobianApply(this.position.x, this.position.y, this.position.z, px, py, pz);
    this.perturbation.x += jx * dt;
    this.perturbation.y += jy * dt;
    this.perturbation.z += jz * dt;

    this.stepsSinceRenorm++;
    if (this.stepsSinceRenorm >= this.RENORM_INTERVAL) {
      const norm = this.perturbation.length();
      if (norm > 0 && isFinite(norm)) {
        this.lyapunovSum += Math.log(norm);
        this.lyapunovSteps++;
        this.perturbation.divideScalar(norm);
        const totalTime = this.lyapunovSteps * this.RENORM_INTERVAL * this.dt;
        this.lyapunovExponent = this.lyapunovSum / totalTime;
      }
      this.stepsSinceRenorm = 0;
    }

    // --- Poincaré section (z-plane crossing, dz changing sign from + to -) ---
    const currentDz = this.position.z - this.prevZ;
    if (this.prevDz > 0 && currentDz <= 0 && this.points.length > 100) {
      // Crossed the Poincaré section plane (z local maximum)
      this.poincarePoints.push([this.position.x, this.position.y]);
      if (this.poincarePoints.length > this.MAX_POINCARE) {
        this.poincarePoints.splice(0, this.poincarePoints.length - this.MAX_POINCARE);
      }
    }
    this.prevDz = currentDz;
    this.prevZ = this.position.z;

    return this.position;
  }

  public reset(initialPosition: Vector3 = new Vector3(1, 1, 1)): void {
    this.position = initialPosition.clone();
    this.points = [this.position.clone()];
    this.perturbation.set(1, 0, 0);
    this.lyapunovSum = 0;
    this.lyapunovSteps = 0;
    this.lyapunovExponent = 0;
    this.stepsSinceRenorm = 0;
    this.prevZ = initialPosition.z;
    this.prevDz = 0;
    this.poincarePoints = [];
  }

  public updateParams(params: Partial<LorenzParams>): void {
    this.params = { ...this.params, ...params };
  }

  /** In-place trim using splice (avoids creating a new array via slice) */
  public trimTrail(maxLength: number): void {
    if (this.points.length > maxLength) {
      this.points.splice(0, this.points.length - maxLength);
    }
  }

  public getSpeed(): number {
    if (this.points.length < 2) return 0;
    const current = this.points[this.points.length - 1];
    const previous = this.points[this.points.length - 2];
    return current.distanceTo(previous);
  }

  public getParams(): LorenzParams {
    return { ...this.params };
  }

  /** Apply a random perturbation to the current position.
   *  Demonstrates sensitivity to initial conditions in real-time. */
  public perturb(amount: number): void {
    this.position.x += (Math.random() - 0.5) * amount * 2;
    this.position.y += (Math.random() - 0.5) * amount * 2;
    this.position.z += (Math.random() - 0.5) * amount * 2;
  }

  /** Get the current position for external readers (e.g. ParticleSwarm init). */
  public getPosition(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.position.y, z: this.position.z };
  }
}
