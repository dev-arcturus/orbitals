import React from 'react';
import { motion } from 'framer-motion';

const N_MIN = 1;
const N_MAX = 7;
const sliderFont = 'Inter, Poppins, system-ui, sans-serif';
const primaryBg = 'rgba(30,32,40,0.55)';
const secondaryBg = 'rgba(60,70,90,0.18)';
const knobColor = '#fff';
const knobShadow = '0 4px 24px #0003, 0 0 0 8px #0002';
const numberHeight = 44;
const knobHeight = 48;
const gap = 8;

export function VerticalSlider({ value, setValue }: { value: number; setValue: (n: number) => void }) {
  const numTicks = N_MAX - N_MIN + 1;
  const sliderHeight = numTicks * numberHeight + (numTicks - 1) * gap;
  const numbers = Array.from({ length: numTicks }, (_, i) => N_MAX - i);
  const selectedIdx = numbers.indexOf(value);
  return (
    <div style={{
      position: 'fixed',
      left: 32,
      top: '50%',
      transform: 'translateY(-50%)',
      height: sliderHeight + 100,
      width: 76,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: sliderFont,
      background: `linear-gradient(120deg, ${primaryBg} 70%, ${secondaryBg} 100%)`,
      boxShadow: '0 8px 32px #0003, 0 1.5px 8px #0002',
      borderRadius: 40,
      border: '2.5px solid rgba(255,255,255,0.05)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
    }}>
      <div style={{
        position: 'relative',
        height: sliderHeight,
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          height: sliderHeight,
          width: 64,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          gap,
        }}>
          <motion.div
            layout
            initial={false}
            animate={{ y: selectedIdx * (numberHeight + gap) }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              position: 'absolute',
              left: 8,
              width: knobHeight,
              height: knobHeight,
              borderRadius: '50%',
              background: knobColor,
              zIndex: 1,
              top: 0,
              boxShadow: knobShadow,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
            }}
          />
          {numbers.map((n, i) => {
            const active = n === value;
            return (
              <motion.div
                key={n}
                layout
                initial={false}
                animate={active ? {
                  scale: 1.18,
                  color: '#111',
                  fontWeight: 900,
                } : {
                  scale: 1,
                  color: '#888',
                  fontWeight: 500,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                style={{
                  width: numberHeight,
                  height: numberHeight,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 22,
                  margin: 0,
                  userSelect: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'none',
                  fontWeight: active ? 900 : 500,
                  fontFamily: sliderFont,
                  zIndex: 3,
                  transition: 'color 0.2s, font-weight 0.2s',
                }}
                onClick={() => setValue(n)}
              >
                {n}
              </motion.div>
            );
          })}
        </div>
      </div>
      {/* Glassy, bold n label as a circle with secondary bg, no border */}
      <div style={{
        marginTop: 16,
        width: 54,
        height: 54,
        borderRadius: '50%',
        background: `linear-gradient(120deg, ${secondaryBg} 60%, #fff2 100%)`,
        color: '#fff',
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: 1,
        textAlign: 'center',
        boxShadow: '0 2px 16px #0002',
        fontFamily: sliderFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textShadow: '0 2px 16px #0008',
        border: 'none',
        backdropFilter: 'blur(8px)',
      }}>n</div>
    </div>
  );
} 