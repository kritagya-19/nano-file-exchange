export function BrushUnderline({ className = "", wide = false }) {
  const widthClass = wide ? "w-[min(100%,11rem)]" : "w-[min(100%,7rem)]";
  return (
    <svg
      className={`pointer-events-none absolute left-0 right-0 -bottom-1 mx-auto h-3 text-brand ${widthClass} ${className}`}
      viewBox="0 0 120 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 8c18-4 36-5 54-4.5 18 .5 36 2 58 5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M2 9.5c22-5 44-7 66-6 20 1 40 3 50 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
