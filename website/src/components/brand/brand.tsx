import './brand.css';

/** Two blocks in opposite corners: the toolchain and the app, never touching. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect
          className="brand__block brand__block--a"
          x="2.5"
          y="2.5"
          width="13"
          height="13"
          rx="3"
        />
        <rect
          className="brand__block brand__block--b"
          x="16.5"
          y="16.5"
          width="13"
          height="13"
          rx="3"
        />
      </svg>
      {!compact && <span className="brand__word">nodeless</span>}
    </span>
  );
}
