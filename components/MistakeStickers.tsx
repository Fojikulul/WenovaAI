import type { CSSProperties } from "react";

// Common learner mistakes and their fixes, shown as tilted stickers around
// the hero (like the reference design's crossed-out words). Each one has its
// own place, tilt, and point in the float, so they don't move in step. The
// delays are negative: each sticker starts partway through its float, so it
// is already tilted and moving on the first frame instead of starting flat.
const STICKERS = [
  { wrong: "I goed", right: "I went", place: "left-[4%] top-6", tilt: "-6deg", delay: "0s" },
  { wrong: "a apple", right: "an apple", place: "right-[4%] top-12", tilt: "5deg", delay: "-1.5s" },
  { wrong: "She go", right: "She goes", place: "left-[9%] bottom-2", tilt: "4deg", delay: "-3s" },
  { wrong: "in Monday", right: "on Monday", place: "right-[8%] bottom-0", tilt: "-4deg", delay: "-4.5s" },
];

// Decoration only: screen readers skip it. Shown from 1280px up, where there
// is room beside the headline; on smaller screens it would cover the text.
export default function MistakeStickers() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
      {STICKERS.map((sticker) => (
        // Outer span: place and fade-in with the hero. Inner span: tilt and
        // float. They are separate because both animations move the element.
        <span key={sticker.wrong} className={`absolute ${sticker.place} animate-fade-up`}>
          <span
            // The tilt is also set without the animation, so it is there even
            // with "reduce motion" on.
            style={
              {
                "--tilt": sticker.tilt,
                transform: `rotate(${sticker.tilt})`,
                animationDelay: sticker.delay,
              } as CSSProperties
            }
            className="inline-flex animate-float items-center gap-2 rounded-lg border border-divider bg-background px-3 py-1.5 text-base shadow-sm"
          >
            <s className="text-muted decoration-mistake-line decoration-2">{sticker.wrong}</s>
            <span className="text-muted">→</span>
            <span className="font-bold text-correct-text">{sticker.right}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
