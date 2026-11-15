"use client";

import { OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { StageView } from "@/components/scene/FretboardScene";
import { BOARD_ROTATION } from "@/lib/fretboard/layout";
import { LESSON_DOT, pitchClass, type Grip, type Partner } from "@/lib/demo/song";
import { noteName, type Spelling } from "@/lib/theory";

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
const MIN_DISTANCE = 2.8;
const MAX_DISTANCE = 46;

type OrbitRig = {
  target: THREE.Vector3;
  update: () => void;
};

const SPAN = (COUNT - 1) * STRING_GAP;
const WIDTH = SPAN + 0.4;
/** Both lessons show six frets, so the boards keep one length. */
const LENGTH = 6 * PITCH + 0.34;

export type LessonLead = {
  string: number;
  fret: number;
  sounding: number;
  bend: number;
  outside: boolean;
  blue: boolean;
  partner: Partner | null;
};

export type ThrillSceneProps = {
  chordName: string;
  chordFrets: Grip;
  chordTones: readonly number[];
  bluesPitches: readonly number[];
  blueNote: number;
  spelling: Spelling;
  windowStart: number;
  windowEnd: number;
  leadKicker: string;
  leadTitle: string;
  leadSubtitle: string;
  lead: LessonLead | null;
  strum: boolean;
  viewRef: RefObject<StageView | null>;
};

function boardCenter(windowStart: number, windowEnd: number): number {
  const z0 = windowStart * PITCH - 0.2;
  const length = (windowEnd - windowStart + 1) * PITCH + 0.34;
  return z0 + length / 2;
}

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

function Lesson({
  chordName,
  chordFrets,
  chordTones,
  bluesPitches,
  blueNote,
  spelling,
  windowStart,
  windowEnd,
  leadKicker,
  leadTitle,
  leadSubtitle,
  lead,
  strum,
  viewRef,
}: ThrillSceneProps) {
  const tones = useMemo(() => new Set(chordTones), [chordTones]);
  const scale = useMemo(() => new Set(bluesPitches), [bluesPitches]);
  const zCenter = boardCenter(windowStart, windowEnd);
  const rhythmAt = STACK.clone().multiplyScalar(1.75);
  const leadAt = STACK.clone().multiplyScalar(-1.75);

  return (
    <>
      <ambientLight intensity={0.46} />
      <directionalLight position={[4, 8, 6]} intensity={2.4} color="#fff0d4" />
      <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#9eb4cc" />
      <OrbitControls
        makeDefault
        enableRotate={false}
        enablePan
        zoomToCursor
        screenSpacePanning
        enableDamping
        dampingFactor={0.12}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <FitBoards viewRef={viewRef} />
      <Neck
        position={rhythmAt}
        zCenter={zCenter}
        windowStart={windowStart}
        windowEnd={windowEnd}
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
              zCenter={zCenter}
              color={LESSON_DOT.chord}
              label={noteName(pitchClass(string, fret), spelling)}
              hot={strum}
              radius={0.13}
            />
          ),
        )}
      </Neck>
      <Neck
        position={leadAt}
        zCenter={zCenter}
        windowStart={windowStart}
        windowEnd={windowEnd}
        kicker={leadKicker}
        title={leadTitle}
        subtitle={leadSubtitle}
      >
        <ScaleDots
          tones={tones}
          scale={scale}
          blueNote={blueNote}
          spelling={spelling}
          windowStart={windowStart}
          windowEnd={windowEnd}
          zCenter={zCenter}
          lead={lead}
        />
      </Neck>
    </>
  );
}

function Neck({
  position,
  zCenter,
  windowStart,
  windowEnd,
  kicker,
  title,
  subtitle,
  children,
}: {
  position: THREE.Vector3;
  zCenter: number;
  windowStart: number;
  windowEnd: number;
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const localZ = (z: number) => z - zCenter;
  const stringX = (index: number) => -SPAN / 2 + index * STRING_GAP;
  const frets = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => windowStart + index);

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
      <mesh position={[0, -NECK_THICKNESS / 2 + 0.004, localZ(windowStart * PITCH - 0.18)]}>
        <boxGeometry args={[WIDTH + 0.004, NECK_THICKNESS, 0.02]} />
        <meshStandardMaterial color="#c6a15c" metalness={0.55} roughness={0.35} />
      </mesh>
      {frets.map((fret) => (
        <FretWire key={fret} z={localZ(fret * PITCH)} />
      ))}
      {Array.from({ length: COUNT }, (_, index) => (
        <StringCourse key={index} index={index} x={stringX(index)} />
      ))}
      {frets.map((fret) => (
        <FaceText
          key={`n-${fret}`}
          position={[-WIDTH / 2 - 0.08, LABEL_Y, localZ((fret + 0.5) * PITCH)]}
          size={0.11}
          color="#f6e7c3"
        >
          {String(fret)}
        </FaceText>
      ))}
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
  scale,
  blueNote,
  spelling,
  windowStart,
  windowEnd,
  zCenter,
  lead,
}: {
  tones: Set<number>;
  scale: Set<number>;
  blueNote: number;
  spelling: Spelling;
  windowStart: number;
  windowEnd: number;
  zCenter: number;
  lead: LessonLead | null;
}) {
  const dots: Array<{ string: number; fret: number; pitch: number }> = [];
  for (let string = 0; string < COUNT; string += 1) {
    for (let fret = windowStart; fret <= windowEnd; fret += 1) {
      const pitch = pitchClass(string, fret);
      if (scale.has(pitch)) dots.push({ string, fret, pitch });
    }
  }
  const fingerOnScale =
    lead !== null && dots.some((dot) => dot.string === lead.string && dot.fret === lead.fret);
  const partnerOnScale =
    lead?.partner != null &&
    dots.some((dot) => dot.string === lead.partner?.string && dot.fret === lead.partner?.fret);

  return (
    <>
      {dots.map((dot) => {
        const finger = lead?.string === dot.string && lead.fret === dot.fret;
        const partner = lead?.partner?.string === dot.string && lead.partner.fret === dot.fret;
        const hot = finger || partner;
        const pitch = finger && lead ? lead.sounding : dot.pitch;
        const color = markerColor(pitch, tones, blueNote, finger ? lead.outside : false);
        return (
          <Marker
            key={`${dot.string}-${dot.fret}`}
            string={dot.string}
            fret={dot.fret}
            zCenter={zCenter}
            color={color}
            label={noteName(pitch, spelling)}
            hot={hot}
            radius={hot ? 0.145 : 0.1}
          />
        );
      })}
      {lead && !fingerOnScale ? (
        <Marker
          string={lead.string}
          fret={lead.fret}
          zCenter={zCenter}
          color={markerColor(lead.sounding, tones, blueNote, lead.outside)}
          label={noteName(lead.sounding, spelling)}
          hot
          radius={0.145}
        />
      ) : null}
      {lead?.partner && !partnerOnScale ? (
        <Marker
          string={lead.partner.string}
          fret={lead.partner.fret}
          zCenter={zCenter}
          color={markerColor(pitchClass(lead.partner.string, lead.partner.fret), tones, blueNote, false)}
          label={noteName(pitchClass(lead.partner.string, lead.partner.fret), spelling)}
          hot
          radius={0.145}
        />
      ) : null}
    </>
  );
}

function markerColor(pitch: number, tones: Set<number>, blueNote: number, outside: boolean): string {
  if (outside) return LESSON_DOT.outside;
  if (tones.has(pitch)) return LESSON_DOT.chord;
  if (pitch === blueNote) return LESSON_DOT.blue;
  return LESSON_DOT.scale;
}

function Marker({
  string,
  fret,
  zCenter,
  color,
  label,
  hot,
  radius,
}: {
  string: number;
  fret: number;
  zCenter: number;
  color: string;
  label: string;
  hot: boolean;
  radius: number;
}) {
  const x = -SPAN / 2 + string * STRING_GAP;
  const z = (fret + 0.5) * PITCH - zCenter;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, TOP + 0.078, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius + 0.03, 24]} />
        <meshBasicMaterial color="#120c09" />
      </mesh>
      <mesh position={[0, TOP + 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial color={color} />
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

function FitBoards({ viewRef }: { viewRef: RefObject<StageView | null> }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const controls = useThree((state) => state.controls) as OrbitRig | null;
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const home = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const cursor = useRef<THREE.Vector2 | null>(null);

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
    camera.updateMatrixWorld();
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
    home.current = { position: camera.position.clone(), target: target.clone() };
  }, [camera, controls, size.height, size.width]);

  useEffect(() => {
    const dom = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      cursor.current = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };
    const onDown = () => {
      dom.style.cursor = "grabbing";
    };
    const onUp = () => {
      if (dom.style.cursor === "grabbing") dom.style.cursor = "grab";
    };
    dom.style.cursor = "grab";
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      dom.style.cursor = "";
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useEffect(() => {
    const orbit = controls;
    if (!orbit) return;
    viewRef.current = {
      pan(x, y) {
        const distance = camera.position.distanceTo(orbit.target);
        const scale = distance / 8;
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const shift = right.multiplyScalar(x * scale).add(up.multiplyScalar(y * scale));
        camera.position.add(shift);
        orbit.target.add(shift);
        orbit.update();
      },
      tilt() {},
      zoom(scale) {
        const offset = camera.position.clone().sub(orbit.target);
        const previous = offset.length();
        const next = THREE.MathUtils.clamp(previous * scale, MIN_DISTANCE, MAX_DISTANCE);
        const aim = cursor.current;
        if (!aim || next === previous) {
          offset.setLength(next);
          camera.position.copy(orbit.target).add(offset);
          orbit.update();
          return;
        }
        camera.updateMatrixWorld();
        const direction = new THREE.Vector3(aim.x, aim.y, 1).unproject(camera).sub(camera.position).normalize();
        camera.position.addScaledVector(direction, previous - next);
        camera.updateMatrixWorld();
        orbit.target
          .set(0, 0, -1)
          .transformDirection(camera.matrix)
          .multiplyScalar(next)
          .add(camera.position);
        orbit.update();
      },
      reset() {
        const saved = home.current;
        if (!saved) return;
        camera.position.copy(saved.position);
        orbit.target.copy(saved.target);
        orbit.update();
      },
    };
    return () => {
      viewRef.current = null;
    };
  }, [camera, controls, viewRef]);

  return null;
}
