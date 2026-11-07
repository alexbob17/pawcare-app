import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';

export const Icon = ({ name, size = 20, color = '#1D3348', strokeWidth = 1.8, style }) => {
  const props = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M3 11.5 12 4l9 7.5" {...props} />
          <Path d="M5.5 10v10h13V10M9 20v-6h6v6" {...props} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Rect x="3" y="5" width="18" height="16" rx="3" {...props} />
          <Path d="M8 3v4m8-4v4M3 10h18m-13 4h2m4 0h2m-8 3h2" {...props} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Circle cx="12" cy="8" r="4" {...props} />
          <Path d="M4.5 21c.6-4.1 3.1-6 7.5-6s6.9 1.9 7.5 6" {...props} />
        </Svg>
      );
    case 'syringe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="m14 5 5 5M16.5 2.5l5 5M5 18l-2 3m6-7 1.5 1.5L7 19H4v-3l7.5-7.5L15 12" {...props} />
        </Svg>
      );
    case 'pill':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M8.2 19.8a5 5 0 0 1-7-7l8.6-8.6a5 5 0 0 1 7 7Z" {...props} />
          <Path d="m6 8 7 7" {...props} />
        </Svg>
      );
    case 'stethoscope':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M5 3v5a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 10v2a5 5 0 0 0 10 0v-1" {...props} />
          <Circle cx="20" cy="11" r="2" {...props} />
        </Svg>
      );
    case 'scale':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M5 5h14l2 16H3Z" {...props} />
          <Path d="M9 10a3 3 0 0 1 6 0m-3-3v3" {...props} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" {...props} />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M5 12h14m-5-5 5 5-5 5" {...props} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M12 5v14M5 12h14" {...props} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M20.8 5.8c-2-2.3-5.4-2.4-7.5-.3L12 6.8l-1.3-1.3a5.1 5.1 0 0 0-7.5.3c-1.8 2.3-1.5 5.6.6 7.6L12 21l8.2-7.6c2.1-2 2.4-5.3.6-7.6Z" {...props} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M12 2 4.5 5v6c0 5 3 8.7 7.5 11 4.5-2.3 7.5-6 7.5-11V5Z" {...props} />
          <Path d="m8.5 12 2.2 2.2 4.8-5" {...props} />
        </Svg>
      );
    case 'paw':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Ellipse cx="12" cy="16" rx="5" ry="4" {...props} />
          <Circle cx="6.5" cy="10" r="2" {...props} />
          <Circle cx="10.5" cy="6.5" r="2" {...props} />
          <Circle cx="15.5" cy="7" r="2" {...props} />
          <Circle cx="18" cy="11" r="2" {...props} />
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" {...props} />
          <Circle cx="12" cy="12" r="2.5" {...props} />
        </Svg>
      );
    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Rect x="2.5" y="5" width="19" height="14" rx="3" {...props} />
          <Path d="m4 7 8 6 8-6" {...props} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Rect x="4" y="10" width="16" height="11" rx="3" {...props} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" {...props} />
        </Svg>
      );
    case 'compass':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
          <Circle cx="12" cy="12" r="9" {...props} />
          <Path d="m15.5 8.5-2.2 5.8-5.8 2.2 2.2-5.8 5.8-2.2Z" {...props} />
        </Svg>
      );
    default:
      return null;
  }
};

export const GoogleSvgIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
    <Path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4 4 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.8 2.7-6.5Z" />
    <Path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2L12 13.5c-.8.6-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1.1V13A9 9 0 0 0 9 18Z" />
    <Path fill="#FBBC05" d="M4 10.7A5.4 5.4 0 0 1 4 7.3V5H1.1A9 9 0 0 0 1.1 13Z" />
    <Path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.5 1.4L15 2.5A8.4 8.4 0 0 0 9 0a9 9 0 0 0-7.9 5L4 7.3c.7-2.1 2.7-3.7 5-3.7Z" />
  </Svg>
);

export default Icon;
