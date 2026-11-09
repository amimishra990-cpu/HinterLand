"use client";

import { useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { createDeskTexture } from "@/components/3d/canvas-textures";

function Lamp() {
  const { armGeometry, shadePosition } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.06, 0),
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(-0.04, 1.55, 0.1),
      new THREE.Vector3(0.42, 1.94, 0.46),
      new THREE.Vector3(1.12, 1.98, 0.82),
    ]);

    const shade: [number, number, number] = [1.12, 1.9, 0.82];

    return {
      armGeometry: new THREE.TubeGeometry(curve, 48, 0.024, 8, false),
      shadePosition: shade,
    };
  }, []);

  useEffect(() => () => armGeometry.dispose(), [armGeometry]);

  return (
    <group position={[-3.05, 0, -1.62]} rotation-y={0.08}>
      <mesh castShadow receiveShadow position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.055, 40]} />
        <meshStandardMaterial
          color="#1d2d24"
          metalness={0.55}
          roughness={0.34}
        />
      </mesh>

      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.035, 24]} />
        <meshStandardMaterial
          color="#b19357"
          metalness={0.8}
          roughness={0.28}
        />
      </mesh>

      <mesh geometry={armGeometry} castShadow>
        <meshStandardMaterial
          color="#33473a"
          metalness={0.65}
          roughness={0.32}
        />
      </mesh>

      <group position={shadePosition} rotation-z={0.14}>
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.34, 0.34, 32, 1, true]} />
          <meshStandardMaterial
            color="#283d31"
            metalness={0.5}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.16, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial
            color="#ffd7a1"
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#ffe3b8" />
        </mesh>
      </group>

      <pointLight
        position={[1.12, 1.62, 0.82]}
        color="#ffc98f"
        intensity={10}
        distance={7}
        decay={2}
      />
    </group>
  );
}

export function DeskModel() {
  const deskTexture = useMemo(() => createDeskTexture(), []);

  useEffect(() => () => deskTexture.dispose(), [deskTexture]);

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -1.72, 0]}
        receiveShadow
      >
        <planeGeometry args={[34, 34]} />
        <meshStandardMaterial color="#08130e" roughness={0.98} metalness={0} />
      </mesh>

      <group position={[0, -0.09, 0]}>
        <RoundedBox
          args={[9.4, 0.18, 4.5]}
          radius={0.06}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#cdbfa7"
            roughness={0.86}
            metalness={0.02}
            envMapIntensity={0.25}
          />
        </RoundedBox>

        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 0.0995, 0]}
          receiveShadow
        >
          <planeGeometry args={[9.32, 4.42]} />
          <meshStandardMaterial
            map={deskTexture}
            roughness={0.78}
            metalness={0.02}
            envMapIntensity={0.3}
          />
        </mesh>

        <mesh position={[0, 0.006, 2.26]}>
          <boxGeometry args={[9.4, 0.014, 0.03]} />
          <meshStandardMaterial
            color="#b7975b"
            metalness={0.82}
            roughness={0.3}
          />
        </mesh>
      </group>

      <RoundedBox
        args={[6.1, 0.014, 2.95]}
        radius={0.03}
        smoothness={3}
        position={[0.25, 0.012, 0.1]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#20352a"
          roughness={0.64}
          metalness={0.04}
        />
      </RoundedBox>

      {[
        { position: [0.25, 0.024, -1.37], size: [6.1, 0.006, 0.012] },
        { position: [0.25, 0.024, 1.57], size: [6.1, 0.006, 0.012] },
        { position: [-2.79, 0.024, 0.1], size: [0.012, 0.006, 2.95] },
        { position: [3.29, 0.024, 0.1], size: [0.012, 0.006, 2.95] },
      ].map((rule, index) => (
        <mesh
          key={index}
          position={
            rule.position as [number, number, number]
          }
        >
          <boxGeometry args={rule.size as [number, number, number]} />
          <meshStandardMaterial
            color="#a78952"
            metalness={0.75}
            roughness={0.38}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}

      <mesh position={[-4.18, -0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 1.72, 3.5]} />
        <meshStandardMaterial
          color="#1a2b21"
          roughness={0.48}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[4.18, -0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 1.72, 3.5]} />
        <meshStandardMaterial
          color="#1a2b21"
          roughness={0.48}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[0, -1.7, -1.4]} receiveShadow>
        <boxGeometry args={[8.3, 0.08, 0.18]} />
        <meshStandardMaterial
          color="#152419"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <Lamp />

      <group position={[1.16, 0.038, 1.34]} rotation-z={Math.PI / 2} rotation-y={-0.3}>
        <mesh castShadow>
          <cylinderGeometry args={[0.019, 0.019, 0.88, 16]} />
          <meshStandardMaterial
            color="#1b2a21"
            metalness={0.45}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 0.08, 16]} />
          <meshStandardMaterial
            color="#b99a5f"
            metalness={0.85}
            roughness={0.26}
          />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <coneGeometry args={[0.019, 0.05, 16]} />
          <meshStandardMaterial
            color="#b99a5f"
            metalness={0.85}
            roughness={0.26}
          />
        </mesh>
      </group>
    </group>
  );
}
