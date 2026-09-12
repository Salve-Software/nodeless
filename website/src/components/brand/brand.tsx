import './brand.css';

/** Two nodes and the edge that never connects them — the two graphs, at 28 pixels. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect className="brand__plate" width="32" height="32" rx="8" />
        <path className="brand__edge" d="M9 22.5 20 9" />
        <circle className="brand__node brand__node--a" cx="9" cy="9" r="2.8" />
        <circle className="brand__node brand__node--b" cx="23" cy="23" r="2.8" />
      </svg>
      {!compact && <span className="brand__word">nodeless</span>}
    </span>
  );
}
