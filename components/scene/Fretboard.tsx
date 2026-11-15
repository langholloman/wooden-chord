"use client";

import { RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import type { Object3D } from "three";
import {
  DOUBLE_INLAYS,
  SINGLE_INLAYS,
  type BoardMetrics,
  type BoardTransform,
  type NeckWindow,
  boardMetrics,
  fingerZ,
  fretWireZ,
  spaceCenterZ,
  stringX,
  toLocalZ,
  viewWindow,
} from "@/lib/fretboard/layout";
import {
  DEGREE_LABEL,
  ROLE_COLOR,
  SCALE_TONE_COLOR,
  noteName,
  scaleDegree,
  scaleMarkers,
  type Instrument,
  type Spelling,
  type Voicing,
} from "@/lib/theory";

const NECK_THICKNESS = 0.3;
const BOARD_THICKNESS = 0.02;
const TOP = BOARD_THICKNESS;
/** Every glyph shares this height, so the lettering lies on one plane with the necks. */
const LABEL_Y = TOP + 0.13;
const WOOD = "#1c100c";
const BOARD = "#6b4030";
const GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#♯♭ ·-–—";

type FretboardProps = {
  instrument: Instrument;
  voicing: Voicing;
  transform: BoardTransform;
  title: string;
  subtitle: string;
  spelling: Spelling;
  compact: boolean;
  showFretNumbers: boolean;
  scaleIntervals: readonly number[] | null;
  showScaleLabels: boolean;
  chordRoot: number;
  highlightIndex: number | null;
  /** When set, the whole neck belongs to one breakout line. */
  linkIndex: number | null;
  /** Shared with the root so every panel opens on the same frets. */
  neckWindow?: NeckWindow;
  draggable?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onHoverIndex: (index: number | null) => void;
  onPegMount: (stringIndex: number, node: Object3D | null) => void;
};

export function Fretboard({
  instrument,
  voicing,
  transform,
  title,
  subtitle,
  spelling,
  compact,
  showFretNumbers,
  scaleIntervals,
  showScaleLabels,
  chordRoot,
  highlightIndex,
  linkIndex,
  neckWindow,
  draggable = false,
  onPointerDown,
  onHoverIndex,
  onPegMount,
}: FretboardProps) {
  const gl = useThree((state) => state.gl);
  const stringCount = instrument.openPitchClasses.length;
  const window = neckWindow ?? viewWindow(voicing.frets);
  const metrics = useMemo(
    () => boardMetrics(window.windowStart, stringCount),
    [window.windowStart, stringCount],
  );
  const markers = useMemo(() => {
    if (!scaleIntervals) return [];
    return scaleMarkers(
      instrument,
      voicing,
      metrics.playableFrets,
      chordRoot,
      scaleIntervals,
    );
  }, [scaleIntervals, instrument, voicing, metrics.playableFrets, chordRoot]);

  const fretWires = useMemo(() => {
    const wires: number[] = [];
    for (let fret = metrics.wireStart; fret <= metrics.wireEnd; fret += 1) {
      if (fret > 0) wires.push(fret);
    }
    return wires;
  }, [metrics.wireEnd, metrics.wireStart]);

  return (
    <group
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      onPointerDown={
        draggable
          ? (event) => {
              event.stopPropagation();
              event.nativeEvent.stopPropagation();
              onPointerDown?.(event);
            }
          : undefined
      }
      onPointerOver={
        draggable
          ? (event) => {
              event.stopPropagation();
              gl.domElement.style.cursor = "grab";
            }
          : undefined
      }
      onPointerOut={
        draggable
          ? () => {
              if (gl.domElement.style.cursor === "grab") gl.domElement.style.cursor = "";
            }
          : undefined
      }
    >
      <RoundedBox
        args={[metrics.width, NECK_THICKNESS, metrics.length]}
        radius={0.12}
        smoothness={8}
        position={[0, -NECK_THICKNESS / 2, 0]}
      >
        <meshStandardMaterial color={WOOD} roughness={0.74} metalness={0.03} />
      </RoundedBox>

      <RoundedBox
        args={[metrics.width - 0.3, BOARD_THICKNESS, metrics.length - 0.3]}
        radius={0.008}
        smoothness={3}
        position={[0, BOARD_THICKNESS / 2, 0]}
      >
        <meshStandardMaterial color={BOARD} roughness={0.64} metalness={0.02} />
      </RoundedBox>

      {window.windowStart === 0 ? (
        <group position={[0, TOP, toLocalZ(0, metrics)]}>
          <mesh position={[0, 0.014, 0]}>
            <boxGeometry args={[metrics.width - 0.26, 0.028, 0.056]} />
            <meshStandardMaterial color="#e7dcc8" roughness={0.42} metalness={0.06} />
          </mesh>
          <mesh position={[0, 0.034, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, metrics.width - 0.26, 18]} />
            <meshStandardMaterial color="#f7f1e6" roughness={0.28} metalness={0.12} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, -NECK_THICKNESS / 2 + 0.004, -metrics.length / 2 + 0.004]}>
          <boxGeometry args={[metrics.width + 0.004, NECK_THICKNESS, 0.012]} />
          <meshStandardMaterial color="#c6a15c" metalness={0.55} roughness={0.35} />
        </mesh>
      )}

      {fretWires.map((fret) => (
        <group key={fret} position={[0, TOP, toLocalZ(fretWireZ(fret), metrics)]}>
          <mesh position={[0, 0.003, 0.014]}>
            <boxGeometry args={[metrics.width - 0.28, 0.006, 0.012]} />
            <meshStandardMaterial color="#120c09" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[metrics.width - 0.28, 0.02, 0.03]} />
            <meshStandardMaterial color="#8e959c" metalness={0.84} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.026, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.013, 0.013, metrics.width - 0.28, 18]} />
            <meshStandardMaterial color="#f5f7f8" metalness={1} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {instrument.openPitchClasses.map((_, index) => (
        <StringCourse key={index} index={index} metrics={metrics} open={window.windowStart === 0} />
      ))}

      {metrics.playableFrets.map((fret) => {
        if (fret <= 0 || (!SINGLE_INLAYS.has(fret) && !DOUBLE_INLAYS.has(fret))) return null;
        const z = spaceCenterZ(fret, metrics);
        const xs = DOUBLE_INLAYS.has(fret) ? [-0.12, 0.12] : [0];
        return xs.map((x) => (
          <group key={`${fret}-${x}`}>
            <mesh position={[x, TOP + 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.046, 28]} />
              <meshStandardMaterial color="#f6f1e6" emissive="#f6f1e6" emissiveIntensity={0.18} roughness={0.28} metalness={0.08} />
            </mesh>
            <mesh position={[-metrics.width / 2 + 0.012, -NECK_THICKNESS * 0.42, z]}>
              <sphereGeometry args={[0.022, 16, 16]} />
              <meshStandardMaterial color="#f3ead8" emissive="#f3ead8" emissiveIntensity={0.12} roughness={0.35} />
            </mesh>
          </group>
        ));
      })}

      {voicing.frets.map((fret, stringIndex) => {
        const ownsLine = linkIndex ?? stringIndex;
        const hot = highlightIndex === ownsLine;
        const dim = highlightIndex !== null && !hot;
        return (
          <ChordPeg
            key={stringIndex}
            stringIndex={stringIndex}
            fret={fret}
            note={noteName(voicing.pitchClasses[stringIndex], spelling)}
            color={ROLE_COLOR[voicing.roles[stringIndex]]}
            degree={
              scaleIntervals
                ? DEGREE_LABEL[scaleDegree(voicing.pitchClasses[stringIndex], chordRoot)]
                : null
            }
            hot={hot}
            dim={dim}
            compact={compact}
            metrics={metrics}
            onHover={(event, active) => {
              event.stopPropagation();
              onHoverIndex(active ? ownsLine : null);
            }}
            onMount={(node) => onPegMount(stringIndex, node)}
          />
        );
      })}

      {markers.map((marker) => (
        <ScaleDot
          key={`${marker.stringIndex}-${marker.fret}`}
          x={stringX(marker.stringIndex, stringCount)}
          z={fingerZ(marker.fret, metrics)}
          note={noteName(marker.pitchClass, spelling)}
          degree={DEGREE_LABEL[marker.degree]}
          root={marker.degree === 0}
          showLabel={showScaleLabels}
          stagger={marker.stringIndex % 2 === 0 ? -0.14 : 0.14}
        />
      ))}

      <FaceText
        position={[metrics.width / 2 + (compact ? 0.28 : 0.22), LABEL_Y, 0]}
        size={compact ? 0.22 : 0.17}
        color="#f7f1e6"
      >
        {title}
      </FaceText>
      <FaceText
        position={[metrics.width / 2 + (compact ? 0.08 : 0.05), LABEL_Y, 0]}
        size={compact ? 0.13 : 0.1}
        color="#e4b15c"
      >
        {subtitle}
      </FaceText>
      <FaceText
        position={[-metrics.width / 2 - 0.22, LABEL_Y, -metrics.length / 2 + 0.02]}
        size={compact ? 0.07 : 0.048}
        color="#2a1c10"
        plate
      >
        {window.label}
      </FaceText>

      {showFretNumbers &&
        metrics.playableFrets.map((fret) =>
          fret === 0 ? null : (
            <FaceText
              key={fret}
              position={[-metrics.width / 2 - 0.16, LABEL_Y, spaceCenterZ(fret, metrics)]}
              size={0.08}
              color="#f6e7c3"
              inlay
            >
              {String(fret)}
            </FaceText>
          ),
        )}
    </group>
  );
}

function StringCourse({
  index,
  metrics,
  open,
}: {
  index: number;
  metrics: BoardMetrics;
  open: boolean;
}) {
  const count = metrics.stringCount;
  const plain = index >= count - 2;
  const radius = 0.014 + ((count - 1 - index) / Math.max(1, count - 1)) * 0.01;
  const zStart = open ? toLocalZ(0.02, metrics) : -metrics.length / 2 + 0.03;
  const zEnd = metrics.length / 2 - 0.03;
  const length = Math.max(0.05, zEnd - zStart);
  return (
    <mesh position={[stringX(index, count), TOP + 0.056, (zStart + zEnd) / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial
        color={plain ? "#f3f5f7" : "#c9c0b0"}
        metalness={0.88}
        roughness={plain ? 0.22 : 0.38}
      />
    </mesh>
  );
}

function ChordPeg({
  stringIndex,
  fret,
  note,
  color,
  degree,
  hot,
  dim,
  compact,
  metrics,
  onHover,
  onMount,
}: {
  stringIndex: number;
  fret: number;
  note: string;
  color: string;
  degree: string | null;
  hot: boolean;
  dim: boolean;
  compact: boolean;
  metrics: BoardMetrics;
  onHover: (event: ThreeEvent<PointerEvent>, active: boolean) => void;
  onMount: (node: Object3D | null) => void;
}) {
  const x = stringX(stringIndex, metrics.stringCount);
  const z = fingerZ(fret, metrics);
  return (
    <group position={[x, 0, z]}>
      {fret === 0 ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, TOP + 0.086, 0]}>
          <torusGeometry args={[0.068, 0.02, 14, 36]} />
          <meshBasicMaterial color={color} transparent={dim} opacity={dim ? 0.35 : 1} />
        </mesh>
      ) : (
        <group>
          <mesh position={[0, TOP + 0.084, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.09, 32]} />
            <meshBasicMaterial color="#120c09" />
          </mesh>
          <mesh position={[0, TOP + 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.072, 32]} />
            <meshBasicMaterial color={color} transparent={dim} opacity={dim ? 0.35 : 1} />
          </mesh>
          <mesh position={[0, TOP + 0.062, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 20]} />
            <meshStandardMaterial color="#4a2618" roughness={0.6} />
          </mesh>
        </group>
      )}
      <mesh
        ref={onMount}
        position={[0, TOP + 0.08, 0]}
        onPointerOver={(event) => onHover(event, true)}
        onPointerOut={(event) => onHover(event, false)}
      >
        <cylinderGeometry args={[0.07, 0.07, 0.14, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <FaceText
        position={[
          0,
          LABEL_Y,
          fret === 0 ? 0.22 + (stringIndex % 2) * 0.36 : stringIndex % 2 === 0 ? -0.12 : 0.14,
        ]}
        size={compact ? 0.13 : 0.1}
        color={color}
        inlay
      >
        {degree ? `${note} ${degree}` : note}
      </FaceText>
    </group>
  );
}

function FaceText({
  position,
  children,
  size,
  color,
  plate = false,
  inlay = false,
}: {
  position: [number, number, number];
  children: string;
  size: number;
  color: string;
  plate?: boolean;
  inlay?: boolean;
}) {
  const width = Math.max(size * 3.2, children.length * size * 0.58);
  return (
    <group position={[position[0], LABEL_Y, position[2]]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      {plate ? (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width, size * 1.7]} />
          <meshStandardMaterial color="#e0b15c" metalness={0.35} roughness={0.38} />
        </mesh>
      ) : null}
      <Text
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={plate ? 0 : inlay ? size * 0.1 : size * 0.045}
        outlineColor="#1a100c"
        characters={GLYPHS}
      >
        {children}
      </Text>
    </group>
  );
}

function ScaleDot({
  x,
  z,
  note,
  degree,
  root,
  showLabel,
  stagger,
}: {
  x: number;
  z: number;
  note: string;
  degree: string;
  root: boolean;
  showLabel: boolean;
  stagger: number;
}) {
  const color = root ? ROLE_COLOR.R : SCALE_TONE_COLOR;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, TOP + 0.078, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.062, 28]} />
        <meshBasicMaterial color="#120c09" />
      </mesh>
      <mesh position={[0, TOP + 0.086, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.048, 28]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {showLabel ? (
        <FaceText position={[0, LABEL_Y, stagger]} size={0.11} color={color} inlay>
          {`${note} ${degree}`}
        </FaceText>
      ) : null}
    </group>
  );
}
