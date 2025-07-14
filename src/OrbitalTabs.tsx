import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const orbitalNames = ['s', 'p', 'd', 'f', 'g', 'h', 'i'];
const orbitalColors = ['#3b82f6', '#f59e42', '#e34c67', '#a259e6', '#2dd4bf', '#fbbf24', '#ef4444'];
const tabFont = 'Inter, Poppins, system-ui, sans-serif';

function shiftColor(hex: string, m: number, l: number) {
  // More drastic shift: hue ±18deg, lightness ±10, but keep high contrast
  const hsl = hexToHSL(hex);
  const mNorm = l === 0 ? 0 : (m / l); // -1 to 1
  hsl.h = (hsl.h + mNorm * 18 + 360) % 360;
  hsl.l = Math.max(30, Math.min(70, hsl.l + mNorm * 10));
  return `hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`;
}
function hexToHSL(H: string) {
  // Convert hex to HSL
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = parseInt(H[1] + H[1], 16);
    g = parseInt(H[2] + H[2], 16);
    b = parseInt(H[3] + H[3], 16);
  } else if (H.length === 7) {
    r = parseInt(H[1] + H[2], 16);
    g = parseInt(H[3] + H[4], 16);
    b = parseInt(H[5] + H[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastYIQ(hex: string) {
  // Convert hex or hsl to RGB, then compute YIQ
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('hsl')) {
    // Parse hsl(h,s%,l%)
    const [h, s, l] = hex.match(/\d+/g)!.map(Number);
    const a = s / 100 * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    r = Math.round(255 * f(0));
    g = Math.round(255 * f(8));
    b = Math.round(255 * f(4));
  } else if (hex.startsWith('#')) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#222' : '#fff';
}

export function OrbitalTabs({ value, setValue, options, labels, latexLabels, pill = false, position = 'bottom', highlightColor = '#3b82f6', shellNumbers, m, l }: {
  value: number;
  setValue: (n: number) => void;
  options: number[];
  labels?: string[];
  latexLabels?: string[];
  pill?: boolean;
  position?: 'top' | 'bottom';
  highlightColor?: string;
  shellNumbers?: number[]; // For l tabs, to show shell+subshell
  m?: number; // For m tabs
  l?: number; // For m tabs
}) {
  const isLSelector = typeof m === 'undefined';
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      right: 0,
      [position]: 24,
      marginTop: position === 'top' ? 32 : 0,
      marginBottom: position === 'bottom' ? 32 : 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 0,
      zIndex: 100,
      background: 'none',
      boxShadow: 'none',
      padding: '0',
      pointerEvents: 'none',
    }}>
      <LayoutGroup>
        {options.map((opt, i) => {
          const active = opt === value;
          let label = labels ? labels[i] : String(opt);
          let latex = latexLabels ? latexLabels[i] : undefined;
          let color = highlightColor;
          let tabColor = color;
          if (isLSelector) {
            color = orbitalColors[i % orbitalColors.length];
            tabColor = color;
          } else {
            // m selector: always use highlightColor as base, shift for each m
            tabColor = shiftColor(color, opt, l!);
          }
          const textColor = getContrastYIQ(tabColor);
          return (
            <motion.button
              key={opt}
              layout
              initial={false}
              animate={{
                scale: active ? 1.18 : 1,
                opacity: active ? 1 : 0.8,
                background: active ? tabColor : 'rgba(30,32,40,0.7)',
                color: active ? textColor : tabColor,
                boxShadow: active ? `0 0 0 4px ${tabColor}55, 0 2px 16px ${tabColor}99` : '0 0 0 0px transparent',
                filter: active ? 'brightness(1.08)' : 'none',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 1.1 }}
              style={{
                width: pill ? 'auto' : 54,
                minWidth: pill ? 54 : undefined,
                height: 54,
                borderRadius: pill ? 24 : '50%',
                padding: pill ? '0 18px' : undefined,
                border: 'none',
                outline: 'none',
                margin: '0 10px',
                fontSize: 22,
                fontFamily: tabFont,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: 1,
                position: 'relative',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, filter 0.2s',
                userSelect: 'none',
              }}
              onClick={() => setValue(opt)}
            >
              {/* For l tabs, show shell+subshell (e.g., '3d') */}
              {shellNumbers && labels ? (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                  <span style={{ fontSize: 14, opacity: 0.7, fontWeight: 600 }}>{shellNumbers[i]}</span>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>
                    {latex ? <InlineMath math={latex} /> : (label.includes('{') || label.includes('^') ? <InlineMath math={label} /> : label)}
                  </span>
                </span>
              ) : (
                latex ? <InlineMath math={latex} /> : (label.includes('{') || label.includes('^') ? <InlineMath math={label} /> : label)
              )}
            </motion.button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

export function LOrbitalTabs({ l, setL, n }: { l: number; setL: (l: number) => void; n: number }) {
  const options = Array.from({ length: n }, (_, i) => i);
  const labels = orbitalNames.slice(0, n);
  const shellNumbers = Array.from({ length: n }, (_, i) => n); // All show current n as shell number
  return <OrbitalTabs value={l} setValue={setL} options={options} labels={labels} position="bottom" highlightColor="#3b82f6" shellNumbers={shellNumbers} />;
}

const pLabels = ['p_y', 'p_z', 'p_x']; // m = -1, 0, 1
const pLatex = ['p_{y}', 'p_{z}', 'p_{x}'];
const dLabels = ['d_{xy}', 'd_{yz}', 'd_{z^2}', 'd_{xz}', 'd_{x^2-y^2}']; // m = -2, -1, 0, 1, 2
const fLabels = [
  'f_{y(3x^2-y^2)}', 'f_{z(3x^2-y^2)}', 'f_{xyz}', 'f_{z^3}', 'f_{xz^2}', 'f_{yz^2}', 'f_{x(x^2-3y^2)}'
]; // m = -3, -2, -1, 0, 1, 2, 3

export function MOrbitalTabs({ m, setM, l }: { m: number; setM: (m: number) => void; l: number }) {
  if (l === 0) return null; // Don't show m selector for s orbitals
  const options = Array.from({ length: 2 * l + 1 }, (_, i) => i - l);
  // Use the color of the currently selected l as the base color
  const baseColor = orbitalColors[l % orbitalColors.length];
  let labels: string[] | undefined = undefined;
  let latexLabels: string[] | undefined = undefined;
  let pill = false;
  if (l === 1) {
    labels = pLabels;
    latexLabels = pLatex;
    pill = true;
  } else if (l === 2) {
    labels = dLabels;
    latexLabels = dLabels;
    pill = true;
  } else if (l === 3) {
    labels = fLabels;
    latexLabels = fLabels;
    pill = true;
  }
  return <OrbitalTabs value={m} setValue={setM} options={options} labels={labels} latexLabels={latexLabels} pill={pill} position="top" highlightColor={baseColor} m={m} l={l} />;
} 