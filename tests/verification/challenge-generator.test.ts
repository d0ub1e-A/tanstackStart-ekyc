import { describe, it, expect } from 'vitest';
import { createLivenessSession, getCurrentChallenge } from '../../src/lib/verification/face/liveness';

describe('liveness challenge generator', () => {
  it('should create session with all three challenge types', () => {
    const session = createLivenessSession();
    expect(session.challenges).toHaveLength(3);
    expect(session.challenges).toContain('TURN_LEFT');
    expect(session.challenges).toContain('TURN_RIGHT');
    expect(session.challenges).toContain('BLINK');
  });

  it('should randomize challenge order', () => {
    const orders = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const session = createLivenessSession();
      orders.add(session.challenges.join(','));
    }
    // With 3! = 6 possible permutations, we should see multiple orders
    expect(orders.size).toBeGreaterThan(1);
  });

  it('should start at index 0', () => {
    const session = createLivenessSession();
    expect(session.currentIndex).toBe(0);
  });

  it('should return current challenge', () => {
    const session = createLivenessSession();
    const challenge = getCurrentChallenge(session);
    expect(['TURN_LEFT', 'TURN_RIGHT', 'BLINK']).toContain(challenge);
  });

  it('should return null when all challenges completed', () => {
    const session = createLivenessSession();
    session.currentIndex = 3;
    expect(getCurrentChallenge(session)).toBeNull();
  });

  it('should not have duplicate challenges', () => {
    const session = createLivenessSession();
    const unique = new Set(session.challenges);
    expect(unique.size).toBe(3);
  });
});