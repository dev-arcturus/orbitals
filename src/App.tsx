import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import init, { compute_orbital_duotone } from "./wasm_pkg/quantum_core";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import isosurfaceGenerator from 'isosurface-generator';
import ndarray from 'ndarray';
import colormap from 'colormap';
import "./App.css";
import { SettingsPanel, SettingsGearButton, PlaneToggleButton } from './SettingsPanel';
import { VerticalSlider } from './VerticalSlider';
import { LOrbitalTabs, MOrbitalTabs } from './OrbitalTabs';
import { FaCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_N = 1;
const MAX_N = 7;
const MIN_GRID = 24;
const MAX_GRID = 100;
const AXIS_LENGTH = 1000;

function addAxesAndGrid(scene: THREE.Scene) {
  // Remove old axes if any
  const oldAxes = scene.getObjectByName("axes");
  if (oldAxes) scene.remove(oldAxes);
  const axes = new THREE.Group();
  axes.name = "axes";
  // X, Y, Z axes (gray, long)
  const axisMat = new THREE.LineBasicMaterial({ color: 0x888888 });
  axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-AXIS_LENGTH, 0, 0), new THREE.Vector3(AXIS_LENGTH, 0, 0)
  ]), axisMat));
  axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -AXIS_LENGTH, 0), new THREE.Vector3(0, AXIS_LENGTH, 0)
  ]), axisMat));
  axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -AXIS_LENGTH), new THREE.Vector3(0, 0, AXIS_LENGTH)
  ]), axisMat));
  // Gridlines (faint, every 2 units)
  const gridMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
  for (let i = -10; i <= 10; i++) {
    if (i !== 0) {
      // XY
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 2, -20, 0), new THREE.Vector3(i * 2, 20, 0)
      ]), gridMat));
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-20, i * 2, 0), new THREE.Vector3(20, i * 2, 0)
      ]), gridMat));
      // XZ
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 2, 0, -20), new THREE.Vector3(i * 2, 0, 20)
      ]), gridMat));
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-20, 0, i * 2), new THREE.Vector3(20, 0, i * 2)
      ]), gridMat));
      // YZ
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, i * 2, -20), new THREE.Vector3(0, i * 2, 20)
      ]), gridMat));
      axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -20, i * 2), new THREE.Vector3(0, 20, i * 2)
      ]), gridMat));
    }
  }
  // Labels
  const loader = new FontLoader();
  loader.load('https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json', (font: any) => {
    const mkLabel = (text: string, pos: [number, number, number]) => {
      const textGeom = new TextGeometry(text, {
        font,
        size: 0.7,
        height: 0.05,
      });
      const textMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(textGeom, textMat);
      mesh.position.set(...pos);
      axes.add(mesh);
    };
    mkLabel('x', [20, 0, 0]);
    mkLabel('y', [0, 20, 0]);
    mkLabel('z', [0, 0, 20]);
  });
  scene.add(axes);
}

function duotoneColor(val: number, maxAbs: number) {
  // Vivid blue for negative, vivid orange for positive, white at zero
  if (val > 0) {
    const t = Math.min(1, val / maxAbs);
    return new THREE.Color().setRGB(1, 0.6 - 0.4 * t, 0.1 + 0.9 * t); // vivid orange
  } else if (val < 0) {
    const t = Math.min(1, -val / maxAbs);
    return new THREE.Color().setRGB(0.1 + 0.9 * t, 0.6 - 0.4 * t, 1); // vivid blue
  } else {
    return new THREE.Color(0xffffff);
  }
}

function marchingCubesIsosurface(real: Float32Array, density: Float32Array, size: number, threshold: number) {

  // Convert Float32Array to ndarray for isosurface-generator
  const densityArray = ndarray(density, [size, size, size]);

  // Use the generator to extract the mesh
  const generator = isosurfaceGenerator(densityArray, threshold);
  let mesh;

  for (let data of generator) {
    mesh = {
      positions: data.positions,
      cells: data.cells,
    };
  }

  console.log('Generated mesh:', mesh);

  if (!mesh || !mesh.positions || !mesh.cells) {
    throw new Error('Isosurface extraction failed');
  }

  return mesh;
}

function App() {
  // Quantum numbers and UI state
  const [n, setN] = useState(2);
  const [l, setL] = useState(1);
  const [m, setM] = useState(0);
  const [gridSize, setGridSize] = useState(100);
  const [threshold, setThreshold] = useState(0.05);
  const [colormapName, setColormapName] = useState('jet');
  const [pointSize, setPointSize] = useState(0.1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [data, setData] = useState<{ real: Float32Array; density: Float32Array } | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePointCloud, setUsePointCloud] = useState(false);
  const [meshLoading, setMeshLoading] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const computeTimeout = useRef<number | null>(null);
  // Add refs for camera and controls
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const orbitAngle = useRef(0);
  const [planeActive, setPlaneActive] = useState(false);
  // Plane transform state
  const [planeDistance, setPlaneDistance] = useState(0); // along normal
  const [planePitch, setPlanePitch] = useState(0); // radians, X axis
  const [planeYaw, setPlaneYaw] = useState(0); // radians, Y axis
  // Add state for slicing mode
  const [slicing, setSlicing] = useState(false);
  const prevThreshold = useRef<number | null>(null);
  const prevPointSize = useRef<number | null>(null);
  const autoOrbitResumeTimeout = useRef<number | null>(null);
  // Remove heart emoji cycling state/effect

  // Only initialize WASM once
  useEffect(() => {
    let cancelled = false;
    init().then(() => {
      if (!cancelled) setWasmReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Throttle/debounce compute_orbital_duotone calls
  useEffect(() => {
    if (!wasmReady) return;
    setLoading(true);
    if (computeTimeout.current) {
      clearTimeout(computeTimeout.current);
    }
    computeTimeout.current = window.setTimeout(() => {
      try {
        const result = compute_orbital_duotone(n, l, m, gridSize);
        console.log('WASM result structure:', result);
        console.log('WASM result keys:', Object.keys(result || {}));
        console.log('WASM result.real type:', typeof result?.real, result?.real?.constructor?.name);
        console.log('WASM result.density type:', typeof result?.density, result?.density?.constructor?.name);

        // More flexible validation
        if (!result || !result.real || !result.density) {
          throw new Error('WASM result missing real or density');
        }

        // Convert to Float32Array if needed
        const real = result.real instanceof Float32Array ? result.real : new Float32Array(result.real);
        const density = result.density instanceof Float32Array ? result.density : new Float32Array(result.density);

        const expectedSize = gridSize * gridSize * gridSize;
        if (real.length !== expectedSize || density.length !== expectedSize) {
          throw new Error(`WASM result size mismatch: expected ${expectedSize}, got real=${real.length}, density=${density.length}`);
        }

        setData({ real, density });
        console.log('WASM data successfully set');
      } catch (e) {
        console.error('WASM compute error:', e);
        setData(null);
      }
      setLoading(false);
    }, 150);
    return () => {
      if (computeTimeout.current) clearTimeout(computeTimeout.current);
    };
  }, [wasmReady, n, l, m, gridSize]);

  // Only create camera and controls on mount
  useEffect(() => {
    if (!mountRef.current) return;
    // Camera
    if (!cameraRef.current) {
      cameraRef.current = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      cameraRef.current.position.set(0, 0, 20);
      cameraRef.current.lookAt(0, 0, 0);
    }
    // Controls
    if (!controlsRef.current && cameraRef.current) {
      controlsRef.current = new OrbitControls(cameraRef.current, mountRef.current);
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.08;
      controlsRef.current.minDistance = 8;
      controlsRef.current.maxDistance = 100;
      // Listen for user interaction to update orbit angle
      controlsRef.current.addEventListener('change', () => {
        if (cameraRef.current) {
          const x = cameraRef.current.position.x;
          const z = cameraRef.current.position.z;
          orbitAngle.current = Math.atan2(x, z);
        }
      });
      // Pause auto-orbit on pan, resume 4s after pan ends (if plane is not active)
      controlsRef.current.addEventListener('start', () => {
        setAutoOrbit(false);
        if (autoOrbitResumeTimeout.current) {
          clearTimeout(autoOrbitResumeTimeout.current);
          autoOrbitResumeTimeout.current = null;
        }
      });
      controlsRef.current.addEventListener('end', () => {
        if (autoOrbitResumeTimeout.current) {
          clearTimeout(autoOrbitResumeTimeout.current);
        }
        autoOrbitResumeTimeout.current = window.setTimeout(() => {
          if (!planeActive) setAutoOrbit(true);
        }, 4000);
      });
    }
    // Cleanup
    return () => {
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('start', () => { });
        controlsRef.current.removeEventListener('end', () => { });
        controlsRef.current.removeEventListener('change', () => { });
      }
      if (autoOrbitResumeTimeout.current) {
        clearTimeout(autoOrbitResumeTimeout.current);
        autoOrbitResumeTimeout.current = null;
      }
    };
  }, [planeActive]);

  // Three.js rendering
  useEffect(() => {
    if (!mountRef.current || !data || !cameraRef.current) return;
    // Validate data before rendering
    const size = gridSize;
    if (!data.real || !data.density ||
      data.real.length !== size * size * size ||
      data.density.length !== size * size * size) {
      console.error('Invalid data for rendering:', {
        real: data.real,
        density: data.density,
        size,
        realType: typeof data.real,
        densityType: typeof data.density,
        realLen: data.real?.length,
        densityLen: data.density?.length
      });
      return;
    }
    let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);
    let scene = new THREE.Scene();
    let camera = cameraRef.current;
    let controls = controlsRef.current;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    let light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 10, 10);
    scene.add(light);
    // Add axes and grid
    addAxesAndGrid(scene);
    // --- Slicing plane ---
    if (planeActive) {
      // Create a border-only plane (8x8 units)
      const planeSize = 8;
      const planeGeom = new THREE.BufferGeometry();
      // Rectangle border vertices (in order)
      const verts = [
        -planeSize / 2, -planeSize / 2, 0,
        planeSize / 2, -planeSize / 2, 0,
        planeSize / 2, planeSize / 2, 0,
        -planeSize / 2, planeSize / 2, 0
      ];
      planeGeom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      // --- Visually bold, thick, glowing border ---
      // Outer glow: thick, colored, low opacity
      const glowMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 32, transparent: true, opacity: 0.18 });
      const planeGlow = new THREE.LineLoop(planeGeom, glowMat);
      // Core: thick, white
      const coreMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 10 });
      const planeCore = new THREE.LineLoop(planeGeom, coreMat);
      // --- Correct normal and position ---
      const nx = Math.cos(planeYaw) * Math.cos(planePitch);
      const ny = Math.sin(planePitch);
      const nz = Math.sin(planeYaw) * Math.cos(planePitch);
      const planeOrigin = new THREE.Vector3(nx * planeDistance, ny * planeDistance, nz * planeDistance);
      const planeNormal = new THREE.Vector3(nx, ny, nz);
      [planeGlow, planeCore].forEach(plane => {
        plane.position.copy(planeOrigin);
        plane.lookAt(planeOrigin.clone().add(planeNormal));
        scene.add(plane);
      });
      // --- Faint, softly colored background (always present) ---
      const planeBgGeom = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeBgMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        opacity: 0.13,
        transparent: true,
        roughness: 0.12,
        metalness: 0.12,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        transmission: 0.85,
        ior: 1.22,
        thickness: 0.22,
        reflectivity: 0.13,
      });
      const planeBg = new THREE.Mesh(planeBgGeom, planeBgMat);
      planeBg.position.copy(planeOrigin);
      planeBg.lookAt(planeOrigin.clone().add(planeNormal));
      scene.add(planeBg);
    }
    // Render orbital as point cloud only
    const { real, density } = data;
    // Precompute colormap
    const cmap = colormap({
      colormap: colormapName,
      nshades: 256,
      format: 'rgba',
      alpha: 1
    });
    let geometry = new THREE.BufferGeometry();
    let positions: number[] = [];
    let colors: number[] = [];
    let opacities: number[] = [];
    // Efficient min/max for real and density
    let minReal = Infinity, maxReal = -Infinity, maxDensity = -Infinity, minDensity = Infinity;
    for (let i = 0; i < real.length; ++i) {
      if (real[i] < minReal) minReal = real[i];
      if (real[i] > maxReal) maxReal = real[i];
      if (density[i] > maxDensity) maxDensity = density[i];
      if (density[i] < minDensity) minDensity = density[i];
    }
    const absThreshold = threshold * maxDensity;
    let maxAbs = Math.max(Math.abs(minReal), Math.abs(maxReal));
    let step = size > 60 ? 2 : 1;
    let radius = size / 2 * 0.95;
    let pointCount = 0;
    for (let z = 1; z < size - 1; z += step) {
      for (let y = 1; y < size - 1; y += step) {
        for (let x = 1; x < size - 1; x += step) {
          const idx = x + y * size + z * size * size;
          const prob = density[idx];
          const dx = x - size / 2;
          const dy = y - size / 2;
          const dz = z - size / 2;
          if (prob > absThreshold && dx * dx + dy * dy + dz * dz < radius * radius) {
            positions.push(
              (x / size - 0.5) * 8,
              (y / size - 0.5) * 8,
              (z / size - 0.5) * 8
            );
            // Colormap by real part
            let t;
            if (maxAbs === 0) {
              t = 0.5;
            } else {
              t = 0.5 + 0.5 * real[idx] / maxAbs;
            }
            t = Math.max(0, Math.min(1, t));
            const color = cmap[Math.floor(t * 255)];
            colors.push(color[0] / 255, color[1] / 255, color[2] / 255);
            opacities.push(Math.min(1, prob / maxDensity));
            pointCount++;
          }
        }
      }
    }
    // Lower opacity if planeActive && !slicing, restore if slicing or not active
    let pointOpacity = 0.25;
    if (slicing) pointOpacity = 1;
    if (!planeActive) pointOpacity = 0.9;

    // Slicing logic: only show points near the plane when slicing is active
    let renderPositions = positions;
    let renderColors = colors;
    let renderOpacities = opacities;
    if (slicing && planeActive) {
      // Use the same normal and offset as above
      const nx = Math.cos(planeYaw) * Math.cos(planePitch);
      const ny = Math.sin(planePitch);
      const nz = Math.sin(planeYaw) * Math.cos(planePitch);
      const d = planeDistance;
      // Only show points within ±0.12 units of the plane
      const sliceThreshold = 0.12;
      let filteredPositions: number[] = [];
      let filteredColors: number[] = [];
      let filteredOpacities: number[] = [];
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        // Signed distance to plane
        const dist = nx * x + ny * y + nz * z - d;
        if (Math.abs(dist) < sliceThreshold) {
          filteredPositions.push(x, y, z);
          filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
          filteredOpacities.push(opacities[i / 3]);
        }
      }
      renderPositions = filteredPositions;
      renderColors = filteredColors;
      renderOpacities = filteredOpacities;
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(renderPositions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(renderColors, 3));
    let material = new THREE.PointsMaterial({ size: pointSize, vertexColors: true, transparent: true, opacity: pointOpacity });
    let points = new THREE.Points(geometry, material);
    scene.add(points);
    // Animate
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();
    // Handle resize
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      window.removeEventListener('resize', onResize);
      if (controls) {
        controls.removeEventListener('start', () => setAutoOrbit(false));
        controls.removeEventListener('change', () => {
          if (cameraRef.current) {
            const x = cameraRef.current.position.x;
            const z = cameraRef.current.position.z;
            orbitAngle.current = Math.atan2(x, z);
          }
        });
      }
      scene.traverse(obj => {
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) (obj as any).material.dispose();
      });
    };
  }, [data, gridSize, threshold, colormapName, pointSize, planeActive, planeDistance, planePitch, planeYaw, slicing]);

  // UI constraints
  useEffect(() => {
    if (l >= n) setL(n - 1);
    if (Math.abs(m) > l) setM(l);
  }, [n, l, m]);

  // Automatically adjust threshold and pointSize for high l orbitals
  useEffect(() => {
    if (l === 5) { // h orbital
      if (threshold > 0.015) {
        prevThreshold.current = threshold;
        setThreshold(0.015);
      }
      if (pointSize < 0.125) {
        prevPointSize.current = pointSize;
        setPointSize(0.125);
      }
    } else if (l >= 6) { // i and above
      if (threshold > 0.001) {
        prevThreshold.current = threshold;
        setThreshold(0.001);
      }
      if (pointSize < 0.15) {
        prevPointSize.current = pointSize;
        setPointSize(0.15);
      }
    } else {
      if (prevThreshold.current !== null) {
        setThreshold(prevThreshold.current);
        prevThreshold.current = null;
      }
      if (prevPointSize.current !== null) {
        setPointSize(prevPointSize.current);
        prevPointSize.current = null;
      }
    }
  }, [l]);

  // Improved auto-orbit logic: resume auto-orbit when planeActive is false
  useEffect(() => {
    // In the improved auto-orbit logic useEffect, do not set autoOrbit directly based on planeActive anymore, since it's now managed by pan events
  }, [planeActive]);

  // Camera orbit animation
  useEffect(() => {
    if (!autoOrbit || planeActive) return;
    let angle = orbitAngle.current;
    let animId: number;
    function animateCamera() {
      angle += 0.0035; // medium pace
      orbitAngle.current = angle;
      const r = 20;
      const cam = cameraRef.current;
      if (cam) {
        cam.position.x = r * Math.sin(angle);
        cam.position.z = r * Math.cos(angle);
        cam.lookAt(0, 0, 0);
      }
      animId = requestAnimationFrame(animateCamera);
    }
    animateCamera();
    return () => cancelAnimationFrame(animId);
  }, [autoOrbit, planeActive]);

  // --- Prevent camera jumps on UI option changes ---
  // Remove or comment out any code that sets camera.lookAt or camera.position in response to n, l, m, or UI changes
  // Only set camera.lookAt(0,0,0) once on initial mount, not on every render or option change

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', background: '#000', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Floating gear icon (replaces old button) */}
      <SettingsGearButton onClick={() => setSettingsOpen(o => !o)} open={settingsOpen} />
      {/* Plane toggle button (bottom right) */}
      <PlaneToggleButton onClick={() => setPlaneActive(a => !a)} active={planeActive} />
      {/* Plane controls (bottom right, above toggle) */}
      {planeActive && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 36,
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: 0,
        }}>
          <div style={{
            background: 'rgba(30,32,40,0.72)',
            borderRadius: 22,
            padding: '28px 28px 22px 28px',
            minWidth: 270,
            boxShadow: '0 8px 32px #0005',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 18,
            textAlign: 'left',
          }}>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2, letterSpacing: 0.2, color: '#fff', textAlign: 'left' }}>Examine Cross-Section</div>
            <label style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2, textAlign: 'left' }}>Distance</label>
            <input type="range" min={-4} max={4} step={0.01} value={planeDistance} onChange={e => setPlaneDistance(Number(e.target.value))} style={{ width: '100%', marginBottom: 2, background: 'none' }} />
            <div style={{ fontSize: 13, color: '#bbb', marginBottom: 6, textAlign: 'left' }}>Offset from origin: <span style={{ color: '#fff', fontWeight: 700 }}>{planeDistance.toFixed(2)}</span></div>
            <label style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2, textAlign: 'left' }}>Pitch (X)</label>
            <input type="range" min={-Math.PI / 2} max={Math.PI / 2} step={0.01} value={planePitch} onChange={e => setPlanePitch(Number(e.target.value))} style={{ width: '100%', marginBottom: 2, background: 'none' }} />
            <div style={{ fontSize: 13, color: '#bbb', marginBottom: 6, textAlign: 'left' }}>Angle from X axis: <span style={{ color: '#fff', fontWeight: 700 }}>{(planePitch * 180 / Math.PI).toFixed(1)}°</span></div>
            <label style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2, textAlign: 'left' }}>Yaw (Y)</label>
            <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={planeYaw} onChange={e => setPlaneYaw(Number(e.target.value))} style={{ width: '100%', marginBottom: 2, background: 'none' }} />
            <div style={{ fontSize: 13, color: '#bbb', marginBottom: 10, textAlign: 'left' }}>Angle from Y axis: <span style={{ color: '#fff', fontWeight: 700 }}>{(planeYaw * 180 / Math.PI).toFixed(1)}°</span></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {!slicing && <button onClick={() => setSlicing(true)} style={{ flex: 1, fontWeight: 700, fontSize: 16, borderRadius: 12, padding: '10px 0', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}>Slice</button>}
              {slicing && <button onClick={() => setSlicing(false)} style={{ flex: 1, fontWeight: 700, fontSize: 16, borderRadius: 12, padding: '10px 0', background: '#e34c67', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}>Remove</button>}
            </div>
          </div>
        </div>
      )}
      {/* Animated settings panel */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            gridSize={gridSize}
            setGridSize={setGridSize}
            threshold={threshold}
            setThreshold={setThreshold}
            colormap={colormapName}
            setColormap={setColormapName}
            pointSize={pointSize}
            setPointSize={setPointSize}
          />
        )}
      </AnimatePresence>
      {/* Vertical n slider */}
      <VerticalSlider value={n} setValue={setN} />
      {/* l tabs (bottom) */}
      <LOrbitalTabs l={l} setL={setL} n={n} />
      {/* m tabs (top) */}
      <MOrbitalTabs m={m} setM={setM} l={l} />
      {/* 3D scene mount */}
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }} />
      {/* Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 18,
          left: 18,
          display: 'flex',
          alignItems: 'center',
          zIndex: 200,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(30,32,40,0.72)',
            borderRadius: 18,
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: 18,
            color: '#fff',
            letterSpacing: 0.2,
            fontFamily: 'Inter, Poppins, system-ui, sans-serif',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            userSelect: 'none',
            border: '1.5px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 8px #0004',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ opacity: 0.3 }}>made by</span>
          <a href="https://linkedin.com/in/mir-usman" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>usman.</a>
        </div>
      </div>
    </div>
  );
}

export default App;
