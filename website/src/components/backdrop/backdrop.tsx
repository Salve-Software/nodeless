import './backdrop.css';

/** Three drifting light sources over a hairline grid. Pure CSS, no canvas, no work per frame. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__grid" />
      <div className="backdrop__glow backdrop__glow--a" />
      <div className="backdrop__glow backdrop__glow--b" />
      <div className="backdrop__glow backdrop__glow--c" />
      <div className="backdrop__fade" />
    </div>
  );
}
