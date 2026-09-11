import React, { useEffect, useRef, useState } from 'react';
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
  const dimensionsRef = useRef({ w: 0, h: 0, dpr: 1 });

  const settings = useSettings() || {};
  const { accentColor, gradientColors, themeStyle, bgEffectMode = 'stars' } = settings;

  const activeColors = themeStyle === 'gradient' && Array.isArray(gradientColors) && gradientColors.length >= 2
    ? gradientColors
    : [accentColor || '#ec4899'];

  const primaryColor = activeColors[0];
  const entitiesRef = useRef([]);

  const resize = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newW = Math.floor(rect.width || window.innerWidth);
    const newH = Math.floor(rect.height || window.innerHeight);
    const newDpr = Math.min(window.devicePixelRatio || 1, 2); // Performance cap at 2x DPR

    dimensionsRef.current = { w: newW, h: newH, dpr: newDpr };

    if (canvasRef.current) {
      canvasRef.current.width = newW * newDpr;
      canvasRef.current.height = newH * newDpr;
    }

    initEntities(newW, newH, bgEffectMode);
  };

  const initEntities = (width, height, mode) => {
    const list = [];
    if (mode === 'stars') {
      const count = Math.max(40, Math.min(90, Math.round((width * height) / 12000)));
      for (let i = 0; i < count; i++) {
        list.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: 0.5 + Math.random() * 0.7,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          color: activeColors[i % activeColors.length]
        });
      }
    } else if (mode === 'shooting-stars') {
      for (let i = 0; i < 6; i++) {
        list.push(createShootingStar(width, height, i));
      }
    } else if (mode === 'explosions') {
      for (let i = 0; i < 2; i++) {
        const randColor = activeColors[Math.floor(Math.random() * activeColors.length)];
        list.push(...createExplosion(Math.random() * width, Math.random() * height, randColor));
      }
    }
    entitiesRef.current = list;
  };

  const createShootingStar = (width, height, index = 0) => ({
    x: Math.random() * width * 1.2 - width * 0.1,
    y: Math.random() * (height * 0.5),
    length: 80 + Math.random() * 100,
    speed: 10 + Math.random() * 8,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
    opacity: 0.7 + Math.random() * 0.3,
    color: activeColors[index % activeColors.length]
  });

  const createExplosion = (x, y, color) => {
    const particles = [];
    const count = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: color || primaryColor,
        size: 1.5 + Math.random() * 2,
      });
    }
    return particles;
  };

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const { w, h } = dimensionsRef.current;
    if (w > 0 && h > 0) initEntities(w, h, bgEffectMode);
  }, [bgEffectMode, accentColor, gradientColors, themeStyle]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for faster composite
    let t = 0;

    const draw = () => {
      const { w, h, dpr } = dimensionsRef.current;
      if (w <= 0 || h <= 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      t += 0.012;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Koyu zemin
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.85);
      grad.addColorStop(0, '#0a0e1a');
      grad.addColorStop(1, '#050812');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 1. MOD: PARLAYAN YILDIZLAR (STARS)
      if (bgEffectMode === 'stars') {
        const count = entitiesRef.current.length;
        for (let i = 0; i < count; i++) {
          const s = entitiesRef.current[i];
          if (!s) continue;
          const sx = ((s.x + s.speedX * t * 40) % w + w) % w;
          const sy = ((s.y + s.speedY * t * 40) % h + h) % h;
          const rad = 1.2 * s.z;
          const starColor = s.color || primaryColor;

          ctx.fillStyle = hexToRgba(starColor, 0.7);
          ctx.beginPath();
          ctx.arc(sx, sy, rad * 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, rad * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } 
      // 2. MOD: KAYAN YILDIZLAR (SHOOTING STARS)
      else if (bgEffectMode === 'shooting-stars') {
        const list = entitiesRef.current;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          s.x += Math.cos(s.angle) * s.speed;
          s.y += Math.sin(s.angle) * s.speed;

          if (s.x > w * 1.3 || s.y > h * 1.3) {
            entitiesRef.current[i] = createShootingStar(w, h, i);
          }

          const tailX = s.x - Math.cos(s.angle) * s.length;
          const tailY = s.y - Math.sin(s.angle) * s.length;

          const lineGrad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
          lineGrad.addColorStop(0, hexToRgba(s.color || primaryColor, s.opacity));
          lineGrad.addColorStop(1, 'rgba(255,255,255,0)');

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      } 
      // 3. MOD: PATLAMALAR (EXPLOSIONS)
      else if (bgEffectMode === 'explosions') {
        const list = entitiesRef.current;
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.018;

          if (p.alpha <= 0) {
            list.splice(i, 1);
            continue;
          }

          ctx.fillStyle = hexToRgba(p.color || primaryColor, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (list.length < 15 && Math.random() < 0.04) {
          const randColor = activeColors[Math.floor(Math.random() * activeColors.length)];
          entitiesRef.current.push(...createExplosion(Math.random() * w, Math.random() * h, randColor));
        }
      } 
      // 4. MOD: AKIŞKAN MERMER DALGALARI (LIQUID MARBLE) - OPTİMİZE EDİLDİ
      else if (bgEffectMode === 'liquid') {
        const lines = 12; // Çizgi sayısı düşürüldü (18 -> 12)
        const step = 35;  // Adım aralığı artırıldı (20 -> 35), piksel hesaplama %40 hafifletildi
        
        for (let i = 0; i < lines; i++) {
          const lineColor = activeColors[i % activeColors.length];
          ctx.beginPath();
          ctx.lineWidth = 2.5 + Math.sin(t + i) * 1.5;
          ctx.strokeStyle = hexToRgba(lineColor, 0.18 + (i / lines) * 0.2);

          const baseHeight = (h / lines) * i;
          for (let x = 0; x <= w + step; x += step) {
            const y = baseHeight + Math.sin(x * 0.004 + t + i * 0.5) * 35 + Math.cos(x * 0.008 - t) * 18;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [primaryColor, activeColors, bgEffectMode]);

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
        willChange: 'transform',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default DynamicCanvasBackground;