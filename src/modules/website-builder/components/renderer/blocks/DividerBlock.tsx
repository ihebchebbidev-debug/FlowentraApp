import React from 'react';

interface DividerBlockProps {
  style?: React.CSSProperties;
  color?: string;
  thickness?: number;
  bgColor?: string;
}

export function DividerBlock({ style: customStyle, color = '#e2e8f0', thickness = 1, bgColor }: DividerBlockProps) {
  return (
    <div className="py-4 px-6" style={{ backgroundColor: bgColor || 'transparent', ...customStyle }}>
      <hr style={{ borderColor: color, borderWidth: thickness }} />
    </div>
  );
}
