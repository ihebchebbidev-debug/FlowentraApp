/**
 * Animation configuration types and defaults.
 */

export type EntranceAnimation = 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'flip' | 'bounce';
export type HoverEffect = 'none' | 'lift' | 'scale' | 'glow' | 'border-pop' | 'tilt' | 'darken' | 'lighten';
export type TransitionSpeed = 'slow' | 'normal' | 'fast';

export interface AnimationSettings {
  entrance: EntranceAnimation;
  hover: HoverEffect;
  speed: TransitionSpeed;
  delay: number;
  stagger: number;
  repeat: boolean;
}

export const DEFAULT_ANIMATION: AnimationSettings = {
  entrance: 'none',
  hover: 'none',
  speed: 'normal',
  delay: 0,
  stagger: 0,
  repeat: false,
};
