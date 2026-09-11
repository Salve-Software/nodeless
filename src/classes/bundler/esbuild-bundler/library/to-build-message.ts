import type { BuildMessage } from '@/types/index.js';
import type { Message } from 'esbuild-wasm';

export function toBuildMessage(message: Message): BuildMessage {
  const { location } = message;

  return {
    text: message.text,
    ...(location
      ? {
          file: location.file,
          line: location.line,
          column: location.column,
          lineText: location.lineText,
        }
      : {}),
    ...(message.notes.length > 0
      ? { notes: message.notes.map((note) => note.text) }
      : {}),
  };
}
