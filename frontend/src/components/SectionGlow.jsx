export function SectionGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
      <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet-400/12 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/20 blur-3xl" />
    </div>
  );
}
