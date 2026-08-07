import { useMemo } from "react";

/**
 * Subtle animated floating dots overlay used behind the sidebar logo.
 * Purely decorative — kept very low-opacity so it stays "barely there".
 */
export function LogoDots({ count = 14 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const size = 2 + Math.random() * 4;
        return {
          left: Math.random() * 100,
          top: Math.random() * 100,
          size,
          delay: Math.random() * 6,
          duration: 6 + Math.random() * 6,
          opacity: 0.15 + Math.random() * 0.35,
        };
      }),
    [count]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        @keyframes logo-dot-float {
          0%   { transform: translate3d(0,0,0) scale(1); opacity: var(--dot-o, 0.3); }
          50%  { transform: translate3d(0,-8px,0) scale(1.15); opacity: calc(var(--dot-o, 0.3) * 1.4); }
          100% { transform: translate3d(0,0,0) scale(1); opacity: var(--dot-o, 0.3); }
        }
      `}</style>
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.opacity,
            ["--dot-o" as string]: d.opacity,
            animation: `logo-dot-float ${d.duration}s ease-in-out ${d.delay}s infinite`,
            filter: "blur(0.3px)",
          }}
        />
      ))}
    </div>
  );
}
