import React from 'react';

interface SpacerBlockProps {
  height?: number;
  style?: React.CSSProperties;
}

export function SpacerBlock({ height = 48, style }: SpacerBlockProps) {
  return <div style={{ height, ...style }} />;
}
