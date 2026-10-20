// Green pill with the lesson a mistake belongs to (MASTER.md "Rule Tag").
// `title` is the lesson title from data/lessons.json; a mistake tagged
// "other", or with an id that has no lesson, shows "Other".
export default function RuleTag({ title }: { title?: string }) {
  return (
    <span className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-tag-bg px-3 py-1 text-base leading-snug font-bold text-tag-text">
      {title ?? "Other"}
    </span>
  );
}
