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

  constructor(initialPosition: Vector3 = new Vector3(1, 1, 1), params: RosslerParams) {
    this.position = initialPosition.clone();
    this.params = params;
    this.points = [this.position.clone()];
  }

  public step(speed: number = 1.0): Vector3 {
    const { a, b, c } = this.params;
    const { x, y, z } = this.position;
    
    // Rössler equations
    const dx = -y - z;
    const dy = x + a * y;
    const dz = b + z * (x - c);
    
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

  public updateParams(params: Partial<RosslerParams>): void {
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