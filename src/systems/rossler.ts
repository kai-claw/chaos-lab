import { Vector3 } from 'three';

export interface RosslerParams {
  a: number;
  b: number;
  c: number;
}

export class RosslerSystem {
  public points: Vector3[] = [];
  private position: Vector3;
  private params: RosslerParams;
  private dt: number = 0.01;

  // Lyapunov exponent computation
  private perturbation: Vector3 = new Vector3(1, 0, 0);
  private lyapunovSum: number = 0;
  private lyapunovSteps: number = 0;
  public lyapunovExponent: number = 0;
  private readonly RENORM_INTERVAL = 10;
  private stepsSinceRenorm = 0;

  // Poincaré section tracking (y=0 plane, dy > 0)
  private prevY: number = 0;
  public poincarePoints: [number, number][] = [];
  private readonly MAX_POINCARE = 5000;

  constructor(initialPosition: Vector3 = new Vector3(1, 1, 1), params: RosslerParams) {
    this.position = initialPosition.clone();
    this.params = params;
    this.points = [this.position.clone()];
    this.prevY = initialPosition.y;
  }

  /** RK4 derivatives for Rössler */
  private derivatives(x: number, y: number, z: number): [number, number, number] {
    const { a, b, c } = this.params;
    return [
      -y - z,
      x + a * y,
      b + z * (x - c),
    ];
  }

  /** Jacobian applied to perturbation */
  private jacobianApply(x: number, _y: number, z: number, dx: number, dy: number, dz: number): [number, number, number] {
    const { a, c } = this.params;
    return [
      -dy - dz,
      dx + a * dy,
      z * dx + (x - c) * dz,
    ];
  }

  public step(speed: number = 1.0): Vector3 {
    const dt = this.dt * speed;
    const { x, y, z } = this.position;

    // RK4 integration
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

    this.points.push(this.position.clone());

    // --- Lyapunov exponent ---
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

    // --- Poincaré section (y crossing from negative to positive) ---
    if (this.prevY < 0 && this.position.y >= 0 && this.points.length > 100) {
      this.poincarePoints.push([this.position.x, this.position.z]);
      if (this.poincarePoints.length > this.MAX_POINCARE) {
        this.poincarePoints.splice(0, this.poincarePoints.length - this.MAX_POINCARE);
      }
    }
    this.prevY = this.position.y;

    return this.position.clone();
  }

  public reset(initialPosition: Vector3 = new Vector3(1, 1, 1)): void {
    this.position = initialPosition.clone();
    this.points = [this.position.clone()];
    this.perturbation.set(1, 0, 0);
    this.lyapunovSum = 0;
    this.lyapunovSteps = 0;
    this.lyapunovExponent = 0;
    this.stepsSinceRenorm = 0;
    this.prevY = initialPosition.y;
    this.poincarePoints = [];
  }

  public updateParams(params: Partial<RosslerParams>): void {
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

  public getParams(): RosslerParams {
    return { ...this.params };
  }

  /** Apply a random perturbation to the current position. */
  public perturb(amount: number): void {
    this.position.x += (Math.random() - 0.5) * amount * 2;
    this.position.y += (Math.random() - 0.5) * amount * 2;
    this.position.z += (Math.random() - 0.5) * amount * 2;
  }

  /** Get the current position for external readers. */
  public getPosition(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.position.y, z: this.position.z };
  }
}
