import { describe, expect, it } from 'vitest';
import { collectCandidates } from '@/classes/css-transform/tailwind-transform/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

describe('collectCandidates', () => {
  it('pulls class-shaped tokens out of the sources', () => {
    const vfs = new MemoryVfs({
      files: { '/src/App.tsx': '<h1 className="flex gap-4 md:px-8">hi</h1>' },
    });

    expect(collectCandidates(vfs)).toEqual(
      expect.arrayContaining(['flex', 'gap-4', 'md:px-8']),
    );
  });

  // Scanning it would be slow and Tailwind never looks there either.
  it('skips node_modules', () => {
    const vfs = new MemoryVfs({
      files: { '/node_modules/p/index.js': 'const a = "from-a-package";' },
    });

    expect(collectCandidates(vfs)).not.toContain('from-a-package');
  });

  it('skips files that cannot hold a class name', () => {
    const vfs = new MemoryVfs({ files: { '/src/data.json': '{"a":"not-a-class"}' } });

    expect(collectCandidates(vfs)).toEqual([]);
  });

  it('reads html as well as tsx', () => {
    const vfs = new MemoryVfs({ files: { '/index.html': '<div class="grid"></div>' } });

    expect(collectCandidates(vfs)).toContain('grid');
  });

  it('does not repeat a token used twice', () => {
    const vfs = new MemoryVfs({
      files: { '/src/a.tsx': 'flex flex', '/src/b.tsx': 'flex' },
    });

    expect(collectCandidates(vfs).filter((c) => c === 'flex')).toHaveLength(1);
  });
});
