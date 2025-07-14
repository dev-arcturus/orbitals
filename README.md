# Quantum Orbital Visualizer

A modern, interactive web app for visualizing quantum atomic orbitals in 3D, built with React, Three.js, and Rust/WASM.

## Features

- Real-time, interactive 3D visualization of hydrogen-like atomic orbitals
- Adjustable quantum numbers (n, l, m) with beautiful, glassy UI
- Point cloud rendering with scientific colormaps
- Slicing plane for cross-sectional analysis
- Camera auto-orbit with user interaction pause/resume
- Modern, glassmorphic controls and settings panel
- Responsive, high-performance rendering for large grids
- WASM backend for fast quantum calculations

## Tech Stack

- **Frontend:** React, Three.js, Framer Motion, Vite
- **Backend (WASM):** Rust (computes ψₙₗₘ and |ψ|² on a 3D grid)
- **Styling:** CSS, glassmorphism, modern math/science fonts

## Local Development

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the dev server:**

   ```sh
   npm run dev
   ```

   The app will be available at `http://localhost:5173` (or as shown in your terminal).

3. **Build the WASM package:**
   - Make sure the Rust WASM build outputs to `src/wasm_pkg/` and the `.wasm` file is accessible by the frontend.

## Building for Production

```sh
npm run build
```

- Output will be in the `dist/` directory.
- Make sure the WASM file is copied to `dist/wasm_pkg/` or the correct location.

## Deploying to Netlify

1. **Set build command:**
   ```
   npm run build
   ```
2. **Set publish directory:**
   ```
   dist
   ```
3. **WASM MIME type:**

   - The file `public/_headers` ensures `.wasm` files are served with `Content-Type: application/wasm` (required for browsers to load WASM modules).

4. **Drag-and-drop deploy:**
   - You can also drag the `dist/` folder into Netlify's dashboard for manual deploys.

## WASM Notes

- If you update the Rust code, rebuild the WASM and ensure the new `.wasm` file is present in the output directory.
- If you see MIME type errors, check the `_headers` file and WASM file location.

## Credits

- Made by [usman](https://linkedin.com/in/mir-usman)
