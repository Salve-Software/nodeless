/** A tsconfig is JSONC. Comments and trailing commas are normal there and break JSON.parse. */
export function stripJsonComments(text: string): string {
  let out = '';
  let index = 0;
  let inString = false;

  while (index < text.length) {
    const char = text[index] ?? '';
    const next = text[index + 1] ?? '';

    if (inString) {
      out += char;
      if (char === '\\') {
        out += next;
        index += 2;
        continue;
      }
      if (char === '"') inString = false;
      index += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < text.length && text[index] !== '\n') index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/'))
        index += 1;
      index += 2;
      continue;
    }

    // Done here rather than with a regex over the result, which would also eat a
    // comma that happens to sit inside a string.
    if (char === '}' || char === ']') out = out.replace(/,\s*$/, '');

    out += char;
    index += 1;
  }

  return out;
}
