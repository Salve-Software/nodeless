import { Fragment } from 'react';
import './rich-text.css';

/** Renders the `backticks` the copy is written with as inline code, and nothing else. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, index) =>
        index % 2 === 1 ? (
          <code className="rich" key={index}>
            {part}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
