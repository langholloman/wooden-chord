"use client";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { Object3D } from "three";
import {
  BOARD_ROTATION,
  CENTER_TRANSFORM,
  positionWindow,
  satelliteTransform,
} from "@/lib/fretboard/layout";
import {
  ROLE_COLOR,
  chordName,
  fretPlace,
  noteName,
  stringName,
  voiceChord,
  type ChordQuality,
  type Instrument,
  type ScaleDefinition,
  type Spelling,
  type Voicing,
} from "@/lib/theory";
import { Fretboard } from "./Fretboard";

const HOME_POSITION: [number, number, number] = [0, 4.4, 7.4];
const HOME_TARGET: [number, number, number] = [0, -0.12, 0];
const MIN_DISTANCE = 2.2;
const MAX_DISTANCE = 16;
const MIN_POLAR = 0.28;
const MAX_POLAR = 1.4;

export type StageView = {
  pan: (x: number, y: number) => void;
  tilt: (delta: number) => void;
  zoom: (scale: number) => void;
  reset: () => void;
};

type OrbitRig = {
  target: THREE.Vector3;
  update: () => void;
};

type Wire = {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
};

type FretboardSceneProps = {
  instrument: Instrument;
  root: number;
  quality: ChordQuality;
  scale: ScaleDefinition | null;
  showScaleLabels: boolean;
  spelling: Spelling;
  fretStart: number;
  hovered: number | null;
  onHover: (index: number | null) => void;
  showBreakouts: boolean;
  viewRef: RefObject<StageView | null>;
};

export function FretboardScene({
  instrument,
  root,
  quality,
  scale,
  showScaleLabels,
  spelling,
  fretStart,
  hovered,
  onHover,
  showBreakouts,
  viewRef,
}: FretboardSceneProps) {
  return (
    <Canvas
      camera={{ position: HOME_POSITION, fov: 42, near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#14110e"]} />
      <Suspense fallback={null}>
        <Stage
          key={`${instrument.id}:${root}:${quality}:${fretStart}`}
          instrument={instrument}
          root={root}
          quality={quality}
          scale={scale}
          showScaleLabels={showScaleLabels}
          spelling={spelling}
          fretStart={fretStart}
          hovered={hovered}
          onHover={onHover}
          showBreakouts={showBreakouts}
          viewRef={viewRef}
        />
      </Suspense>
    </Canvas>
  );
}

function Stage({
  instrument,
  root,
  quality,
  scale,
  showScaleLabels,
  spelling,
  fretStart,
  hovered,
  onHover,
  showBreakouts,
  viewRef,
}: FretboardSceneProps) {
  const { camera, gl, controls } = useThree();
  const center = useMemo(
    () => voiceChord(instrument, root, quality, fretStart),
    [instrument, root, quality, fretStart],
  );
  const neckWindow = useMemo(() => positionWindow(fretStart), [fretStart]);
  const satellites = useMemo(
    () => center.pitchClasses.map((pitch) => voiceChord(instrument, pitch, quality, fretStart)),
    [center, instrument, quality, fretStart],
  );
  const [places, setPlaces] = useState<[number, number, number][]>(() =>
    satellites.map((_, index) => satelliteTransform(index, satellites.length).position),
  );
  const centerPegs = useRef<(Object3D | null)[]>([]);
  const satelliteAnchors = useRef<(Object3D | null)[]>([]);
  const drag = useRef<{ index: number; offset: THREE.Vector3 } | null>(null);
  const cursor = useRef<THREE.Vector2 | null>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [dragging, setDragging] = useState(false);
  const placeKey = places.map((place) => place.map((value) => value.toFixed(3)).join(",")).join("|");

  useEffect(() => {
    const orbit = controls as OrbitRig | null;
    if (!orbit) return;
    viewRef.current = {
      pan(x, y) {
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const shift = right.multiplyScalar(x).add(up.multiplyScalar(y));
        camera.position.add(shift);
        orbit.target.add(shift);
        orbit.update();
      },
      tilt(delta) {
        const offset = camera.position.clone().sub(orbit.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + delta, MIN_POLAR, MAX_POLAR);
        offset.setFromSpherical(spherical);
        camera.position.copy(orbit.target).add(offset);
        orbit.update();
      },
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
        orbit.target.set(0, 0, -1).transformDirection(camera.matrix).multiplyScalar(next).add(camera.position);
        orbit.update();
      },
      reset() {
        camera.position.set(...HOME_POSITION);
        orbit.target.set(...HOME_TARGET);
        orbit.update();
      },
    };
    return () => {
      viewRef.current = null;
    };
  }, [camera, controls, viewRef]);

  useEffect(() => {
    const dom = gl.domElement;
    const tilt = BOARD_ROTATION[0];
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)),
      new THREE.Vector3(...CENTER_TRANSFORM.position),
    );
    const onMove = (event: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      cursor.current = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const current = drag.current;
      if (!current) return;
      const ndc = cursor.current ?? new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      dom.style.cursor = "grabbing";
      const x = hit.x + current.offset.x;
      const y = hit.y + current.offset.y;
      const z = hit.z + current.offset.z;
      setPlaces((previous) => {
        const next = previous.slice();
        next[current.index] = [x, y, z];
        return next;
      });
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      setDragging(false);
      const orbit = controls as { enabled?: boolean } | null;
      if (orbit) orbit.enabled = true;
      if (dom.style.cursor === "grabbing") dom.style.cursor = "";
    };
    dom.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, controls, gl]);

  const beginDrag = (index: number, event: ThreeEvent<PointerEvent>) => {
    const tilt = BOARD_ROTATION[0];
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)),
      new THREE.Vector3(...CENTER_TRANSFORM.position),
    );
    const hit = new THREE.Vector3();
    if (!event.ray.intersectPlane(plane, hit)) return;
    const place = places[index];
    drag.current = {
      index,
      offset: new THREE.Vector3(place[0] - hit.x, place[1] - hit.y, place[2] - hit.z),
    };
    setDragging(true);
    const orbit = controls as { enabled?: boolean } | null;
    if (orbit) orbit.enabled = false;
    gl.domElement.style.cursor = "grabbing";
  };

  useEffect(() => {
    if (!showBreakouts) {
      setWires([]);
      return;
    }
    let frame = 0;
    let tries = 0;
    const measure = () => {
      tries += 1;
      const next: Wire[] = [];
      for (let index = 0; index < center.frets.length; index += 1) {
        const startNode = centerPegs.current[index];
        const endNode = satelliteAnchors.current[index];
        if (!startNode || !endNode) {
          if (tries < 12) frame = requestAnimationFrame(measure);
          return;
        }
        startNode.updateWorldMatrix(true, false);
        endNode.updateWorldMatrix(true, false);
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();
        startNode.getWorldPosition(start);
        endNode.getWorldPosition(end);
        next.push({
          start: [start.x, start.y, start.z],
          end: [end.x, end.y, end.z],
          color: ROLE_COLOR[center.roles[index]],
        });
      }
      setWires(next);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [center, placeKey, showBreakouts]);

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight position={[3.5, 7, 5]} intensity={2.4} color="#fff0d4" />
      <directionalLight position={[-5, 2.5, -2]} intensity={0.45} color="#9eb4cc" />
      <spotLight
        position={[0, 5.5, 3.5]}
        angle={0.55}
        penumbra={0.85}
        intensity={18}
        color="#ffd7a8"
        distance={18}
      />
      <Environment frames={1} resolution={128}>
        <Lightformer form="rect" intensity={2.4} color="#ffe2c4" position={[0, 4, 2]} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#8ea6c4" position={[-4, 1, -1]} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={0.55} color="#e7b27a" position={[4, 1.5, 1]} scale={[2, 4, 1]} />
      </Environment>

      <Fretboard
        instrument={instrument}
        voicing={center}
        transform={CENTER_TRANSFORM}
        title={chordName(root, quality, spelling)}
        subtitle={
          scale
            ? `${scale.name} on the center neck`
            : showBreakouts
              ? "Each string breaks out"
              : "Center chord"
        }
        spelling={spelling}
        compact={false}
        showFretNumbers
        scaleIntervals={scale?.intervals ?? null}
        showScaleLabels={showScaleLabels}
        chordRoot={root}
        highlightIndex={hovered}
        linkIndex={null}
        neckWindow={neckWindow}
        onHoverIndex={onHover}
        onPegMount={(stringIndex, node) => {
          centerPegs.current[stringIndex] = node;
        }}
      />

      {showBreakouts && satellites.map((voicing, index) => (
        <Satellite
          key={`${center.pitchClasses[index]}-${index}`}
          instrument={instrument}
          voicing={voicing}
          index={index}
          count={satellites.length}
          position={places[index]}
          centerFret={center.frets[index]}
          centerPitch={center.pitchClasses[index]}
          quality={quality}
          spelling={spelling}
          hovered={hovered}
          neckWindow={neckWindow}
          onHover={onHover}
          onDragStart={(event) => beginDrag(index, event)}
          onAnchorMount={(node) => {
            satelliteAnchors.current[index] = node;
          }}
        />
      ))}

      {showBreakouts && wires.map((wire, index) => (
        <BrassWire
          key={index}
          start={wire.start}
          end={wire.end}
          color={wire.color}
          hot={hovered === index}
          dim={hovered !== null && hovered !== index}
        />
      ))}

      <OrbitControls
        makeDefault
        enabled={!dragging}
        enablePan
        zoomToCursor
        screenSpacePanning
        enableDamping
        dampingFactor={0.08}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        minPolarAngle={MIN_POLAR}
        maxPolarAngle={MAX_POLAR}
        target={HOME_TARGET}
      />
    </>
  );
}

function Satellite({
  instrument,
  voicing,
  index,
  count,
  position,
  centerFret,
  centerPitch,
  quality,
  spelling,
  hovered,
  neckWindow,
  onHover,
  onDragStart,
  onAnchorMount,
}: {
  instrument: Instrument;
  voicing: Voicing;
  index: number;
  count: number;
  position: [number, number, number];
  centerFret: number;
  centerPitch: number;
  quality: ChordQuality;
  spelling: Spelling;
  hovered: number | null;
  neckWindow: ReturnType<typeof positionWindow>;
  onHover: (index: number | null) => void;
  onDragStart: (event: ThreeEvent<PointerEvent>) => void;
  onAnchorMount: (node: Object3D | null) => void;
}) {
  const anchorString = Math.max(0, voicing.roles.indexOf("R"));
  const place = fretPlace(centerFret, noteName(centerPitch, spelling));
  const home = satelliteTransform(index, count);
  return (
    <Fretboard
      instrument={instrument}
      voicing={voicing}
      transform={{ position, rotation: home.rotation, scale: home.scale }}
      title={chordName(centerPitch, quality, spelling)}
      subtitle={`${stringName(index, count)} · ${place}`}
      spelling={spelling}
      compact
      showFretNumbers={false}
      scaleIntervals={null}
      showScaleLabels={false}
      chordRoot={centerPitch}
      highlightIndex={hovered}
      linkIndex={index}
      neckWindow={neckWindow}
      draggable
      onPointerDown={onDragStart}
      onHoverIndex={onHover}
      onPegMount={(stringIndex, node) => {
        if (stringIndex === anchorString) onAnchorMount(node);
      }}
    />
  );
}

function BrassWire({
  start,
  end,
  color,
  hot,
  dim,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  hot: boolean;
  dim: boolean;
}) {
  const tubes = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += hot ? 0.78 : 0.52;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const jacket = new THREE.TubeGeometry(curve, 40, hot ? 0.02 : 0.012, 8, false);
    const glow = new THREE.TubeGeometry(curve, 40, hot ? 0.05 : 0.032, 8, false);
    return { jacket, glow };
  }, [start, end, hot]);

  useEffect(() => {
    return () => {
      tubes.jacket.dispose();
      tubes.glow.dispose();
    };
  }, [tubes]);

  return (
    <group>
      <mesh geometry={tubes.glow} renderOrder={2} raycast={() => null}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={dim ? 0.04 : hot ? 0.55 : 0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={tubes.jacket} renderOrder={3} raycast={() => null}>
        <meshBasicMaterial color={color} transparent opacity={dim ? 0.2 : 1} depthWrite toneMapped={false} />
      </mesh>
    </group>
  );
}
