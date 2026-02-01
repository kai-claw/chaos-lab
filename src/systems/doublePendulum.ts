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
  theta1: number;  // angle of first pendulum
  theta2: number;  // angle of second pendulum
  omega1: number;  // angular velocity of first pendulum
  omega2: number;  // angular velocity of second pendulum
}

export class DoublePendulumSystem {
  public points: Vector3[] = []; // trail of second pendulum tip
  public positions: { p1: Vector2; p2: Vector2 }[] = []; // positions of both pendulums
  private state: PendulumState;
  private params: DoublePendulumParams;
  private dt: number = 0.005; // smaller timestep for stability

  constructor(
    initialState: PendulumState = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 },
    params: DoublePendulumParams
  ) {
    this.state = { ...initialState };
    this.params = params;
    
    // Calculate initial positions
    const pos = this.calculatePositions();
    this.positions = [pos];
    this.points = [new Vector3(pos.p2.x, pos.p2.y, 0)];
  }

  private calculatePositions(): { p1: Vector2; p2: Vector2 } {
    const { length1, length2 } = this.params;
    const { theta1, theta2 } = this.state;
    
    // First pendulum tip
    const p1 = new Vector2(
      length1 * Math.sin(theta1),
      -length1 * Math.cos(theta1)
    );
    
    // Second pendulum tip
    const p2 = new Vector2(
      p1.x + length2 * Math.sin(theta2),
      p1.y - length2 * Math.cos(theta2)
    );
    
    return { p1, p2 };
  }

  public step(speed: number = 1.0): Vector3 {
    const { mass1, mass2, length1, length2, gravity, damping } = this.params;
    const { theta1, theta2, omega1, omega2 } = this.state;
    
    // Derived quantities
    const m1 = mass1;
    const m2 = mass2;
    const l1 = length1;
    const l2 = length2;
    const g = gravity;
    
    const cos12 = Math.cos(theta1 - theta2);
    const sin12 = Math.sin(theta1 - theta2);
    const sin1 = Math.sin(theta1);
    const sin2 = Math.sin(theta2);
    
    // Denominators for the equations of motion
    const den1 = (m1 + m2) * l1 - m2 * l1 * cos12 * cos12;
    const den2 = (l2 / l1) * den1;
    
    // Angular accelerations (from Lagrangian mechanics)
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
    
    // Apply damping
    alpha1 -= damping * omega1;
    alpha2 -= damping * omega2;
    
    // Update state using Euler integration
    const dt = this.dt * speed;
    this.state.omega1 += alpha1 * dt;
    this.state.omega2 += alpha2 * dt;
    this.state.theta1 += this.state.omega1 * dt;
    this.state.theta2 += this.state.omega2 * dt;
    
    // Calculate new positions
    const pos = this.calculatePositions();
    this.positions.push(pos);
    
    // Add to trail (only track second pendulum tip)
    this.points.push(new Vector3(pos.p2.x, pos.p2.y, 0));
    
    return new Vector3(pos.p2.x, pos.p2.y, 0);
  }

  public reset(initialState: PendulumState = { theta1: Math.PI / 2, theta2: Math.PI / 2, omega1: 0, omega2: 0 }): void {
    this.state = { ...initialState };
    const pos = this.calculatePositions();
    this.positions = [pos];
    this.points = [new Vector3(pos.p2.x, pos.p2.y, 0)];
  }

  public updateParams(params: Partial<DoublePendulumParams>): void {
    this.params = { ...this.params, ...params };
  }

  public trimTrail(maxLength: number): void {
    if (this.points.length > maxLength) {
      this.points = this.points.slice(-maxLength);
      this.positions = this.positions.slice(-maxLength);
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
}