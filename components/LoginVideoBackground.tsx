// ambient background video — deliberately not paused under prefers-reduced-motion:
// it's a muted, non-parallax, purely decorative loop (same reasoning already applied
// to the About section's card marquee), and it's meant to run continuously for as
// long as this page is open, not play once and stop.
export default function LoginVideoBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-night">
      <video autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 h-full w-full object-cover">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      {/* scrim for text contrast — kept moderate (not too dark) so the card's own glass
          effect still has real video brightness/color behind it to blur and show through */}
      <div className="absolute inset-0 bg-night/45" />
    </div>
  );
}
