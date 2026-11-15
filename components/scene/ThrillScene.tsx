"use client";

import { RoundedBox, Text } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { BOARD_ROTATION } from "@/lib/fretboard/layout";
import {
  BLUES_PITCHES,
  BLUE_NOTE,
  type Grip,
  pitchClass,
} from "@/lib/demo/thrill";
import { noteName } from "@/lib/theory";

const WINDOW_START = 7;
const WINDOW_END = 12;
const PITCH = 0.48;
const STRING_GAP = 0.4;
const COUNT = 6;
const NECK_THICKNESS = 0.34;
const TOP = 0.024;
const LABEL_Y = TOP + 0.18;
const WOOD = "#1c100c";
const BOARD = "#6b4030";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#♯♭ ·-–—";
const LOOK = new THREE.Vector3(0, 0.5, 0.87).normalize();
const STACK = new THREE.Vector3(0, 0.783, -0.622).normalize();

const SPAN = (COUNT - 1) * STRING_GAP;
const WIDTH = SPAN + 0.4;
const Z0 = WINDOW_START * PITCH - 0.2;
const Z1 = (WINDOW_END + 1) * PITCH + 0.14;
const Z_CENTER = (Z0 + Z1) / 2;
const LENGTH = Z1 - Z0;

export type ThrillSceneProps = {
  chordName: string;
  chordFrets: Grip;
  chordTones: readonly number[];
  lead: { string: number; fret: number; outside: boolean; blue: boolean } | null;
  strum: boolean;
};

export function ThrillScene(props: ThrillSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 8, 14], fov: 30, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.16;
      }}
    >
      <color attach="background" args={["#14110e"]} />
      <Suspense fallback={null}>
        <Lesson {...props} />
      </Suspense>
    </Canvas>
  );
}

function Lesson({ chordName, chordFrets, chordTones, lead, strum }: ThrillSceneProps) {
  const tones = useMemo(() => new Set(chordTones), [chordTones]);
  const rhythmAt = STACK.clone().multiplyScalar(1.75);
  const leadAt = STACK.clone().multiplyScalar(-1.75);

  return (
    <>
      <ambientLight intensity={0.46} />
      <directionalLight position={[4, 8, 6]} intensity={2.4} color="#fff0d4" />
      <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#9eb4cc" />
      <FitBoards />
      <Neck
        position={rhythmAt}
        kicker="Rhythm"
        title={chordName}
        subtitle="The chord of the bar"
      >
        {chordFrets.map((fret, string) =>
          fret === null ? null : (
            <Marker
              key={`${string}-${fret}`}
              string={string}
              fret={fret}
              color="#e4b15c"
              label={noteName(pitchClass(string, fret), "sharp")}
              hot={strum}
              radius={0.13}
            />
          ),
        )}
      </Neck>
      <Neck
        position={leadAt}
        kicker="B.B. King"
        title="B minor blues"
        subtitle="The scale, and the note sounding now"
      >
        <ScaleDots tones={tones} lead={lead} />
      </Neck>
    </>
  );
}

function Neck({
  position,
  kicker,
  title,
  subtitle,
  children,
}: {
  position: THREE.Vector3;
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const localZ = (z: number) => z - Z_CENTER;
  const stringX = (index: number) => -SPAN / 2 + index * STRING_GAP;

  return (
    <group position={position} rotation={BOARD_ROTATION}>
      <RoundedBox
        args={[WIDTH, NECK_THICKNESS, LENGTH]}
        radius={0.1}
        smoothness={6}
        position={[0, -NECK_THICKNESS / 2, 0]}
      >
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0.03} />
      </RoundedBox>
      <RoundedBox
        args={[WIDTH - 0.16, TOP, LENGTH - 0.1]}
        radius={0.008}
        smoothness={3}
        position={[0, TOP / 2, 0]}
      >
        <meshStandardMaterial color={BOARD} roughness={0.64} metalness={0.02} />
      </RoundedBox>
      <mesh position={[0, -NECK_THICKNESS / 2 + 0.004, localZ(Z0 + 0.02)]}>
        <boxGeometry args={[WIDTH + 0.004, NECK_THICKNESS, 0.02]} />
        <meshStandardMaterial color="#c6a15c" metalness={0.55} roughness={0.35} />
      </mesh>
      {Array.from({ length: WINDOW_END - WINDOW_START + 1 }, (_, index) => WINDOW_START + index).map(
        (fret) => (
          <FretWire key={fret} z={localZ(fret * PITCH)} />
        ),
      )}
      {Array.from({ length: COUNT }, (_, index) => (
        <StringCourse key={index} index={index} x={stringX(index)} />
      ))}
      {Array.from({ length: WINDOW_END - WINDOW_START + 1 }, (_, index) => WINDOW_START + index).map(
        (fret) => (
          <FaceText
            key={`n-${fret}`}
            position={[-WIDTH / 2 - 0.08, LABEL_Y, localZ((fret + 0.5) * PITCH)]}
            size={0.11}
            color="#f6e7c3"
          >
            {String(fret)}
          </FaceText>
        ),
      )}
      <FaceText position={[WIDTH / 2 + 0.46, LABEL_Y, 0]} size={0.13} color="#e4b15c">
        {kicker}
      </FaceText>
      <FaceText position={[WIDTH / 2 + 0.26, LABEL_Y, 0]} size={0.2} color="#f7f1e6">
        {title}
      </FaceText>
      <FaceText position={[WIDTH / 2 + 0.08, LABEL_Y, 0]} size={0.09} color="#d9c4a2">
        {subtitle}
      </FaceText>
      <group>
        {children}
      </group>
    </group>
  );
}

function ScaleDots({
  tones,
  lead,
}: {
  tones: Set<number>;
  lead: ThrillSceneProps["lead"];
}) {
  const dots: Array<{ string: number; fret: number; pitch: number }> = [];
  for (let string = 0; string < COUNT; string += 1) {
    for (let fret = WINDOW_START; fret <= WINDOW_END; fret += 1) {
      const pitch = pitchClass(string, fret);
      if (BLUES_PITCHES.has(pitch)) dots.push({ string, fret, pitch });
    }
  }
  const sounding =
    lead &&
    dots.find((dot) => dot.string === lead.string && dot.fret === lead.fret) === undefined
      ? lead
      : null;

  return (
    <>
      {dots.map((dot) => {
        const active = lead?.string === dot.string && lead.fret === dot.fret;
        const chordTone = tones.has(dot.pitch);
        const blue = dot.pitch === BLUE_NOTE;
        const color = active && lead?.outside ? "#e07a45" : chordTone ? "#e4b15c" : blue ? "#9ec4d8" : "#f4efe4";
        return (
          <Marker
            key={`${dot.string}-${dot.fret}`}
            string={dot.string}
            fret={dot.fret}
            color={color}
            label={noteName(dot.pitch, "sharp")}
            hot={active}
            radius={active ? 0.145 : 0.1}
          />
        );
      })}
      {sounding ? (
        <Marker
          string={sounding.string}
          fret={sounding.fret}
          color="#e07a45"
          label={noteName(pitchClass(sounding.string, sounding.fret), "sharp")}
          hot
          radius={0.145}
        />
      ) : null}
    </>
  );
}

function Marker({
  string,
  fret,
  color,
  label,
  hot,
  radius,
}: {
  string: number;
  fret: number;
  color: string;
  label: string;
  hot: boolean;
  radius: number;
}) {
  const x = -SPAN / 2 + string * STRING_GAP;
  const z = (fret + 0.5) * PITCH - Z_CENTER;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, TOP + 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hot ? 0.7 : 0.28}
          metalness={0.18}
          roughness={0.36}
        />
      </mesh>
      {hot ? (
        <mesh position={[0, TOP + 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius + 0.03, 0.012, 8, 24]} />
          <meshStandardMaterial color="#fff8ee" emissive="#fff8ee" emissiveIntensity={0.35} />
        </mesh>
      ) : null}
      <FaceText position={[0, LABEL_Y, 0]} size={hot ? 0.13 : 0.09} color="#24180f" outline={0}>
        {label}
      </FaceText>
    </group>
  );
}

function FretWire({ z }: { z: number }) {
  return (
    <group position={[0, TOP, z]}>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[WIDTH - 0.22, 0.02, 0.028]} />
        <meshStandardMaterial color="#8e959c" metalness={0.84} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, WIDTH - 0.22, 14]} />
        <meshStandardMaterial color="#f5f7f8" metalness={1} roughness={0.14} />
      </mesh>
    </group>
  );
}

function StringCourse({ index, x }: { index: number; x: number }) {
  const plain = index >= COUNT - 2;
  const radius = 0.014 + ((COUNT - 1 - index) / (COUNT - 1)) * 0.016;
  return (
    <mesh position={[x, TOP + 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, LENGTH - 0.28, 8]} />
      <meshStandardMaterial
        color={plain ? "#f3f5f7" : "#c9c0b0"}
        metalness={0.9}
        roughness={plain ? 0.2 : 0.36}
      />
    </mesh>
  );
}

function FaceText({
  position,
  children,
  size,
  color,
  outline = 0.08,
}: {
  position: [number, number, number];
  children: string;
  size: number;
  color: string;
  outline?: number;
}) {
  return (
    <group position={[position[0], LABEL_Y, position[2]]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      <Text
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={outline === 0 ? 0 : size * outline}
        outlineColor="#1a100c"
        characters={GLYPHS}
      >
        {children}
      </Text>
    </group>
  );
}

function FitBoards() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    const rotation = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(BOARD_ROTATION[0], BOARD_ROTATION[1], BOARD_ROTATION[2]),
    );
    const centers = [1.75, -1.75].map((offset) => STACK.clone().multiplyScalar(offset));
    const locals: Array<[number, number, number]> = [
      [-WIDTH / 2 - 0.28, 0.16, -LENGTH / 2],
      [WIDTH / 2 + 0.7, 0.22, -LENGTH / 2],
      [-WIDTH / 2 - 0.28, 0.16, LENGTH / 2],
      [WIDTH / 2 + 0.7, 0.22, LENGTH / 2],
    ];
    const points = centers.flatMap((center) =>
      locals.map((local) => new THREE.Vector3(...local).applyMatrix4(rotation).add(center)),
    );
    const target = new THREE.Vector3();
    camera.fov = 30;
    camera.aspect = size.width / Math.max(1, size.height);
    camera.updateProjectionMatrix();

    let distance = 12;
    for (let step = 0; step < 18; step += 1) {
      camera.position.copy(target).addScaledVector(LOOK, distance);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let maxNdc = 0;
      for (const point of points) {
        const projected = point.clone().project(camera);
        maxNdc = Math.max(maxNdc, Math.abs(projected.x), Math.abs(projected.y));
      }
      if (maxNdc === 0) break;
      const next = distance * (maxNdc / 0.88);
      if (Math.abs(next - distance) < 0.02) {
        distance = next;
        break;
      }
      distance = next;
    }
    camera.position.copy(target).addScaledVector(LOOK, distance);
    camera.lookAt(target);
  }, [camera, size.height, size.width]);

  return null;
}
