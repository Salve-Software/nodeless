import { useLayoutEffect, useRef } from 'react';
import { highlight } from '@/components/ui/highlight';
import './editor.css';

/**
 * A textarea over a highlighted copy of the same text. It keeps the native caret, native
 * undo and native selection, which is most of what an editor has to get right.
 */
export function Editor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const view = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    if (view.current && input.current) view.current.scrollTop = input.current.scrollTop;
  }, [value]);

  return (
    <div className="editor">
      <pre className="editor__view" ref={view} aria-hidden="true">
        <code>
          {highlight(value).map((token, index) => (
            <span key={index} className={`tok tok--${token.kind}`}>
              {token.text}
            </span>
          ))}
          {'\n'}
        </code>
      </pre>

      <textarea
        className="editor__input"
        ref={input}
        value={value}
        spellCheck={false}
        wrap="off"
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (!view.current) return;
          view.current.scrollTop = event.currentTarget.scrollTop;
          view.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();

          const area = event.currentTarget;
          const at = area.selectionStart;

          onChange(`${value.slice(0, at)}  ${value.slice(area.selectionEnd)}`);
          requestAnimationFrame(() => area.setSelectionRange(at + 2, at + 2));
        }}
      />
    </div>
  );
}
