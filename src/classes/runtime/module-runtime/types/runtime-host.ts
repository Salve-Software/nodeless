import type { RuntimeModule } from '@/types/index.js';

/** The one free variable the evaluated bundle sees. Everything reaches the host through it. */
export interface RuntimeHost {
  shim(name: string): RuntimeModule;
  require(specifier: string, importer: string): RuntimeModule;
}
