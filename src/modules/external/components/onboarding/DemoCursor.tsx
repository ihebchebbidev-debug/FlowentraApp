import { motion } from 'framer-motion';

interface DemoCursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}

export function DemoCursor({ x, y, clicking, visible = true }: DemoCursorProps) {
  if (!visible) return null;
  return (
    <motion.div
      className="pointer-events-none absolute z-[60]"
      animate={{ x, y }}
      transition={{ type: 'tween', duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
      style={{ left: 0, top: 0 }}
    >
      <div className="relative">
        <svg width="28" height="28" viewBox="0 0 28 28" className="drop-shadow-md">
          <path
            d="M4 2 L4 22 L10 17 L13 24 L17 22 L14 15 L22 14 Z"
            fill="hsl(var(--background))"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        {clicking && (
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-2 -left-2 h-8 w-8 rounded-full border-2 border-primary"
          />
        )}
      </div>
    </motion.div>
  );
}
