import { useMemo } from "react";
import * as THREE from "three";

export type WoodKind = "neck" | "board";

const PALETTES: Record<WoodKind, { dark: number[]; mid: number[]; light: number[] }> = {
  neck: {
    dark: [62, 34, 18],
    mid: [138, 84, 46],
    light: [196, 142, 92],
  },
  board: {
    dark: [36, 18, 14],
    mid: [104, 54, 38],
    light: [156, 96, 70],
  },
};

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash(x: number, y: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 17.13) * 43758.5453);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function createWoodTextures(kind: WoodKind, seed: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 256;
  const palette = PALETTES[kind];
  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  roughCanvas.width = width;
  roughCanvas.height = height;
  const colorCtx = colorCanvas.getContext("2d");
  const roughCtx = roughCanvas.getContext("2d");
  if (!colorCtx || !roughCtx) throw new Error("Could not draw the wood grain");

  const color = colorCtx.createImageData(width, height);
  const rough = roughCtx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / width;
      const ny = y / height;
      const warp = Math.sin(ny * 16 + seed) * 0.035 + Math.sin(ny * 5.5 + nx * 3 + seed) * 0.02;
      const across = nx * 2.4 + warp + Math.sin(ny * 34) * 0.01;
      const rings = Math.sin(across * 58 + Math.sin(ny * 8 + seed) * 2.2);
      const growth = Math.sin(across * 18 + ny * 2.4);
      const fine = Math.sin((height - y) * 0.85 + across * 14);
      const pore = hash(Math.floor(x / 2), Math.floor(y / 2), seed);
      const vessel = Math.pow(Math.abs(Math.sin(across * 34 + Math.sin(ny * 4) * 1.6 + seed)), 22);
      let grain = 0.52 + rings * 0.26 + growth * 0.1 + fine * 0.05 + (pore - 0.5) * 0.08;
      grain -= vessel * 0.42;
      grain = Math.min(1, Math.max(0, grain));

      const midStop = grain < 0.5 ? grain / 0.5 : 1;
      const highStop = grain < 0.5 ? 0 : (grain - 0.5) / 0.5;
      const r =
        grain < 0.5
          ? mix(palette.dark[0], palette.mid[0], midStop)
          : mix(palette.mid[0], palette.light[0], highStop);
      const g =
        grain < 0.5
          ? mix(palette.dark[1], palette.mid[1], midStop)
          : mix(palette.mid[1], palette.light[1], highStop);
      const b =
        grain < 0.5
          ? mix(palette.dark[2], palette.mid[2], midStop)
          : mix(palette.mid[2], palette.light[2], highStop);

      const index = (y * width + x) * 4;
      color.data[index] = r;
      color.data[index + 1] = g;
      color.data[index + 2] = b;
      color.data[index + 3] = 255;

      const roughness = Math.min(255, Math.max(0, (0.78 - grain * 0.38 + vessel * 0.2) * 255));
      rough.data[index] = roughness;
      rough.data[index + 1] = roughness;
      rough.data[index + 2] = roughness;
      rough.data[index + 3] = 255;
    }
  }

  colorCtx.putImageData(color, 0, 0);
  roughCtx.putImageData(rough, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 8;
  roughnessMap.needsUpdate = true;

  return { map, roughnessMap };
}

const textureCache = new Map<WoodKind, ReturnType<typeof createWoodTextures>>();

export function useWoodTextures(kind: WoodKind) {
  return useMemo(() => {
    const cached = textureCache.get(kind);
    if (cached) return cached;
    const created = createWoodTextures(kind, kind === "neck" ? 2.4 : 5.1);
    textureCache.set(kind, created);
    return created;
  }, [kind]);
}
