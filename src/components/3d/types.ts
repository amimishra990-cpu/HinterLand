export type Vec3 = [number, number, number];

export type ProgressRef = { current: number };

export type PointerRef = { current: { x: number; y: number } };

export type Keyframe = {
  position: Vec3;
  rotation: Vec3;
  scale: number;
};

export type FloatSpec = {
  x: number;
  y: number;
  z: number;
  tilt: number;
  speed: number;
  phase: number;
};
