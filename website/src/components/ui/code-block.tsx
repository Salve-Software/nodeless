import { highlight } from './highlight';
import './code-block.css';

export function CodeBlock({ code, file }: { code: string; file?: string }) {
  return (
    <div className="code">
      {file && (
        <div className="code__bar">
          <span className="code__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="code__file">{file}</span>
        </div>
      )}
      <pre className="code__body">
        <code>
          {highlight(code).map((token, index) => (
            <span key={index} className={`tok tok--${token.kind}`}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
