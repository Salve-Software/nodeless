import { useCountUp } from '@/hooks/use-count-up';
import './build-card.css';

const INPUT = [
  { name: 'package.json', kind: 'json' },
  { name: 'vite.config.ts', kind: 'config' },
  { name: 'src/main.tsx', kind: 'tsx' },
  { name: 'src/App.tsx', kind: 'tsx' },
  { name: 'src/app.css', kind: 'css' },
];

const OUTPUT = [
  { name: 'index.html', size: '0.3 kB' },
  { name: 'bundle.js', size: '219.0 kB' },
  { name: 'bundle.css', size: '0.3 kB' },
];

/** The whole library in one frame: files in, a dist out, and the number that makes it useful. */
export function BuildCard() {
  const ms = useCountUp(198);

  return (
    <div className="card">
      <div className="card__chrome">
        <span className="card__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="card__title">nodeless</span>
        <span className="card__badge">
          <i className="card__pip" />
          in memory
        </span>
      </div>

      <div className="card__body">
        <section className="card__side">
          <h3 className="card__label">files in</h3>
          <ul className="card__list">
            {INPUT.map((file, index) => (
              <li key={file.name} style={{ '--i': index } as React.CSSProperties}>
                <span className={`card__chip card__chip--${file.kind}`} />
                {file.name}
              </li>
            ))}
          </ul>
        </section>

        <div className="card__flow" aria-hidden="true">
          <span className="card__beam" />
          <span className="card__spark" />
        </div>

        <section className="card__side card__side--out">
          <h3 className="card__label">dist out</h3>
          <ul className="card__list">
            {OUTPUT.map((file, index) => (
              <li key={file.name} style={{ '--i': index + 5 } as React.CSSProperties}>
                <span className="card__chip card__chip--out" />
                {file.name}
                <em>{file.size}</em>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="card__foot">
        <span className="card__meter">
          <span className="card__fill" />
        </span>
        <span className="card__time">
          built in <strong>{ms}</strong> ms
        </span>
      </div>
    </div>
  );
}
