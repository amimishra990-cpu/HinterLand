"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ProgressRef, Vec3 } from "@/components/3d/types";

const anchors: { position: Vec3; size: number }[] = [
  { position: [-0.5, 0.16, 1.4], size: 0.034 },
  { position: [-1.7, 1.15, 0.8], size: 0.028 },
  { position: [-0.9, 2.35, 1.0], size: 0.032 },
  { position: [0.2, 2.1, 1.1], size: 0.032 },
  { position: [1.3, 1.85, 1.0], size: 0.03 },
  { position: [2.35, 2.75, 0.5], size: 0.034 },
  { position: [2.55, 2.1, 0.6], size: 0.03 },
  { position: [2.35, 1.5, 0.7], size: 0.028 },
  { position: [3.35, 0.62, -1.9], size: 0.03 },
];

function curveGeometry(points: Vec3[]) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    "catmullrom",
    0.35
  );
  return new THREE.TubeGeometry(curve, 220, 0.011, 6, false);
}

export function ContextThread({ progressRef }: { progressRef: ProgressRef }) {
  const mainGeometry = useMemo(
    () => curveGeometry(anchors.map((anchor) => anchor.position)),
    []
  );
  const branchGeometry = useMemo(
    () =>
      curveGeometry([
        [-0.9, 2.35, 1.0],
        [-1.32, 2.52, 0.9],
        [-1.8, 2.45, 0.6],
      ]),
    []
  );

  const mainMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const branchMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const knotMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useEffect(
    () => () => {
      mainGeometry.dispose();
      branchGeometry.dispose();
    },
    [mainGeometry, branchGeometry]
  );

  useFrame(({ clock }) => {
    const progress = progressRef.current;
    const growth = THREE.MathUtils.smoothstep(progress, 0.63, 0.93);
    const branchGrowth = THREE.MathUtils.smoothstep(progress, 0.7, 0.96);
    const knotGrowth = THREE.MathUtils.smoothstep(progress, 0.74, 0.97);
    const pulse = 0.72 + Math.sin(clock.elapsedTime * 1.15) * 0.16;

    if (mainGeometry.index) {
      mainGeometry.setDrawRange(
        0,
        Math.floor(mainGeometry.index.count * growth)
      );
    }
    if (branchGeometry.index) {
      branchGeometry.setDrawRange(
        0,
        Math.floor(branchGeometry.index.count * branchGrowth)
      );
    }

    if (mainMaterial.current) {
      mainMaterial.current.opacity = growth * 0.92;
      mainMaterial.current.emissiveIntensity = 0.22 + pulse * 0.16;
    }
    if (branchMaterial.current) {
      branchMaterial.current.opacity = branchGrowth * 0.62;
    }

    nodes.current.forEach((node, index) => {
      if (!node) return;
      const offset = index * 0.82;
      const scale =
        knotGrowth *
        (0.74 + Math.sin(clock.elapsedTime * 1.4 + offset) * 0.2);
      node.scale.setScalar(Math.max(0.001, scale));
    });

    if (knotGrowth > 0) {
      knotMaterials.current.forEach((material) => {
        if (!material) return;
        material.opacity = knotGrowth * 0.95;
      });
    }
  });

  return (
    <group>
      <mesh geometry={mainGeometry}>
        <meshStandardMaterial
          ref={mainMaterial}
          color="#c07a58"
          emissive="#7c3f2a"
          emissiveIntensity={0.3}
          metalness={0.42}
          roughness={0.38}
          transparent
          opacity={0}
        />
      </mesh>

      <mesh geometry={branchGeometry}>
        <meshStandardMaterial
          ref={branchMaterial}
          color="#a98b4f"
          emissive="#6f5a2c"
          emissiveIntensity={0.25}
          metalness={0.45}
          roughness={0.42}
          transparent
          opacity={0}
        />
      </mesh>

      {anchors.map((anchor, index) => (
        <mesh
          key={`${anchor.position.join("-")}-${index}`}
          ref={(node) => {
            nodes.current[index] = node;
          }}
          position={anchor.position}
          scale={0.001}
        >
          <sphereGeometry args={[anchor.size, 14, 14]} />
          <meshBasicMaterial
            ref={(material) => {
              knotMaterials.current[index] = material;
            }}
            color="#d6b87c"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
