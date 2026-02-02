import { describe, it, expect, afterEach } from 'vitest';
import { Vector3 } from 'three';
import { systemRef, setActiveSystem, clearActiveSystem, type ChaosSystemRef } from './systemRef';

function createMockSystem(): ChaosSystemRef {
  return {
    points: [new Vector3(1, 2, 3)],
    lyapunovExponent: 0.91,
    poincarePoints: [[1, 2]],
  };
}

describe('systemRef', () => {
  afterEach(() => {
    systemRef.system = null;
    systemRef.type = null;
  });

  it('starts with null system and type', () => {
    expect(systemRef.system).toBeNull();
    expect(systemRef.type).toBeNull();
  });

  it('setActiveSystem sets system and type', () => {
    const mock = createMockSystem();
    setActiveSystem(mock, 'lorenz');
    expect(systemRef.system).toBe(mock);
    expect(systemRef.type).toBe('lorenz');
  });

  it('clearActiveSystem clears only if same instance', () => {
    const mock1 = createMockSystem();
    const mock2 = createMockSystem();

    setActiveSystem(mock1, 'lorenz');
    clearActiveSystem(mock2); // Different instance — should NOT clear
    expect(systemRef.system).toBe(mock1);

    clearActiveSystem(mock1); // Same instance — should clear
    expect(systemRef.system).toBeNull();
    expect(systemRef.type).toBeNull();
  });

  it('can switch between system types', () => {
    const lorenz = createMockSystem();
    const rossler = createMockSystem();

    setActiveSystem(lorenz, 'lorenz');
    expect(systemRef.type).toBe('lorenz');

    setActiveSystem(rossler, 'rossler');
    expect(systemRef.type).toBe('rossler');
    expect(systemRef.system).toBe(rossler);
  });
});
