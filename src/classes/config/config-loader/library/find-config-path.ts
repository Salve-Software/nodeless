import type { Vfs } from '@/types/index.js';
import { CONFIG_CANDIDATES } from '@/classes/config/config-loader/constants/index.js';

export function findConfigPath(vfs: Vfs): string | undefined {
  return CONFIG_CANDIDATES.find((candidate) => vfs.exists(candidate));
}
