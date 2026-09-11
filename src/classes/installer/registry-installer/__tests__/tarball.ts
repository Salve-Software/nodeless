import { gzipSync } from 'fflate';
import { textToBytes } from '@/library/index.js';

const BLOCK = 512;

interface TarEntry {
  name: string;
  body?: string;
  typeFlag?: string;
  prefix?: string;
}

/** Builds a ustar archive by hand, so the parser is tested without touching the network. */
export function buildTar(entries: TarEntry[]): Uint8Array {
  const blocks: Uint8Array[] = [];

  for (const entry of entries) {
    const body = textToBytes(entry.body ?? '');

    blocks.push(header(entry, body.length));

    for (let offset = 0; offset < body.length; offset += BLOCK) {
      const block = new Uint8Array(BLOCK);

      block.set(body.subarray(offset, offset + BLOCK));
      blocks.push(block);
    }
  }

  blocks.push(new Uint8Array(BLOCK), new Uint8Array(BLOCK));

  return concat(blocks);
}

export function buildTarball(entries: TarEntry[]): Uint8Array {
  return gzipSync(buildTar(entries));
}

function header(entry: TarEntry, size: number): Uint8Array {
  const block = new Uint8Array(BLOCK);

  block.set(textToBytes(entry.name).subarray(0, 100), 0);
  block.set(textToBytes(size.toString(8).padStart(11, '0')), 124);
  block.set(textToBytes(entry.typeFlag ?? '0'), 156);
  block.set(textToBytes('ustar\0' + '00'), 257);
  if (entry.prefix) block.set(textToBytes(entry.prefix).subarray(0, 155), 345);

  return block;
}

function concat(blocks: Uint8Array[]): Uint8Array {
  const total = blocks.reduce((sum, block) => sum + block.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const block of blocks) {
    out.set(block, offset);
    offset += block.length;
  }

  return out;
}
