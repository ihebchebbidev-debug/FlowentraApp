import { useRef, useState, useEffect, useMemo } from 'react';
import type { AnimationSettings, TransitionSpeed } from '../types';

const SPEED_MAP: Record<TransitionSpeed, number> = {
  slow: 800,
  normal: 400,
  fast: 200,
};

/**
 * Generates inline CSS for entrance + hover animations.
 * Uses IntersectionObserver to trigger entrance when the element scrolls into view.
 *
 * NOTE: Hover styles are returned as inline CSS (not Tailwind classes) because
 * Tailwind cannot detect dynamic class names like `duration-[${ms}ms]`.
 */
export function useAnimationObserver(animation?: AnimationSettings) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasTriggered = useRef(false);

  const entrance = animation?.entrance ?? 'none';
  const hover = animation?.hover ?? 'none';
  const speed = animation?.speed ?? 'normal';
  const delay = animation?.delay ?? 0;
  const repeat = animation?.repeat ?? false;

  useEffect(() => {
    if (entrance === 'none') {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasTriggered.current || repeat) {
            setTimeout(() => setIsVisible(true), delay);
            hasTriggered.current = true;
          }
          if (!repeat) observer.unobserve(el);
        } else if (repeat) {
          setIsVisible(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [entrance, delay, repeat]);

  // Attach hover listeners for hover effects
  useEffect(() => {
    if (hover === 'none') return;
    const el = ref.current;
    if (!el) return;

    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [hover]);

  const durationMs = SPEED_MAP[speed];

  // Build combined inline style (entrance + hover)
  const style = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {};

    // Entrance animation
    if (entrance !== 'none') {
      const entranceFrom = getEntranceFrom(entrance);
      const entranceTo = getEntranceTo(entrance);
      Object.assign(base, isVisible ? entranceTo : entranceFrom);
      base.transition = `opacity ${durationMs}ms ease-out, transform ${durationMs}ms ease-out`;
    }

    // Hover effect (applied as inline style, not Tailwind)
    if (hover !== 'none' && isHovered) {
      const hoverStyle = getHoverStyle(hover);
      // Merge hover transform with entrance transform
      if (hoverStyle.transform && base.transform) {
        base.transform = `${base.transform} ${hoverStyle.transform}`;
        delete hoverStyle.transform;
      }
      Object.assign(base, hoverStyle);
      // Ensure transition covers hover properties too
      base.transition = `all ${durationMs}ms ease-out`;
    } else if (hover !== 'none' && !isHovered) {
      // Ensure smooth transition back from hover
      base.transition = `all ${durationMs}ms ease-out`;
    }

    return base;
  }, [entrance, hover, speed, durationMs, isVisible, isHovered]);

  return { ref, style, isVisible };
}

function getEntranceFrom(entrance: string): React.CSSProperties {
  switch (entrance) {
    case 'fade-in':
      return { opacity: 0 };
    case 'slide-up':
      return { opacity: 0, transform: 'translateY(40px)' };
    case 'slide-down':
      return { opacity: 0, transform: 'translateY(-40px)' };
    case 'slide-left':
      return { opacity: 0, transform: 'translateX(40px)' };
    case 'slide-right':
      return { opacity: 0, transform: 'translateX(-40px)' };
    case 'zoom-in':
      return { opacity: 0, transform: 'scale(0.85)' };
    case 'zoom-out':
      return { opacity: 0, transform: 'scale(1.15)' };
    case 'flip':
      return { opacity: 0, transform: 'perspective(600px) rotateX(15deg)' };
    case 'bounce':
      return { opacity: 0, transform: 'translateY(30px)' };
    default:
      return {};
  }
}

function getEntranceTo(entrance: string): React.CSSProperties {
  switch (entrance) {
    case 'fade-in':
      return { opacity: 1 };
    case 'slide-up':
    case 'slide-down':
    case 'slide-left':
    case 'slide-right':
      return { opacity: 1, transform: 'translate(0, 0)' };
    case 'zoom-in':
    case 'zoom-out':
      return { opacity: 1, transform: 'scale(1)' };
    case 'flip':
      return { opacity: 1, transform: 'perspective(600px) rotateX(0)' };
    case 'bounce':
      return { opacity: 1, transform: 'translateY(0)' };
    default:
      return {};
  }
}

/** Returns inline styles for hover effect (no Tailwind needed) */
function getHoverStyle(hover: string): React.CSSProperties {
  switch (hover) {
    case 'lift':
      return { transform: 'translateY(-4px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)' };
    case 'scale':
      return { transform: 'scale(1.03)' };
    case 'glow':
      return { boxShadow: '0 0 20px rgba(59,130,246,0.35)' };
    case 'border-pop':
      return { outline: '2px solid rgba(59,130,246,0.4)', outlineOffset: '2px' };
    case 'tilt':
      return { transform: 'perspective(500px) rotateY(3deg)' };
    case 'darken':
      return { filter: 'brightness(0.9)' };
    case 'lighten':
      return { filter: 'brightness(1.1)' };
    default:
      return {};
  }
}
