// dark-mode-only ambient glow layer — see the .aurora-bg/.aurora-blob-* rules in
// globals.css for the actual colors/motion. Renders inert (opacity 0) in light mode.
export default function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      <span className="aurora-blob aurora-blob-a" />
      <span className="aurora-blob aurora-blob-b" />
      <span className="aurora-blob aurora-blob-c" />
    </div>
  );
}
