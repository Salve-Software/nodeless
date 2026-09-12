import type { EventListener } from './types/index.js';

/** The `events` surface a build tool touches. No domains, no captureRejections. */
export class NodelessEventEmitter {
  private readonly handlers = new Map<string, EventListener[]>();

  on(event: string, listener: EventListener): this {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), listener]);

    return this;
  }

  addEventListener(event: string, listener: EventListener): this {
    return this.on(event, listener);
  }

  once(event: string, listener: EventListener): this {
    const wrapped = (...args: unknown[]): void => {
      this.off(event, wrapped);
      listener(...args);
    };

    return this.on(event, wrapped);
  }

  off(event: string, listener: EventListener): this {
    const current = this.handlers.get(event) ?? [];

    this.handlers.set(
      event,
      current.filter((candidate) => candidate !== listener),
    );

    return this;
  }

  removeEventListener(event: string, listener: EventListener): this {
    return this.off(event, listener);
  }

  removeAllEventListeners(event?: string): this {
    if (event === undefined) this.handlers.clear();
    else this.handlers.delete(event);

    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const current = this.handlers.get(event) ?? [];

    for (const listener of [...current]) listener(...args);

    return current.length > 0;
  }

  listeners(event: string): EventListener[] {
    return [...(this.handlers.get(event) ?? [])];
  }

  listenerCount(event: string): number {
    return (this.handlers.get(event) ?? []).length;
  }

  eventNames(): string[] {
    return [...this.handlers.keys()];
  }

  setMaxEventListeners(): this {
    return this;
  }
}
