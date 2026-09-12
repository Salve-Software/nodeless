import './brand.css';

/** The graph drawn as eight dashes: it is a ring that never closes, because nothing in it runs. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="brand__ring" cx="50" cy="50" r="30" />
      </svg>
      {!compact && <span className="brand__word">nodeless</span>}
    </span>
  );
}
