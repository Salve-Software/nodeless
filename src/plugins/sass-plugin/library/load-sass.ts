import type { SassApi } from '@/plugins/sass-plugin/types/index.js';
import { loadPeer } from '@/plugins/load-peer.js';
import { SASS_PACKAGE } from '@/plugins/sass-plugin/constants/index.js';

export async function loadSass(): Promise<SassApi> {
  return (await loadPeer(SASS_PACKAGE, 'This project uses Sass.')) as SassApi;
}
