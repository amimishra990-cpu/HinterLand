"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import type { ProgressRef } from "@/components/3d/types";

export const MODEL_PATHS = {
  notebook: "/models/binder-notebook.glb",
  cabinet: "/models/drawer-cabinet.glb",
  notepads: "/models/office-notepads.glb",
} as const;

function normalize(
  source: THREE.Object3D,
  nodeName: string | undefined,
  fit: "max" | "height",
  size: number
) {
  const clone = source.clone(true);
  let target: THREE.Object3D = clone;

  if (nodeName) {
    const found = clone.getObjectByName(nodeName);
    if (found) {
      found.removeFromParent();
      target = found;
    }
  }

  target.position.set(0, 0, 0);
  target.rotation.set(0, 0, 0);
  target.scale.set(1, 1, 1);
  target.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(target);
  const dimensions = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const factor =
    fit === "height"
      ? size / Math.max(dimensions.y, 0.001)
      : size / Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);

  target.position.set(-center.x, -box.min.y, -center.z);
  target.updateMatrixWorld(true);

  const wrapper = new THREE.Group();
  wrapper.add(target);
  wrapper.scale.setScalar(factor);
  wrapper.updateMatrixWorld(true);

  wrapper.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return wrapper;
}

export function ModelObject({
  path,
  node,
  fit,
  size,
  yaw = 0,
}: {
  path: string;
  node?: string;
  fit: "max" | "height";
  size: number;
  yaw?: number;
}) {
  const { scene } = useGLTF(path);
  const object = useMemo(
    () => normalize(scene, node, fit, size),
    [scene, node, fit, size]
  );

  return <primitive object={object} rotation-y={yaw} />;
}

export function CabinetModel({ progressRef }: { progressRef: ProgressRef }) {
  const { scene } = useGLTF(MODEL_PATHS.cabinet);
  const { root, drawers } = useMemo(() => {
    const root = normalize(scene, undefined, "height", 2.45);
    const drawerObjects: THREE.Object3D[] = [];

    root.traverse((child) => {
      if (child.name.startsWith("drawer_cabinet_drawer_")) {
        child.userData.baseZ = child.position.z;
        drawerObjects.push(child);
      }
    });

    return { root, drawers: drawerObjects };
  }, [scene]);

  useFrame((_, delta) => {
    const opening = THREE.MathUtils.smoothstep(
      progressRef.current,
      0.86,
      0.98
    );

    drawers.forEach((drawer, index) => {
      const base = (drawer.userData.baseZ as number) ?? 0;
      const target = base + opening * (0.045 + index * 0.028);
      drawer.position.z = THREE.MathUtils.damp(
        drawer.position.z,
        target,
        4,
        delta
      );
    });
  });

  return <primitive object={root} />;
}

useGLTF.preload(MODEL_PATHS.notebook);
useGLTF.preload(MODEL_PATHS.cabinet);
useGLTF.preload(MODEL_PATHS.notepads);
