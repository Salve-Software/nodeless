import type { TailwindApi } from '@/plugins/tailwind-plugin/types/index.js';
import { loadPeer } from '@/plugins/load-peer.js';
import { TAILWIND_PACKAGE } from '@/plugins/tailwind-plugin/constants/index.js';

export async function loadTailwind(): Promise<TailwindApi> {
  return (await loadPeer(TAILWIND_PACKAGE, 'This project uses Tailwind.')) as TailwindApi;
}
