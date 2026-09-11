import type { SassApi, SassTransformOptions } from './types/index.js';
import type { SourceTransform, TransformInput, TransformResult } from '@/types/index.js';
import { loadPeer } from '@/classes/transform/library/index.js';
import { extname } from '@/library/index.js';
import { SASS_EXTENSIONS, SASS_PACKAGE, VFS_SCHEME } from './constants/index.js';
import { createVfsImporter } from './library/index.js';

/** Compiles `.scss` and `.sass` to CSS. The same shape as every other transform. */
export class SassTransform implements SourceTransform {
  readonly name = 'sass';
  readonly stage = 'language' as const;
  private readonly sass: SassApi | undefined;

  constructor({ sass }: SassTransformOptions = {}) {
    this.sass = sass;
  }

  matches({ path }: { path: string; content: string }): boolean {
    return SASS_EXTENSIONS.has(extname(path));
  }

  async apply(file: TransformInput): Promise<TransformResult> {
    const sass = this.sass ?? (await this.load());
    const importer = createVfsImporter(file);
    const { css } = sass.compileString(file.content, {
      syntax: extname(file.path) === '.sass' ? 'indented' : 'scss',
      url: new URL(`${VFS_SCHEME}${file.path}`),
      importer,
      importers: [importer],
    });

    return { content: css, loader: 'css' };
  }

  private async load(): Promise<SassApi> {
    return (await loadPeer(SASS_PACKAGE, 'This project uses Sass.')) as SassApi;
  }
}
