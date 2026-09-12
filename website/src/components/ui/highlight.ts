const PATTERNS: [string, RegExp][] = [
  ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
  ['string', /`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/y],
  [
    'keyword',
    /\b(?:import|export|from|const|let|var|function|return|async|await|if|else|new|default|class|extends|typeof|as|of|for|while|try|catch|throw)\b/y,
  ],
  ['literal', /\b(?:true|false|null|undefined|this)\b/y],
  ['number', /\b\d+(?:\.\d+)?\b/y],
  ['call', /\b[A-Za-z_$][\w$]*(?=\()/y],
  ['type', /\b[A-Z][\w$]*\b/y],
  ['punct', /[{}()[\];,.:?=<>+\-*/&|!]+/y],
  ['plain', /\s+|[^\s]/y],
];

export interface Token {
  kind: string;
  text: string;
}

/**
 * A regex tokeniser, not a parser. It is enough for the snippets on this page and it keeps the
 * site at zero runtime dependencies, which is the same bet the library makes.
 */
export function highlight(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    let matched = false;

    for (const [kind, pattern] of PATTERNS) {
      pattern.lastIndex = index;

      const found = pattern.exec(source);

      if (!found) continue;

      const last = tokens[tokens.length - 1];

      if (last?.kind === kind) last.text += found[0];
      else tokens.push({ kind, text: found[0] });

      index += found[0].length;
      matched = true;
      break;
    }

    if (!matched) index += 1;
  }

  return tokens;
}
