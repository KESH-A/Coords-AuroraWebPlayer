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
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [dpr, setDpr] = useState(1);

  const settings = useSettings() || {};
  const { accentColor, gradientColors, themeStyle, bgEffectMode = 'stars' } = settings;

  // Seçili renklere göre dinamik palet oluşturma (Çoklu Renk Desteği)
  const activeColors = themeStyle === 'gradient' && Array.isArray(gradientColors) && gradientColors.length >= 2
    ? gradientColors
    : [accentColor || '#ec4899'];

  const primaryColor = activeColors[0];

  const entitiesRef = useRef([]);
  const seedRef = useRef(0);

  const resize = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newW = Math.floor(rect.width || window.innerWidth);
    const newH = Math.floor(rect.height || window.innerHeight);
    const newDpr = window.devicePixelRatio || 1;
    
    if (newW !== w || newH !== h || newDpr !== dpr) {
      setW(newW);
      setH(newH);
      setDpr(newDpr);
      seedRef.current = Math.random();
      initEntities(newW, newH, bgEffectMode);
    }
  };

  const initEntities = (width, height, mode) => {
    const list = [];
    if (mode === 'stars') {
      const count = Math.max(60, Math.min(140, Math.round((width * height) / 9000)));
      for (let i = 0; i < count; i++) {
        list.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: 0.5 + Math.random() * 0.7,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          phase: Math.random() * Math.PI * 2,
          color: activeColors[i % activeColors.length]
        });
      }
    } else if (mode === 'shooting-stars') {
      for (let i = 0; i < 8; i++) {
        list.push(createShootingStar(width, height, i));
      }
    } else if (mode === 'explosions') {
      for (let i = 0; i < 3; i++) {
        const randColor = activeColors[Math.floor(Math.random() * activeColors.length)];
        list.push(...createExplosion(Math.random() * width, Math.random() * height, randColor));
      }
    }
    entitiesRef.current = list;
  };

  const createShootingStar = (width, height, index = 0) => ({
    x: Math.random() * width * 1.2 - width * 0.1,
    y: Math.random() * (height * 0.5),
    length: 80 + Math.random() * 120,
    speed: 12 + Math.random() * 10,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
    opacity: 0.7 + Math.random() * 0.3,
    color: activeColors[index % activeColors.length]
  });

  const createExplosion = (x, y, color) => {
    const particles = [];
    const count = 30 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: color || primaryColor,
        size: 1.5 + Math.random() * 2.5,
      });
    }
    return particles;
  };

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (w > 0 && h > 0) initEntities(w, h, bgEffectMode);
  }, [bgEffectMode, accentColor, gradientColors, themeStyle]);

  useEffect(() => {
    if (!canvasRef.current || w <= 0 || h <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    let t = 0;

    const draw = () => {
      t += 0.015;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Koyu zemin
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.85);
      grad.addColorStop(0, 'rgba(10, 14, 26, 0.6)');
      grad.addColorStop(1, 'rgba(5,8,18,0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 1. MOD: PARLAYAN YILDIZLAR (STARS)
      if (bgEffectMode === 'stars') {
        const count = entitiesRef.current.length;
        for (let i = 0; i < count; i++) {
          const s = entitiesRef.current[i];
          if (!s) continue;
          const sx = ((s.x + s.speedX * t * 50) % w + w) % w;
          const sy = ((s.y + s.speedY * t * 50) % h + h) % h;
          const rad = 1.2 * s.z;
          const starColor = s.color || primaryColor;
          
          ctx.save();
          ctx.shadowBlur = 10 * s.z;
          ctx.shadowColor = hexToRgba(starColor, 0.8);
          ctx.fillStyle = hexToRgba(starColor, 0.8);
          ctx.beginPath();
          ctx.arc(sx, sy, rad * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, rad * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
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
          ctx.lineWidth = 2;
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
          p.alpha -= 0.015;

          if (p.alpha <= 0) {
            list.splice(i, 1);
            continue;
          }

          ctx.fillStyle = hexToRgba(p.color || primaryColor, p.alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        if (list.length < 20 && Math.random() < 0.05) {
          const randColor = activeColors[Math.floor(Math.random() * activeColors.length)];
          entitiesRef.current.push(...createExplosion(Math.random() * w, Math.random() * h, randColor));
        }
      } 
      // 4. MOD: AKIŞKAN MERMER DALGALARI (LIQUID MARBLE)
      else if (bgEffectMode === 'liquid') {
        const lines = 18;
        for (let i = 0; i < lines; i++) {
          const lineColor = activeColors[i % activeColors.length];
          ctx.beginPath();
          ctx.lineWidth = 3 + Math.sin(t + i) * 2;
          ctx.strokeStyle = hexToRgba(lineColor, 0.15 + (i / lines) * 0.25);

          for (let x = 0; x < w; x += 20) {
            const y = (h / lines) * i + Math.sin(x * 0.005 + t + i * 0.5) * 40 + Math.cos(x * 0.01 - t) * 20;
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
  }, [w, h, dpr, primaryColor, activeColors, bgEffectMode]);

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
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default DynamicCanvasBackground;