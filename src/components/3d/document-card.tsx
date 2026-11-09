"use client";

import { useContext, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  createCardTexture,
  type CardTextureKind,
} from "@/components/3d/canvas-textures";
import { SceneFontsReadyContext } from "@/components/3d/scene-context";

export function DocumentCard({
  kind,
  width,
  height,
}: {
  kind: CardTextureKind;
  width: number;
  height: number;
}) {
  const fontsReady = useContext(SceneFontsReadyContext);
  const gl = useThree((state) => state.gl);

  const texture = useMemo(() => {
    const next = createCardTexture(kind, height / width, fontsReady);
    next.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    return next;
  }, [kind, width, height, fontsReady, gl]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.024]} />
        <meshStandardMaterial color="#ece4d2" roughness={0.94} metalness={0} />
      </mesh>

      <mesh position={[0, 0, 0.0145]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.88}
          metalness={0}
          envMapIntensity={0.35}
        />
      </mesh>

      <mesh position={[0, 0, -0.0145]} rotation-y={Math.PI}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#ddd3bf"
          roughness={0.96}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
