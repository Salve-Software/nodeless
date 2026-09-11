import type { Message } from 'esbuild-wasm';
import { describe, expect, it } from 'vitest';
import { toBuildMessage } from '@/classes/bundler/esbuild-bundler/library/index.js';

function message(overrides: Partial<Message>): Message {
  return {
    id: '',
    pluginName: '',
    text: 'Expected ";"',
    location: null,
    notes: [],
    detail: undefined,
    ...overrides,
  };
}

describe('toBuildMessage', () => {
  it('flattens the esbuild location into file, line and column', () => {
    expect(
      toBuildMessage(
        message({
          location: {
            file: 'vfs:/src/App.tsx',
            namespace: '',
            line: 12,
            column: 4,
            length: 1,
            lineText: 'const x = ',
            suggestion: '',
          },
        }),
      ),
    ).toEqual({
      text: 'Expected ";"',
      file: 'vfs:/src/App.tsx',
      line: 12,
      column: 4,
      lineText: 'const x = ',
    });
  });

  it('a message without a location comes out as text alone', () => {
    expect(toBuildMessage(message({}))).toEqual({ text: 'Expected ";"' });
  });

  it('notes become a list of strings', () => {
    expect(
      toBuildMessage(message({ notes: [{ text: 'try this', location: null }] })),
    ).toEqual({ text: 'Expected ";"', notes: ['try this'] });
  });
});
