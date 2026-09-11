import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

const STAR_FIELD_SIZE = 180; // Parçacık sınırı yükseltildi
const STAR_BASE_SIZE = 1.4;  // Temel boyut büyütüldü
const BG_COLOR = 'rgba(10, 14, 26, 0.55)';
const EDGE_FADE = 40;

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
  const { accentColor, gradientColors, themeStyle } = settings;

  const rawColor = themeStyle === 'gradient' && gradientColors?.length >= 1 
    ? gradientColors[0] 
    : accentColor || '#ec4899';

  const starsRef = useRef([]);
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
      const stars = [];
      // Yoğunluk artırıldı (daha fazla parçacık)
      const count = Math.max(80, Math.min(180, Math.round((newW * newH) / 8000)));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * newW,
          y: Math.random() * newH,
          z: 0.5 + Math.random() * 0.7,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          phase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    }
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
    if (!canvasRef.current || w <= 0 || h <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const starCount = Math.min(STAR_FIELD_SIZE, starsRef.current.length);
    const baseSize = Math.max(1.0, Math.min(2.5, STAR_BASE_SIZE * (1 + (w / 1000) * 0.5)));
    const edgeW = EDGE_FADE;
    const edgeH = EDGE_FADE;
    const driftX = 0.14 * Math.cos(seedRef.current);
    const driftY = 0.1 * Math.sin(seedRef.current * 1.3 + 1);
    const pulseSpeed = 0.015 + Math.random() * 0.01;
    let t = 0;

    const draw = () => {
      t += pulseSpeed;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Arka plan gradyanı
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.85);
      grad.addColorStop(0, BG_COLOR);
      grad.addColorStop(1, 'rgba(5,8,18,0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const swayX = Math.sin(t * 0.4) * 0.8;
      const swayY = Math.cos(t * 0.55 + 1) * 0.8;
      const pulse = Math.sin(t * 1.1) * 0.2 + 0.8;

      for (let i = 0; i < starCount; i++) {
        const s = starsRef.current[i];
        if (!s) continue;

        const sx = s.x + driftX * 8 + s.speedX * t * 1.5 + swayX + pulse * Math.sin(t * 0.8 + s.phase) * 1.6;
        const sy = s.y + driftY * 8 + s.speedY * t * 1.5 + swayY + pulse * Math.cos(t * 0.9 + s.phase) * 1.4;
        const wrapX = ((sx % w) + w) % w;
        const wrapY = ((sy % h) + h) % h;
        const sxClamped = Math.max(edgeW, Math.min(w - edgeW, wrapX));
        const syClamped = Math.max(edgeH, Math.min(h - edgeH, wrapY));
        const dist = Math.hypot(sxClamped - w / 2, syClamped - h / 2);
        const maxDist = Math.hypot(w / 2, h / 2);
        const edge = Math.max(0, 1 - Math.pow(dist / maxDist, 3));
        const finalPulse = (Math.sin(t * 0.8 + s.phase) * 0.3 + 0.7) * pulse;
        
        // Boyutlar büyütüldü
        const starSize = baseSize * s.z * finalPulse * edge * 1.6 + 0.8;
        const alpha = Math.max(0.25, Math.min(1, 0.6 * s.z * finalPulse));

        const rad = Math.max(1.2, starSize);
        const col = ctx.createRadialGradient(sxClamped, syClamped, 0, sxClamped, syClamped, rad * 3.5);
        
        // Glow (ışık hüzmesi) katmanları güçlendirildi
        col.addColorStop(0, hexToRgba(rawColor, 1));
        col.addColorStop(0.3, hexToRgba(rawColor, 0.6));
        col.addColorStop(0.7, hexToRgba(rawColor, 0.2));
        col.addColorStop(1, 'rgba(15,20,40,0)');

        // Dış Işık/Glow efekti
        ctx.save();
        ctx.shadowBlur = 12 * s.z;
        ctx.shadowColor = hexToRgba(rawColor, 0.8);
        
        ctx.fillStyle = col;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sxClamped, syClamped, rad * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Çekirdek (Parlak Merkez)
        ctx.globalAlpha = Math.min(1, alpha * 2);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sxClamped, syClamped, Math.max(0.6, rad * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Genel Ortam Işığı
      const target = ctx.createLinearGradient(0, 0, w, h);
      target.addColorStop(0, hexToRgba(rawColor, 0.12));
      target.addColorStop(0.5, 'rgba(0,0,0,0)');
      target.addColorStop(1, hexToRgba(rawColor, 0.15));
      ctx.fillStyle = target;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [w, h, dpr, rawColor]);

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