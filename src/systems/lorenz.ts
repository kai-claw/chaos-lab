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

  constructor(initialPosition: Vector3 = new Vector3(1, 1, 1), params: LorenzParams) {
    this.position = initialPosition.clone();
    this.params = params;
    this.points = [this.position.clone()];
  }

  public step(speed: number = 1.0): Vector3 {
    const { sigma, rho, beta } = this.params;
    const { x, y, z } = this.position;
    
    // Lorenz equations
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    
    // Update position using Euler integration
    const dt = this.dt * speed;
    this.position.x += dx * dt;
    this.position.y += dy * dt;
    this.position.z += dz * dt;
    
    this.points.push(this.position.clone());
    
    return this.position.clone();
  }

  public reset(initialPosition: Vector3 = new Vector3(1, 1, 1)): void {
    this.position = initialPosition.clone();
    this.points = [this.position.clone()];
  }

  public updateParams(params: Partial<LorenzParams>): void {
    this.params = { ...this.params, ...params };
  }

  public trimTrail(maxLength: number): void {
    if (this.points.length > maxLength) {
      this.points = this.points.slice(-maxLength);
    }
  }

  public getSpeed(): number {
    if (this.points.length < 2) return 0;
    const current = this.points[this.points.length - 1];
    const previous = this.points[this.points.length - 2];
    return current.distanceTo(previous);
  }
}