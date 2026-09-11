import React, { useEffect, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';

const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(236, 72, 153, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((char) => char + char).join('');
  if (c.length !== 6) return `rgba(236, 72, 153, ${alpha})`;
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

export const DynamicCanvasBackground = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  
  // React state re-render kilitlenmelerini engellemek icin mutable Ref'ler kullanıyoruz
  const settings = useSettings() || {};
  const { accentColor, gradientColors, themeStyle, bgEffectMode = 'stars' } = settings;

  const propsRef = useRef({ bgEffectMode, activeColors: ['#ec4899'] });

  // Settings degistikce Ref'i guncelle (Canvas animation loop kesintiye UĞRAMAZ)
  useEffect(() => {
    const activeColors = themeStyle === 'gradient' && Array.isArray(gradientColors) && gradientColors.length >= 2
      ? gradientColors
      : [accentColor || '#ec4899'];

    propsRef.current = {
      bgEffectMode: bgEffectMode || 'stars',
      activeColors
    };
  }, [accentColor, gradientColors, themeStyle, bgEffectMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let w = 0;
    let h = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      w = Math.floor(rect.width || window.innerWidth);
      h = Math.floor(rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Sabit 1.5x DPR performans icin

      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let t = 0;

    // KOPMAYAN DÖNGÜ (Audio Playback State'den tamamen bağımsız)
    const render = () => {
      animRef.current = requestAnimationFrame(render);

      if (w <= 0 || h <= 0) return;

      const { bgEffectMode: currentMode, activeColors } = propsRef.current;
      const primaryColor = activeColors[0] || '#ec4899';

      t += 0.015;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Zemin temizleme
      ctx.fillStyle = '#070a14';
      ctx.fillRect(0, 0, w, h);

      try {
        if (currentMode === 'liquid') {
          const lines = 10;
          const step = 40;

          for (let i = 0; i < lines; i++) {
            const lineColor = activeColors[i % activeColors.length] || primaryColor;
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = hexToRgba(lineColor, 0.25);

            const baseHeight = (h / lines) * i;
            for (let x = 0; x <= w + step; x += step) {
              const y = baseHeight + Math.sin(x * 0.003 + t + i * 0.4) * 30 + Math.cos(x * 0.006 - t) * 15;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        } else if (currentMode === 'stars') {
          const starCount = 50;
          for (let i = 0; i < starCount; i++) {
            const sx = ((i * 137.5 + t * 20) % w + w) % w;
            const sy = ((i * 213.7 + t * 10) % h + h) % h;
            const starColor = activeColors[i % activeColors.length] || primaryColor;

            ctx.fillStyle = hexToRgba(starColor, 0.6);
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentMode === 'shooting-stars') {
          for (let i = 0; i < 4; i++) {
            const progress = ((t * 0.8 + i * 0.25) % 1);
            const sx = progress * w * 1.3 - w * 0.15;
            const sy = progress * h * 0.8;
            const starColor = activeColors[i % activeColors.length] || primaryColor;

            const grad = ctx.createLinearGradient(sx, sy, sx - 60, sy - 40);
            grad.addColorStop(0, hexToRgba(starColor, 0.8));
            grad.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - 60, sy - 40);
            ctx.stroke();
          }
        } else {
          // Explosions
          for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 + t;
            const radius = 40 + Math.sin(t * 2 + i) * 20;
            const ex = w / 2 + Math.cos(angle) * radius;
            const ey = h / 2 + Math.sin(angle) * radius;

            ctx.fillStyle = hexToRgba(primaryColor, 0.5);
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } catch (e) {
        // Audio thread çökerse veya render patlarsa döngüyü kesme
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // SADECE 1 KEZ MOUNT OLUR - Muzik baslasa da unmount/re-render olmaz!

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        transform: 'translateZ(0)', // Force GPU layer
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default DynamicCanvasBackground;