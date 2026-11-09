"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { createHaloTexture } from "@/components/3d/canvas-textures";
import { DocumentCard } from "@/components/3d/document-card";
import {
  CabinetModel,
  ModelObject,
  MODEL_PATHS,
} from "@/components/3d/model-object";
import type { CardTextureKind } from "@/components/3d/canvas-textures";
import type {
  FloatSpec,
  Keyframe,
  PointerRef,
  ProgressRef,
  Vec3,
} from "@/components/3d/types";

type ContentSpec =
  | {
      type: "card";
      kind: CardTextureKind;
      width: number;
      height: number;
    }
  | {
      type: "model";
      path: string;
      node?: string;
      fit: "max" | "height";
      size: number;
      yaw: number;
    }
  | { type: "cabinet" }
  | { type: "folder" };

type StorySpec = {
  id: string;
  keys: Keyframe[];
  float: FloatSpec;
  content: ContentSpec;
  halo?: [number, number];
  highlight?: number[];
};

const noFloat: FloatSpec = {
  x: 0,
  y: 0,
  z: 0,
  tilt: 0,
  speed: 0.4,
  phase: 0,
};

const drift = (phase: number, y = 0.045): FloatSpec => ({
  x: 0.012,
  y,
  z: 0.018,
  tilt: 0.014,
  speed: 0.42 + (phase % 4) * 0.06,
  phase,
});

const k = (
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
  scale = 1
): Keyframe => ({ position, rotation, scale });

const hidden = (position: Vec3): Keyframe => ({
  position,
  rotation: [0, 0, 0],
  scale: 0.001,
});

const story: StorySpec[] = [
  {
    id: "message",
    content: { type: "card", kind: "message", width: 1.5, height: 0.95 },
    float: drift(0.4, 0.055),
    halo: [1.5, 0.95],
    highlight: [0.35, 0.2, 0, 0, 0, 0],
    keys: [
      k([-1.7, 1.6, 0.7], [0.06, 0.32, -0.12], 1),
      k([-0.9, 1.95, 1.65], [0.02, 0.14, -0.04], 1.04),
      k([-2, 2.3, 0.3], [0.02, -0.3, 0.04], 0.82),
      k([-2.5, 2.45, 0.1], [0.02, -0.32, 0.03], 0.4),
      hidden([-2.6, 2.5, 0]),
      hidden([-2.6, 2.5, 0]),
    ],
  },
  {
    id: "refined",
    content: { type: "card", kind: "refined", width: 1.5, height: 0.95 },
    float: drift(1.3, 0.05),
    halo: [1.5, 0.95],
    highlight: [0, 0.25, 0.95, 0.45, 0, 0],
    keys: [
      hidden([-1.4, 1.7, 0.8]),
      k([0.62, 2.05, 1.45], [0, -0.1, 0.02], 1.08),
      k([-1.2, 2.6, 0.65], [0.02, -0.2, 0.03], 0.86),
      k([-2.2, 2.7, 0.2], [0.02, -0.28, 0.03], 0.38),
      hidden([-2.4, 2.7, 0.1]),
      hidden([-2.4, 2.7, 0.1]),
    ],
  },
  {
    id: "project",
    content: { type: "card", kind: "project", width: 1.2, height: 1.65 },
    float: drift(2.2, 0.04),
    halo: [1.2, 1.65],
    highlight: [0.2, 0.1, 0.45, 0.2, 0.25, 0.25],
    keys: [
      k([1.5, 1.4, 0.2], [0.04, -0.38, 0.08], 1),
      k([1.7, 1.6, -0.1], [0.03, -0.36, 0.04], 0.9),
      k([0.35, 1.95, 1.5], [0, -0.06, 0], 1.02),
      k([0, 2.55, 0.55], [0.02, -0.02, 0], 0.8),
      k([-0.65, 2.05, 0.6], [0.02, 0.03, 0], 0.68),
      k([-1.8, 2.45, 0.6], [0.02, 0.06, 0.01], 0.82),
    ],
  },
  {
    id: "calendar",
    content: { type: "card", kind: "calendar", width: 1.12, height: 1.42 },
    float: drift(3.1, 0.04),
    halo: [1.12, 1.42],
    highlight: [0.2, 0, 0, 0, 0, 0],
    keys: [
      k([2.55, 1.1, -0.75], [0, -0.58, -0.1], 0.95),
      k([2.6, 1.25, -0.85], [0.02, -0.55, -0.06], 0.88),
      k([2.75, 1.4, -1], [0.02, -0.6, 0], 0.8),
      k([2.95, 1.55, -1.25], [0.02, -0.6, 0], 0.65),
      k([3, 1.35, -1.35], [0.02, -0.6, 0], 0.55),
      k([3, 1.25, -1.15], [0.02, -0.58, 0], 0.42),
    ],
  },
  {
    id: "tasks",
    content: { type: "card", kind: "tasks", width: 1.4, height: 0.89 },
    float: drift(4.2, 0.05),
    halo: [1.4, 0.89],
    highlight: [0.2, 0.12, 0, 0.4, 0, 0],
    keys: [
      k([-0.1, 1, -0.2], [0.1, 0.18, 0.04], 0.92),
      k([0, 1.05, -0.4], [0.08, 0.12, 0.02], 0.82),
      k([0.95, 1.1, -0.1], [0.05, 0.05, 0], 0.78),
      k([1.75, 1.15, 0.6], [0.03, -0.02, 0], 0.72),
      k([0.9, 1.1, 0.55], [0.03, 0.02, 0], 0.62),
      hidden([0.9, 1.1, 0.5]),
    ],
  },
  {
    id: "agenda",
    content: { type: "card", kind: "agenda", width: 1.26, height: 1.62 },
    float: drift(0.9, 0.045),
    halo: [1.26, 1.62],
    highlight: [0, 0, 0.9, 0.35, 0.18, 0.22],
    keys: [
      hidden([0.4, 2.1, 1.4]),
      hidden([0.4, 2.1, 1.4]),
      k([0.45, 2.3, 1.95], [0, 0.03, 0], 1.18),
      k([-1.85, 2.5, 1.15], [0, 0.05, 0], 0.92),
      k([-2.35, 2, 0.3], [0, 0.1, 0], 0.68),
      k([-2.35, 1.85, 0.3], [0, 0.1, 0], 0.64),
    ],
  },
  {
    id: "talking-1",
    content: {
      type: "card",
      kind: "talking-1",
      width: 1.06,
      height: 0.68,
    },
    float: drift(5.1, 0.07),
    halo: [1.06, 0.68],
    highlight: [0, 0, 0.65, 0.2, 0, 0],
    keys: [
      hidden([1.5, 2.3, 1]),
      hidden([1.5, 2.3, 1]),
      k([2.05, 2.65, 1.75], [0, -0.12, -0.05], 0.98),
      k([2.45, 2.65, 0.3], [0, -0.16, -0.02], 0.6),
      k([2.65, 2.7, -0.6], [0, -0.2, 0], 0.48),
      hidden([2.65, 2.7, -0.6]),
    ],
  },
  {
    id: "talking-2",
    content: {
      type: "card",
      kind: "talking-2",
      width: 1.06,
      height: 0.68,
    },
    float: drift(5.8, 0.06),
    halo: [1.06, 0.68],
    highlight: [0, 0, 0.6, 0.18, 0, 0],
    keys: [
      hidden([1.9, 2.1, 1]),
      hidden([1.9, 2.1, 1]),
      k([2.5, 2.05, 1.65], [0, -0.18, 0.02], 0.94),
      k([2.75, 2.1, 0.2], [0, -0.2, 0.01], 0.56),
      k([2.9, 2.2, -0.7], [0, -0.24, 0], 0.45),
      hidden([2.9, 2.2, -0.7]),
    ],
  },
  {
    id: "talking-3",
    content: {
      type: "card",
      kind: "talking-3",
      width: 1.06,
      height: 0.68,
    },
    float: drift(6.4, 0.07),
    halo: [1.06, 0.68],
    highlight: [0, 0, 0.55, 0.15, 0, 0],
    keys: [
      hidden([2.2, 1.5, 1]),
      hidden([2.2, 1.5, 1]),
      k([2.82, 1.4, 1.55], [0, -0.24, 0.06], 0.88),
      k([2.95, 1.6, 0.1], [0, -0.26, 0.02], 0.52),
      k([3.05, 1.7, -0.8], [0, -0.3, 0], 0.42),
      hidden([3.05, 1.7, -0.8]),
    ],
  },
  {
    id: "notes",
    content: { type: "card", kind: "notes", width: 1.5, height: 0.96 },
    float: drift(1.7, 0.05),
    halo: [1.5, 0.96],
    highlight: [0, 0, 0, 0.95, 0.4, 0.2],
    keys: [
      hidden([-0.5, 2.1, 1.5]),
      hidden([-0.5, 2.1, 1.5]),
      hidden([-0.5, 2.1, 1.5]),
      k([-0.4, 2.3, 2.7], [-0.06, 0.22, -0.03], 1.18),
      k([-1.9, 2.55, 0.5], [0.03, 0.14, 0], 0.72),
      k([-1.7, 1.15, 0.8], [0.02, 0.08, 0], 0.64),
    ],
  },
  {
    id: "decision",
    content: { type: "card", kind: "decision", width: 1.36, height: 0.86 },
    float: drift(2.7, 0.05),
    halo: [1.36, 0.86],
    highlight: [0, 0, 0, 0.75, 0.3, 0.3],
    keys: [
      hidden([0.9, 2.6, 1.4]),
      hidden([0.9, 2.6, 1.4]),
      hidden([0.9, 2.6, 1.4]),
      k([1.05, 2.85, 2.2], [0, -0.04, 0.02], 0.94),
      k([1.75, 2.8, 0.2], [0, -0.04, 0.02], 0.82),
      k([2.35, 2.75, 0.5], [0, -0.08, 0.01], 0.82),
    ],
  },
  {
    id: "action",
    content: { type: "card", kind: "action", width: 1.36, height: 0.86 },
    float: drift(3.6, 0.05),
    halo: [1.36, 0.86],
    highlight: [0, 0, 0, 0.75, 0.3, 0.3],
    keys: [
      hidden([2, 2.2, 1.7]),
      hidden([2, 2.2, 1.7]),
      hidden([2, 2.2, 1.7]),
      k([2.15, 2.25, 2.1], [0, -0.12, 0.01], 0.92),
      k([2.5, 2.1, 0.05], [0, -0.12, 0.01], 0.78),
      k([2.55, 2.1, 0.6], [0, -0.12, 0.01], 0.8),
    ],
  },
  {
    id: "question",
    content: { type: "card", kind: "question", width: 1.26, height: 0.8 },
    float: drift(4.7, 0.04),
    halo: [1.26, 0.8],
    highlight: [0, 0, 0, 0.65, 0.25, 0.28],
    keys: [
      hidden([1, 1.5, 1.5]),
      hidden([1, 1.5, 1.5]),
      hidden([1, 1.5, 1.5]),
      k([1.05, 1.55, 2.45], [0.03, -0.06, 0], 0.88),
      k([1.55, 1.55, 0.4], [0.03, -0.06, 0], 0.7),
      k([2.35, 1.5, 0.7], [0.02, -0.08, 0], 0.72),
    ],
  },
  {
    id: "record-1",
    content: { type: "card", kind: "record-1", width: 1.2, height: 0.78 },
    float: drift(5.4, 0.04),
    halo: [1.2, 0.78],
    highlight: [0, 0, 0, 0, 0.85, 0.5],
    keys: [
      hidden([-0.9, 1.7, 1.2]),
      hidden([-0.9, 1.7, 1.2]),
      hidden([-0.9, 1.7, 1.2]),
      hidden([-0.9, 1.7, 1.2]),
      k([-0.9, 1.8, 2.1], [0, 0.05, 0.02], 0.98),
      k([-0.9, 2.35, 1], [0, 0.04, 0.01], 0.9),
    ],
  },
  {
    id: "record-2",
    content: { type: "card", kind: "record-2", width: 1.2, height: 0.78 },
    float: drift(6.1, 0.045),
    halo: [1.2, 0.78],
    highlight: [0, 0, 0, 0, 0.85, 0.5],
    keys: [
      hidden([0.2, 1.4, 1.2]),
      hidden([0.2, 1.4, 1.2]),
      hidden([0.2, 1.4, 1.2]),
      hidden([0.2, 1.4, 1.2]),
      k([0.3, 1.45, 2], [0, -0.06, 0.01], 0.98),
      k([0.2, 2.1, 1.1], [0, -0.04, 0.01], 0.9),
    ],
  },
  {
    id: "record-3",
    content: { type: "card", kind: "record-3", width: 1.2, height: 0.78 },
    float: drift(6.8, 0.04),
    halo: [1.2, 0.78],
    highlight: [0, 0, 0, 0, 0.8, 0.45],
    keys: [
      hidden([1.2, 1.1, 1.1]),
      hidden([1.2, 1.1, 1.1]),
      hidden([1.2, 1.1, 1.1]),
      hidden([1.2, 1.1, 1.1]),
      k([1.5, 1.1, 1.9], [0, -0.12, 0], 0.94),
      k([1.3, 1.85, 1], [0, -0.1, 0], 0.88),
    ],
  },
  {
    id: "notebook",
    content: {
      type: "model",
      path: MODEL_PATHS.notebook,
      node: "binder_notebook",
      fit: "max",
      size: 1.7,
      yaw: 0.22,
    },
    float: noFloat,
    highlight: [0, 0, 0.15, 0.3, 0.2, 0.35],
    keys: [
      k([-1.9, 0.02, 1.3], [0, 0.22, 0], 1),
      k([-1.9, 0.02, 1.3], [0, 0.15, 0], 1),
      k([-1.85, 0.02, 1.3], [0, 0.1, 0], 1),
      k([-1.75, 0.02, 1.3], [0, 0.08, 0], 1),
      k([-1.7, 0.02, 1.4], [0, 0.05, 0], 1),
      k([-0.5, 0.02, 1.4], [0, 0.04, 0], 1),
    ],
  },
  {
    id: "binder-closed",
    content: {
      type: "model",
      path: MODEL_PATHS.notebook,
      node: "binder_notebook_closed",
      fit: "max",
      size: 0.82,
      yaw: -0.18,
    },
    float: noFloat,
    highlight: [0, 0, 0, 0, 0.15, 0.3],
    keys: [
      hidden([2.9, 0.02, 0.2]),
      hidden([2.9, 0.02, 0.2]),
      hidden([2.9, 0.02, 0.2]),
      hidden([2.9, 0.02, 0.2]),
      k([2.7, 0.02, -0.35], [0, -0.18, 0], 1),
      k([1.9, 0.02, 0.8], [0, -0.12, 0], 1),
    ],
  },
  {
    id: "notepad",
    content: {
      type: "model",
      path: MODEL_PATHS.notepads,
      node: "office_notepads_a4_a",
      fit: "max",
      size: 0.78,
      yaw: -0.35,
    },
    float: noFloat,
    keys: [
      k([0.85, 0.02, 0.95], [0, -0.35, 0], 1),
      k([0.9, 0.02, 0.8], [0, -0.3, 0], 1),
      k([0.9, 0.02, 0.7], [0, -0.25, 0], 1),
      k([0.75, 0.02, 1], [0, -0.2, 0], 1),
      k([0.3, 0.02, 1.3], [0, -0.12, 0], 1),
      k([-2.1, 0.02, 0.5], [0, 0.18, 0], 1),
    ],
  },
  {
    id: "sticky",
    content: {
      type: "model",
      path: MODEL_PATHS.notepads,
      node: "office_notepads_sticky_sheet",
      fit: "max",
      size: 0.46,
      yaw: -0.15,
    },
    float: noFloat,
    keys: [
      k([2.15, 0.02, 0.55], [0, -0.15, 0], 1),
      k([2.2, 0.02, 0.45], [0, -0.12, 0], 1),
      k([2.2, 0.02, 0.4], [0, -0.1, 0], 1),
      k([2.2, 0.02, 0.6], [0, -0.08, 0], 1),
      k([2.2, 0.02, 0.6], [0, -0.14, 0], 1),
      k([2.7, 0.02, -0.2], [0, -0.2, 0], 1),
    ],
  },
  {
    id: "stack",
    content: {
      type: "model",
      path: MODEL_PATHS.notepads,
      node: "office_notepads_a4_stack",
      fit: "max",
      size: 0.98,
      yaw: 0.1,
    },
    float: noFloat,
    keys: [
      k([-0.45, 0.02, 1.75], [0, 0.1, 0], 1),
      k([-0.5, 0.02, 1.65], [0, 0.06, 0], 1),
      k([-0.6, 0.02, 1.6], [0, 0.04, 0], 1),
      k([-0.4, 0.02, 1.5], [0, 0.02, 0], 1),
      k([-0.6, 0.02, 1.5], [0, 0.04, 0], 1),
      k([-1.5, 0.02, 1.7], [0, 0.08, 0], 1),
    ],
  },
  {
    id: "cabinet",
    content: { type: "cabinet" },
    float: noFloat,
    keys: [
      k([3.75, -1.72, -2.3]),
      k([3.8, -1.72, -2.35]),
      k([3.8, -1.72, -2.3]),
      k([3.75, -1.72, -2.3]),
      k([3.7, -1.72, -2.2]),
      k([3.55, -1.72, -2]),
    ],
  },
  {
    id: "folder",
    content: { type: "folder" },
    float: noFloat,
    highlight: [0, 0, 0, 0.45, 0.28, 0.22],
    keys: [
      hidden([2.95, 0.04, 1.15]),
      hidden([2.95, 0.04, 1.15]),
      hidden([2.95, 0.04, 1.15]),
      k([2.95, 0.04, 1.15], [0, -0.42, 0], 0.92),
      k([3.05, 0.04, 0.95], [0, -0.38, 0], 1),
      k([2.9, 0.04, 1.2], [0, -0.34, 0], 1.04),
    ],
  },
];

function FolderProp() {
  return (
    <group rotation={[0, -0.32, 0]}>
      <mesh position={[0, 0.018, 0]} rotation={[-0.04, 0, 0]}>
        <boxGeometry args={[0.74, 0.012, 0.52]} />
        <meshStandardMaterial color="#304e3e" roughness={0.82} />
      </mesh>
      <mesh position={[-0.16, 0.052, 0.02]} rotation={[-0.08, 0, 0.04]}>
        <boxGeometry args={[0.5, 0.008, 0.36]} />
        <meshStandardMaterial color="#f1ece0" roughness={0.92} />
      </mesh>
      <mesh position={[0.19, 0.046, 0.03]} rotation={[-0.06, 0, -0.03]}>
        <boxGeometry args={[0.3, 0.006, 0.22]} />
        <meshStandardMaterial color="#c9ad75" roughness={0.72} />
      </mesh>
      <mesh position={[-0.2, 0.058, -0.22]}>
        <boxGeometry args={[0.22, 0.01, 0.08]} />
        <meshStandardMaterial color="#3b5a49" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.036, 0.24]}>
        <boxGeometry args={[0.18, 0.006, 0.03]} />
        <meshStandardMaterial color="#e5e1d6" roughness={0.9} />
      </mesh>
    </group>
  );
}

function sampleKeyframes(keys: Keyframe[], progress: number) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const scaled = clamped * (keys.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, keys.length - 1);
  const fraction = scaled - index;
  const eased = fraction * fraction * (3 - 2 * fraction);
  const from = keys[index];
  const to = keys[nextIndex];

  return {
    position: [
      THREE.MathUtils.lerp(from.position[0], to.position[0], eased),
      THREE.MathUtils.lerp(from.position[1], to.position[1], eased),
      THREE.MathUtils.lerp(from.position[2], to.position[2], eased),
    ] as Vec3,
    rotation: [
      THREE.MathUtils.lerp(from.rotation[0], to.rotation[0], eased),
      THREE.MathUtils.lerp(from.rotation[1], to.rotation[1], eased),
      THREE.MathUtils.lerp(from.rotation[2], to.rotation[2], eased),
    ] as Vec3,
    scale: THREE.MathUtils.lerp(from.scale, to.scale, eased),
  };
}

function sampleValues(values: number[] | undefined, progress: number) {
  if (!values || values.length === 0) return 0;
  const scaled = THREE.MathUtils.clamp(progress, 0, 1) * (values.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, values.length - 1);
  const fraction = scaled - index;
  const eased = fraction * fraction * (3 - 2 * fraction);
  return THREE.MathUtils.lerp(values[index], values[nextIndex], eased);
}

function StoryObject({
  spec,
  progressRef,
  pointerRef,
  haloTexture,
}: {
  spec: StorySpec;
  progressRef: ProgressRef;
  pointerRef: PointerRef;
  haloTexture: THREE.CanvasTexture;
}) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const initial = spec.keys[0];

  useFrame((state, delta) => {
    const object = group.current;
    if (!object) return;

    const target = sampleKeyframes(spec.keys, progressRef.current);
    const time = state.clock.elapsedTime;
    const visible = THREE.MathUtils.clamp(
      (target.scale - 0.02) / 0.35,
      0,
      1
    );

    target.position[0] +=
      Math.sin(time * spec.float.speed + spec.float.phase) *
        spec.float.x *
        visible +
      pointerRef.current.x * 0.05 * visible;
    target.position[1] +=
      Math.cos(time * spec.float.speed * 0.82 + spec.float.phase) *
        spec.float.y *
        visible -
      pointerRef.current.y * 0.035 * visible;
    target.position[2] +=
      Math.sin(time * spec.float.speed * 0.66 + spec.float.phase) *
      spec.float.z *
      visible;
    target.rotation[2] +=
      Math.sin(time * spec.float.speed * 0.73 + spec.float.phase) *
      spec.float.tilt *
      visible;

    object.position.x = THREE.MathUtils.damp(
      object.position.x,
      target.position[0],
      6,
      delta
    );
    object.position.y = THREE.MathUtils.damp(
      object.position.y,
      target.position[1],
      6,
      delta
    );
    object.position.z = THREE.MathUtils.damp(
      object.position.z,
      target.position[2],
      6,
      delta
    );

    object.rotation.x = THREE.MathUtils.damp(
      object.rotation.x,
      target.rotation[0],
      6,
      delta
    );
    object.rotation.y = THREE.MathUtils.damp(
      object.rotation.y,
      target.rotation[1],
      6,
      delta
    );
    object.rotation.z = THREE.MathUtils.damp(
      object.rotation.z,
      target.rotation[2],
      6,
      delta
    );

    const scale = Math.max(0.001, target.scale);
    object.scale.setScalar(
      THREE.MathUtils.damp(object.scale.x, scale, 7, delta)
    );

    if (halo.current) {
      const accent = sampleValues(spec.highlight, progressRef.current);
      halo.current.opacity =
        accent * (0.34 + Math.sin(time * 1.1 + spec.float.phase) * 0.05);
    }
  });

  return (
    <group
      ref={group}
      position={initial.position}
      rotation={initial.rotation}
      scale={Math.max(0.001, initial.scale)}
    >
      {spec.halo ? (
        <mesh position={[0, 0, -0.05]} scale={[1.42, 1.5, 1]}>
          <planeGeometry args={[spec.halo[0], spec.halo[1]]} />
          <meshBasicMaterial
            ref={halo}
            map={haloTexture}
            color="#d6b87c"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {spec.content.type === "card" ? (
        <DocumentCard
          kind={spec.content.kind}
          width={spec.content.width}
          height={spec.content.height}
        />
      ) : null}

      {spec.content.type === "model" ? (
        <ModelObject
          path={spec.content.path}
          node={spec.content.node}
          fit={spec.content.fit}
          size={spec.content.size}
          yaw={spec.content.yaw}
        />
      ) : null}

      {spec.content.type === "cabinet" ? (
        <CabinetModel progressRef={progressRef} />
      ) : null}

      {spec.content.type === "folder" ? <FolderProp /> : null}
    </group>
  );
}

export function SceneObjects({
  progressRef,
  pointerRef,
}: {
  progressRef: ProgressRef;
  pointerRef: PointerRef;
}) {
  const haloTexture = useMemo(() => createHaloTexture(), []);

  useEffect(() => () => haloTexture.dispose(), [haloTexture]);

  return (
    <group>
      {story.map((spec) => (
        <StoryObject
          key={spec.id}
          spec={spec}
          progressRef={progressRef}
          pointerRef={pointerRef}
          haloTexture={haloTexture}
        />
      ))}
    </group>
  );
}
