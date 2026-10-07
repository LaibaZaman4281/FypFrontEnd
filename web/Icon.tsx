import React from 'react';

export default function Icon({ name, size = 16, color, style }: any) {
  const s: React.CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    color: color || 'currentColor',
    lineHeight: 1,
    ...style,
  };
  return <span aria-hidden style={s}>■</span>;
}
