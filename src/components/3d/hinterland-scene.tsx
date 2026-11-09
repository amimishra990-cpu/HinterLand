"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import { DeskModel } from "@/components/3d/desk-model";
import { SceneObjects } from "@/components/3d/scene-objects";
import { ContextThread } from "@/components/3d/thread";
import type { PointerRef, ProgressRef, Vec3 } from "@/components/3d/types";

type CameraKey = {
  position: Vec3;
  target: Vec3;
  fov: number;
};

const cameraKeys: CameraKey[] = [
  { position: [-2.6, 2.7, 9.2], target: [-0.1, 1.4, 0], fov: 44 },
  { position: [-1.6, 2.6, 8.6], target: [0.1, 1.65, 0], fov: 42 },
  { position: [-0.8, 2.45, 8.2], target: [0.2, 1.7, 0], fov: 41 },
  { position: [0.2, 2.3, 7.6], target: [0.35, 1.85, 0], fov: 39 },
  { position: [-0.1, 2.5, 8.3], target: [0.35, 1.8, 0], fov: 40 },
  { position: [0.1, 3.1, 9.8], target: [0.2, 1.65, 0], fov: 43 },
];

function sampleCamera(progress: number): CameraKey {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const scaled = clamped * (cameraKeys.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, cameraKeys.length - 1);
  const fraction = scaled - index;
  const eased = fraction * fraction * (3 - 2 * fraction);
  const from = cameraKeys[index];
  const to = cameraKeys[nextIndex];

  return {
    position: [
      THREE.MathUtils.lerp(from.position[0], to.position[0], eased),
      THREE.MathUtils.lerp(from.position[1], to.position[1], eased),
      THREE.MathUtils.lerp(from.position[2], to.position[2], eased),
    ],
    target: [
      THREE.MathUtils.lerp(from.target[0], to.target[0], eased),
      THREE.MathUtils.lerp(from.target[1], to.target[1], eased),
      THREE.MathUtils.lerp(from.target[2], to.target[2], eased),
    ],
    fov: THREE.MathUtils.lerp(from.fov, to.fov, eased),
  };
}

function CameraRig({
  progressRef,
  pointerRef,
}: {
  progressRef: ProgressRef;
  pointerRef: PointerRef;
}) {
  const camera = useThree((state) => state.camera);
  const cameraRef = useRef(camera);
  const lookAt = useRef(new THREE.Vector3(-0.1, 1.55, 0));

  useFrame((state, delta) => {
    const activeCamera = cameraRef.current;
    if (!(activeCamera instanceof THREE.PerspectiveCamera)) return;

    const sample = sampleCamera(progressRef.current);
    const pointer = pointerRef.current;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const aspectBoost = THREE.MathUtils.clamp((1.1 - aspect) * 20, 0, 10);

    activeCamera.position.x = THREE.MathUtils.damp(
      activeCamera.position.x,
      sample.position[0] + pointer.x * 0.2,
      2.8,
      delta
    );
    activeCamera.position.y = THREE.MathUtils.damp(
      activeCamera.position.y,
      sample.position[1] - pointer.y * 0.13,
      2.8,
      delta
    );
    activeCamera.position.z = THREE.MathUtils.damp(
      activeCamera.position.z,
      sample.position[2],
      2.8,
      delta
    );

    lookAt.current.x = THREE.MathUtils.damp(
      lookAt.current.x,
      sample.target[0] + pointer.x * 0.1,
      3.2,
      delta
    );
    lookAt.current.y = THREE.MathUtils.damp(
      lookAt.current.y,
      sample.target[1] - pointer.y * 0.06,
      3.2,
      delta
    );
    lookAt.current.z = THREE.MathUtils.damp(
      lookAt.current.z,
      sample.target[2],
      3.2,
      delta
    );

    activeCamera.lookAt(lookAt.current);

    const nextFov = sample.fov + aspectBoost;
    activeCamera.fov = THREE.MathUtils.damp(
      activeCamera.fov,
      nextFov,
      3,
      delta
    );
    activeCamera.updateProjectionMatrix();
  });

  return null;
}

function SceneLights() {
  return (
    <>
      <hemisphereLight args={["#d9e4d4", "#07110c", 0.65]} />
      <ambientLight intensity={0.16} color="#f2e6cf" />

      <directionalLight
        castShadow
        position={[4.6, 7.5, 5.2]}
        intensity={2.3}
        color="#ffe7c2"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />

      <directionalLight
        position={[-5, 4.2, -3.4]}
        intensity={1.15}
        color="#bfd6c4"
      />

      <spotLight
        position={[3, 6.4, 1.6]}
        angle={0.55}
        penumbra={0.95}
        intensity={32}
        distance={22}
        color="#f4d6a4"
      />

      <Environment resolution={96} frames={1} background={false}>
        <Lightformer
          form="rect"
          intensity={0.55}
          color="#f8ecd4"
          scale={[6, 4, 1]}
          position={[0, 4.5, -4]}
        />
        <Lightformer
          form="rect"
          intensity={0.4}
          color="#adc6b2"
          scale={[4, 3, 1]}
          position={[-4, 2, 2]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.26}
          color="#c47b5b"
          scale={[3, 2, 1]}
          position={[4, 1.2, 2]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>

      <fogExp2 attach="fog" args={["#0b1712", 0.036]} />
    </>
  );
}

export function HinterlandScene({
  progressRef,
  pointerRef,
  active,
}: {
  progressRef: ProgressRef;
  pointerRef: PointerRef;
  active: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      frameloop={active ? "always" : "demand"}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{
        position: [-2.6, 2.9, 9.4],
        fov: 44,
        near: 0.1,
        far: 60,
      }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        camera.lookAt(-0.1, 1.55, 0);
      }}
    >
      <Suspense fallback={null}>
        <SceneLights />
        <DeskModel />
        <SceneObjects progressRef={progressRef} pointerRef={pointerRef} />
        <ContextThread progressRef={progressRef} />
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} />
      </Suspense>
    </Canvas>
  );
}
