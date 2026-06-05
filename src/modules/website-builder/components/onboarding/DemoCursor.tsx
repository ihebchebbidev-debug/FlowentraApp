/** Animated virtual cursor for the autopilot demo. */
interface DemoCursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}

export function DemoCursor({ x, y, clicking = false, visible = true }: DemoCursorProps) {
  return (
    <div
      className="pointer-events-none fixed z-[120] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ left: x, top: y, opacity: visible ? 1 : 0, transform: `translate(-4px, -2px) scale(${clicking ? 0.85 : 1})` }}
    >
      {/* Click ripple */}
      {clicking && (
        <span className="absolute -left-3 -top-3 h-9 w-9 rounded-full bg-primary/30 animate-ping" />
      )}
      <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-lg">
        <path d="M5 3l14 7-6 2-2 6-6-15z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
