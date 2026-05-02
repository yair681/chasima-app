import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

const C = { blue: '#3B82F6', blueDeep: '#2563EB', green: '#22C55E', red: '#EF4444' };

export default function MascotBot({ size = 48, mood = 'happy' }) {
  const eyeY = mood === 'sleepy' ? 24 : 22;
  const eyeH = mood === 'sleepy' ? 2 : 5;
  const mouthD = mood === 'happy'
    ? 'M22 36 Q30 42 38 36'
    : mood === 'cheer' ? 'M22 34 Q30 44 38 34'
    : 'M22 38 L38 38';

  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Line x1="30" y1="6" x2="30" y2="12" stroke={C.blueDeep} strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="30" cy="5" r="2.5" fill={C.green}/>
      <Rect x="10" y="12" width="40" height="34" rx="10" fill={C.blue}/>
      <Rect x="10" y="12" width="40" height="14" rx="10" fill={C.blueDeep} opacity="0.25"/>
      <Rect x="15" y="18" width="30" height="22" rx="6" fill="#0B1F4A"/>
      <Rect x={20} y={eyeY} width="5" height={eyeH} rx="2" fill="#7DD3FC"/>
      <Rect x={35} y={eyeY} width="5" height={eyeH} rx="2" fill="#7DD3FC"/>
      {mood !== 'sleepy' && <>
        <Circle cx="17" cy="32" r="2" fill={C.red} opacity="0.5"/>
        <Circle cx="43" cy="32" r="2" fill={C.red} opacity="0.5"/>
      </>}
      <Path d={mouthD} stroke="#7DD3FC" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <Rect x="6" y="24" width="4" height="10" rx="2" fill={C.blueDeep}/>
      <Rect x="50" y="24" width="4" height="10" rx="2" fill={C.blueDeep}/>
      <Ellipse cx="30" cy="52" rx="14" ry="2" fill="#000" opacity="0.08"/>
    </Svg>
  );
}
