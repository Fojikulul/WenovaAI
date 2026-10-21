// Behind a page's hero, across the full width of the screen: a faint grid and
// a soft glow, mostly the logo's green with a little blue (like the reference
// design). Decoration only. Put it first inside a `relative isolate` hero.
// It reaches down behind the top of the content under the hero, and the mask
// fades it out toward the bottom and sides, so there is never a hard edge.
export default function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[calc(100%+8rem)] w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
    >
      <div className="hero-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black_25%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 size-[22rem] -translate-x-1/2 rounded-full bg-logo-green/20 blur-3xl md:size-[38rem]" />
      <div className="absolute -top-24 left-[8%] size-56 rounded-full bg-primary/10 blur-3xl md:size-96" />
    </div>
  );
}
