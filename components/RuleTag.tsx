export default function RuleTag({ title }: { title?: string }) {
  return (
    <span className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-tag-bg px-3 py-1 text-base leading-snug font-bold text-tag-text">
      {title ?? "Other"}
    </span>
  );
}
