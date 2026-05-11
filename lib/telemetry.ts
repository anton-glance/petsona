import type { EventName } from './events';

export function track(_event: EventName, _properties?: Record<string, unknown>): void {
  throw new Error('track not implemented');
}

export function captureException(_error: unknown, _context?: Record<string, unknown>): void {
  throw new Error('captureException not implemented');
}

export function identify(_userId: string, _traits?: Record<string, unknown>): void {
  throw new Error('identify not implemented');
}
