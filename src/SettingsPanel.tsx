import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCog, FaVectorSquare } from 'react-icons/fa';

const colormaps = [
  'viridis', 'plasma', 'inferno', 'magma', 'jet', 'rainbow', 'cool', 'hot', 'spring', 'summer', 'autumn', 'winter',
];

const modernFont = 'Inter, Poppins, system-ui, sans-serif';
const labelStyle = { fontWeight: 700, fontSize: 18, marginBottom: 4, fontFamily: modernFont };
const descStyle = { fontWeight: 400, fontSize: 13, color: '#bbb', marginBottom: 10, fontFamily: modernFont };

export function SettingsGearButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <motion.button
      initial={false}
      animate={{ scale: open ? 1.1 : 1, rotate: open ? 90 : 0, background: open ? 'rgba(30,32,40,0.7)' : 'rgba(30,32,40,0.45)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 28,
        right: 36,
        width: 54,
        height: 54,
        minWidth: 54,
        minHeight: 54,
        maxWidth: 54,
        maxHeight: 54,
        borderRadius: '50%',
        border: 'none',
        outline: 'none',
        boxShadow: '0 4px 24px #0006, 0 0 0 2px #fff2',
        background: 'rgba(30,32,40,0.45)',
        color: '#fff',
        zIndex: 1200,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        fontFamily: modernFont,
        padding: 0,
        backdropFilter: 'blur(8px)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
      aria-label="Settings"
    >
      <FaCog size={28} />
    </motion.button>
  );
}

export function PlaneToggleButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <motion.button
      initial={false}
      animate={{ scale: active ? 1.1 : 1, rotate: active ? 90 : 0, background: active ? 'rgba(30,32,40,0.7)' : 'rgba(30,32,40,0.45)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 32,
        right: 36,
        width: 54,
        height: 54,
        minWidth: 54,
        minHeight: 54,
        maxWidth: 54,
        maxHeight: 54,
        borderRadius: '50%',
        border: 'none',
        outline: 'none',
        boxShadow: '0 4px 24px #0006, 0 0 0 2px #fff2',
        background: 'rgba(30,32,40,0.45)',
        color: '#fff',
        zIndex: 1200,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        fontFamily: modernFont,
        padding: 0,
        backdropFilter: 'blur(8px)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}
      aria-label="Slicing Plane"
    >
      <FaVectorSquare size={28} />
    </motion.button>
  );
}

export function SettingsPanel({ open, onClose, gridSize, setGridSize, threshold, setThreshold, colormap, setColormap, pointSize, setPointSize }: any) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: open ? 0 : '100%' }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 340,
        background: 'rgba(30,32,40,0.92)',
        color: '#fff', zIndex: 1100,
        boxShadow: '-4px 0 32px #0008',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 18,
        backdropFilter: 'blur(18px)',
        borderLeft: '1.5px solid #fff2',
        fontFamily: modernFont,
        alignItems: 'flex-start',
      }}
    >

      <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 12, fontFamily: modernFont, textAlign: 'left' }}>Settings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
        <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ ...labelStyle, textAlign: 'left' }}>Grid Size</div>
          <div style={{ ...descStyle, textAlign: 'left' }}>Controls the resolution of the 3D grid. Higher values give more detail but are slower.</div>
          <input type="range" min={24} max={100} value={gridSize} onChange={e => setGridSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', height: 6, borderRadius: 4, boxShadow: '0 1px 6px #0002', marginBottom: 2 }} />
          <div style={{ fontSize: 15, color: '#bbb', marginTop: 2, textAlign: 'left' }}>Current: {gridSize}</div>
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ ...labelStyle, textAlign: 'left' }}>Threshold</div>
          <div style={{ ...descStyle, textAlign: 'left' }}>Minimum density for a point to be shown. Lower values reveal more structure, higher values show only the densest regions.</div>
          <input type="range" min={0.001} max={0.2} step={0.001} value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: '#e34c67', height: 6, borderRadius: 4, boxShadow: '0 1px 6px #0002', marginBottom: 2 }} />
          <div style={{ fontSize: 15, color: '#bbb', marginTop: 2, textAlign: 'left' }}>Current: {(threshold * 100).toFixed(2)}%</div>
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ ...labelStyle, textAlign: 'left' }}>Colormap</div>
          <div style={{ ...descStyle, textAlign: 'left' }}>Choose the color scheme for the orbital visualization.</div>
          <select value={colormap} onChange={e => setColormap(e.target.value)} style={{ width: '100%', marginTop: 8, padding: 7, fontSize: 16, borderRadius: 8, border: 'none', background: '#23283a', color: '#fff', fontFamily: modernFont, boxShadow: '0 1px 6px #0002', textAlign: 'left' }}>
            {colormaps.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ ...labelStyle, textAlign: 'left' }}>Point Size</div>
          <div style={{ ...descStyle, textAlign: 'left' }}>Controls the size of each rendered point in the 3D plot.</div>
          <input type="range" min={0.05} max={0.3} step={0.01} value={pointSize} onChange={e => setPointSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e42', height: 6, borderRadius: 4, boxShadow: '0 1px 6px #0002', marginBottom: 2 }} />
          <div style={{ fontSize: 15, color: '#bbb', marginTop: 2, textAlign: 'left' }}>Current: {pointSize.toFixed(3)}</div>
        </div>
      </div>
    </motion.div>
  );
} 