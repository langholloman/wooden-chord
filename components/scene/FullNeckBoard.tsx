"use client";

import { Environment, Lightformer, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { StageView } from "@/components/scene/FretboardScene";
import { BOARD_ROTATION, DOUBLE_INLAYS, SINGLE_INLAYS } from "@/lib/fretboard/layout";
import {
  DEGREE_LABEL,
  ROLE_COLOR,
  chordRole,
  noteName,
  scaleDegree,
  type ChordQuality,
  type Spelling,
} from "@/lib/theory";

/** Frets drawn on the full neck. The highest position window ends at 17. */
const LAST_FRET = 17;
const FRET_PITCH = 0.52;
const STRING_GAP = 0.48;
const NECK_THICKNESS = 0.4;
const BOARD_THICKNESS = 0.024;
const TOP = BOARD_THICKNESS;
const LABEL_Y = TOP + 0.2;
const WOOD = "#1c100c";
const BOARD = "#6b4030";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#♯♭ ·-–—";

const LOOK = new THREE.Vector3(0, 0.5, 0.87).normalize();
const MIN_DISTANCE = 2.4;
const MAX_DISTANCE = 48;

type OrbitRig = {
  target: THREE.Vector3;
  update: () => void;
};

export type FullNeckBoardProps = {
  openPitchClasses: readonly number[];
  root: number;
  quality: ChordQuality;
  spelling: Spelling;
  rangeLow: number;
  rangeHigh: number;
  scaleIntervals: readonly number[] | null;
  showScaleLabels: boolean;
  grip: readonly number[];
  title: string;
  subtitle: string;
  viewRef: RefObject<StageView | null>;
};

export function FullNeckBoard(props: FullNeckBoardProps) {
  return (
    <Canvas
      camera={{ position: [0, 7, 12], fov: 30, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
      }}
    >
      <color attach="background" args={["#14110e"]} />
      <Suspense fallback={null}>
        <Neck {...props} />
      </Suspense>
    </Canvas>
  );
}

function Neck({
  openPitchClasses,
  root,
  quality,
  spelling,
  rangeLow,
  rangeHigh,
  scaleIntervals,
  showScaleLabels,
  grip,
  title,
  subtitle,
  viewRef,
}: FullNeckBoardProps) {
  const count = openPitchClasses.length;
  const span = (count - 1) * STRING_GAP;
  const width = span + 0.36;
  const z0 = -0.34;
  const z1 = LAST_FRET * FRET_PITCH + 0.2;
  const zCenter = (z0 + z1) / 2;
  const length = z1 - z0;
  const localZ = (z: number) => z - zCenter;
  const stringX = (index: number) => -span / 2 + index * STRING_GAP;
  const noteZ = (fret: number) => localZ((fret + 0.5) * FRET_PITCH);

  const shadows: Array<[number, number]> = [];
  if (rangeLow > 0) shadows.push([0, rangeLow - 1]);
  if (rangeHigh < LAST_FRET) shadows.push([rangeHigh + 1, LAST_FRET]);

  const scalePitches = scaleIntervals
    ? new Set(scaleIntervals.map((interval) => (root + interval) % 12))
    : null;

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 8, 6]} intensity={2.5} color="#fff0d4" />
      <directionalLight position={[-6, 3, -2]} intensity={0.5} color="#9eb4cc" />
      <spotLight
        position={[0, 9, 7]}
        angle={0.85}
        penumbra={0.8}
        intensity={40}
        color="#ffd7a8"
        distance={48}
      />
      <Environment frames={1} resolution={128}>
        <Lightformer form="rect" intensity={2.4} color="#ffe2c4" position={[0, 5, 3]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#8ea6c4" position={[-6, 1, -1]} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={0.55} color="#e7b27a" position={[6, 1.5, 1]} scale={[3, 5, 1]} />
      </Environment>
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
      <FitNeck length={length} width={width} viewRef={viewRef} />

      <group rotation={BOARD_ROTATION}>
        <RoundedBox
          args={[width, NECK_THICKNESS, length]}
          radius={0.12}
          smoothness={8}
          position={[0, -NECK_THICKNESS / 2, 0]}
        >
          <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0.03} />
        </RoundedBox>
        <RoundedBox
          args={[width - 0.16, BOARD_THICKNESS, length - 0.12]}
          radius={0.008}
          smoothness={3}
          position={[0, BOARD_THICKNESS / 2, 0]}
        >
          <meshStandardMaterial color={BOARD} roughness={0.64} metalness={0.02} />
        </RoundedBox>

        <group position={[0, TOP, localZ(0)]}>
          <mesh position={[0, 0.016, 0]}>
            <boxGeometry args={[width - 0.2, 0.032, 0.07]} />
            <meshStandardMaterial color="#e7dcc8" roughness={0.42} metalness={0.06} />
          </mesh>
          <mesh position={[0, 0.038, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.016, 0.016, width - 0.2, 18]} />
            <meshStandardMaterial color="#f7f1e6" roughness={0.28} metalness={0.12} />
          </mesh>
        </group>

        {Array.from({ length: LAST_FRET }, (_, index) => index + 1).map((fret) => (
          <FretWire key={fret} width={width} z={localZ(fret * FRET_PITCH)} />
        ))}

        {openPitchClasses.map((_, index) => (
          <StringCourse
            key={index}
            index={index}
            count={count}
            x={stringX(index)}
            zStart={localZ(0.06)}
            zEnd={localZ(LAST_FRET * FRET_PITCH + 0.08)}
          />
        ))}

        {Array.from({ length: LAST_FRET + 1 }, (_, fret) => fret).map((fret) => {
          if (fret <= 0 || (!SINGLE_INLAYS.has(fret) && !DOUBLE_INLAYS.has(fret))) return null;
          const z = noteZ(fret);
          const xs = DOUBLE_INLAYS.has(fret)
            ? [stringX(1.5), stringX(3.5)]
            : [stringX(2.5)];
          return xs.map((x) => (
            <mesh key={`${fret}-${x}`} position={[x, TOP + 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 24]} />
              <meshStandardMaterial
                color="#f6f1e6"
                emissive="#f6f1e6"
                emissiveIntensity={0.16}
                roughness={0.28}
                metalness={0.08}
              />
            </mesh>
          ));
        })}

        <Wash
          width={width - 0.2}
          zStart={localZ(rangeLow * FRET_PITCH)}
          zEnd={localZ((rangeHigh + 1) * FRET_PITCH)}
          color="#e4b15c"
          opacity={0.14}
          y={TOP + 0.006}
        />
        {shadows.map(([from, to]) => (
          <Wash
            key={`${from}-${to}`}
            width={width - 0.18}
            zStart={localZ(from * FRET_PITCH)}
            zEnd={localZ((to + 1) * FRET_PITCH)}
            color="#070504"
            opacity={0.55}
            y={TOP + 0.13}
          />
        ))}

        {openPitchClasses.map((open, stringIndex) =>
          Array.from({ length: LAST_FRET + 1 }, (_, fret) => {
            const pitch = (open + fret) % 12;
            const inRange = fret >= rangeLow && fret <= rangeHigh;
            const role = inRange ? chordRole(pitch, root, quality) : null;
            const inScale = Boolean(inRange && scalePitches?.has(pitch) && !role);
            const isGrip = inRange && grip[stringIndex] === fret;
            const degree =
              showScaleLabels && inRange && (role || inScale) ? DEGREE_LABEL[scaleDegree(pitch, root)] : null;
            return (
              <FretNote
                key={`${stringIndex}-${fret}`}
                x={stringX(stringIndex)}
                z={noteZ(fret)}
                note={noteName(pitch, spelling)}
                degree={degree}
                inRange={inRange}
                color={role ? ROLE_COLOR[role] : inScale ? "#f4efe4" : null}
                open={fret === 0}
                grip={isGrip}
              />
            );
          }),
        )}

        {openPitchClasses.map((open, index) => (
          <FaceText
            key={`name-${open}-${index}`}
            position={[stringX(index), LABEL_Y, localZ(-0.18)]}
            size={0.16}
            color="#f7f1e6"
          >
            {noteName(open, spelling)}
          </FaceText>
        ))}

        {Array.from({ length: LAST_FRET }, (_, index) => index + 1).map((fret) => {
          const inRange = fret >= rangeLow && fret <= rangeHigh;
          return (
            <FaceText
              key={`num-${fret}`}
              position={[-width / 2 - 0.1, LABEL_Y, noteZ(fret)]}
              size={inRange ? 0.14 : 0.1}
              color={inRange ? "#f6e7c3" : "#6a5e54"}
            >
              {String(fret)}
            </FaceText>
          );
        })}

        <FaceText position={[width / 2 + 0.42, LABEL_Y, 0]} size={0.24} color="#f7f1e6">
          {title}
        </FaceText>
        <FaceText position={[width / 2 + 0.14, LABEL_Y, 0]} size={0.13} color="#e4b15c">
          {subtitle}
        </FaceText>
      </group>
    </>
  );
}

function FitNeck({
  length,
  width,
  viewRef,
}: {
  length: number;
  width: number;
  viewRef: RefObject<StageView | null>;
}) {
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
    const locals: Array<[number, number, number]> = [
      [-width / 2 - 0.34, 0.2, -length / 2],
      [width / 2 + 0.72, 0.24, -length / 2],
      [-width / 2 - 0.34, 0.2, length / 2],
      [width / 2 + 0.72, 0.24, length / 2],
    ];
    const points = locals.map((point) => new THREE.Vector3(...point).applyMatrix4(rotation));
    const target = new THREE.Vector3(0.12, 0, 0).applyMatrix4(rotation);
    camera.fov = 30;
    camera.aspect = size.width / Math.max(1, size.height);
    camera.updateProjectionMatrix();

    let distance = 10;
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
      const next = distance * (maxNdc / 0.9);
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
  }, [camera, controls, length, size.height, size.width, width]);

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
        if (!aim || !(camera instanceof THREE.PerspectiveCamera) || next === previous) {
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

function FretWire({ width, z }: { width: number; z: number }) {
  return (
    <group position={[0, TOP, z]}>
      <mesh position={[0, 0.004, 0.012]}>
        <boxGeometry args={[width - 0.2, 0.006, 0.012]} />
        <meshStandardMaterial color="#120c09" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.016, 0]}>
        <boxGeometry args={[width - 0.2, 0.028, 0.032]} />
        <meshStandardMaterial color="#8e959c" metalness={0.84} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.038, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, width - 0.2, 16]} />
        <meshStandardMaterial color="#f5f7f8" metalness={1} roughness={0.12} />
      </mesh>
    </group>
  );
}

function StringCourse({
  index,
  count,
  x,
  zStart,
  zEnd,
}: {
  index: number;
  count: number;
  x: number;
  zStart: number;
  zEnd: number;
}) {
  const plain = index >= count - 2;
  const radius = 0.016 + ((count - 1 - index) / Math.max(1, count - 1)) * 0.018;
  const length = Math.max(0.05, zEnd - zStart);
  return (
    <mesh position={[x, TOP + 0.07, (zStart + zEnd) / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial
        color={plain ? "#f3f5f7" : "#c9c0b0"}
        metalness={0.9}
        roughness={plain ? 0.2 : 0.36}
      />
    </mesh>
  );
}

function Wash({
  width,
  zStart,
  zEnd,
  color,
  opacity,
  y,
}: {
  width: number;
  zStart: number;
  zEnd: number;
  color: string;
  opacity: number;
  y: number;
}) {
  const length = Math.max(0.02, zEnd - zStart);
  return (
    <mesh position={[0, y, (zStart + zEnd) / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[width, length]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function FretNote({
  x,
  z,
  note,
  degree,
  inRange,
  color,
  open,
  grip,
}: {
  x: number;
  z: number;
  note: string;
  degree: string | null;
  inRange: boolean;
  color: string | null;
  open: boolean;
  grip: boolean;
}) {
  const label = degree ? `${note} ${degree}` : note;
  const radius = grip ? 0.175 : 0.15;
  return (
    <group position={[x, 0, z]}>
      {color && open ? (
        <mesh position={[0, TOP + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.016, 12, 28]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} metalness={0.35} roughness={0.32} />
        </mesh>
      ) : null}
      {color && !open ? (
        <group>
          <mesh position={[0, TOP + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 28]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.38} metalness={0.2} roughness={0.34} />
          </mesh>
          <mesh position={[0, TOP + 0.07, 0]}>
            <cylinderGeometry args={[radius * 0.92, radius * 0.92, 0.045, 20]} />
            <meshStandardMaterial color="#4a2618" roughness={0.6} />
          </mesh>
          {grip ? (
            <mesh position={[0, TOP + 0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius + 0.02, 0.01, 10, 28]} />
              <meshStandardMaterial color="#f7f1e6" emissive="#f7f1e6" emissiveIntensity={0.2} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      <FaceText
        position={[0, LABEL_Y, 0]}
        size={inRange ? (degree ? 0.13 : 0.2) : 0.16}
        color={color ? "#24180f" : inRange ? "#fff8ee" : "#efe6da"}
        outline={color ? 0 : 0.14}
      >
        {label}
      </FaceText>
    </group>
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
        renderOrder={4}
        characters={GLYPHS}
      >
        {children}
      </Text>
    </group>
  );
}
