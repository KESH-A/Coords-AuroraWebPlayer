import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

const STAR_FIELD_SIZE = 90;
const STAR_BASE_SIZE = 0.7;
const STAR_MAX = 1.4;
const BG_COLOR = 'rgba(10, 14, 26, 0.55)';
const STAR_DESAT = 0.08;
const EDGE_FADE = 40;

export const DynamicCanvasBackground = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [dpr, setDpr] = useState(1);
  const { accentColor, gradientColors, themeStyle } = useSettings();
  const color1 = themeStyle === 'gradient' && gradientColors?.length >= 1 ? gradientColors[0] : accentColor || '#9333ea';
  const starsRef = useRef([]);
  const seedRef = useRef(0);

  const resize = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newW = Math.floor(rect.width);
    const newH = Math.floor(rect.height);
    const newDpr = window.devicePixelRatio || 1;
    if (newW !== w || newH !== h || newDpr !== dpr) {
      setW(newW);
      setH(newH);
      setDpr(newDpr);
      seedRef.current = Math.random();
      const stars = [];
      const count = Math.max(35, Math.min(90, Math.round(newW * newH / 16000)));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * newW,
          y: Math.random() * newH,
          z: 0.4 + Math.random() * 0.6,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: (Math.random() - 0.5) * 0.25,
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
    const baseSize = Math.max(0.4, Math.min(1.2, STAR_BASE_SIZE * (1 + (w / 1000) * 0.5)));
    const edgeW = EDGE_FADE;
    const edgeH = EDGE_FADE;
    const fadeIn = 1.6;
    const driftX = 0.14 * Math.cos(seedRef.current);
    const driftY = 0.1 * Math.sin(seedRef.current * 1.3 + 1);
    const pulseSpeed = 0.015 + (Math.random() * 0.01);
    let t = 0;

    const draw = () => {
      t += pulseSpeed;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, BG_COLOR);
      grad.addColorStop(1, 'rgba(5,8,18,0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const swayX = Math.sin(t * 0.4) * 0.6;
      const swayY = Math.cos(t * 0.55 + 1) * 0.6;
      const pulse = Math.sin(t * 1.1) * 0.15 + 0.85;

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
        const finalPulse = (Math.sin(t * 0.8 + s.phase) * 0.25 + 0.75) * pulse;
        const starSize = baseSize * s.z * finalPulse * edge * 0.9 + 0.2;
        const alpha = Math.max(0.04, Math.min(0.9, 0.18 * s.z * edge * finalPulse * (1 - (Math.abs(sxClamped - w/2) / (w/2)) * 0.3) * (1 - (Math.abs(syClamped - h/2) / (h/2)) * 0.3)));

        if (alpha < 0.02 || starSize < 0.15) continue;

        const rad = Math.max(0.4, starSize * 0.5);
        const col = ctx.createRadialGradient(sxClamped, syClamped, 0, sxClamped, syClamped, rad * 1.8);
        col.addColorStop(0, color1);
        col.addColorStop(0.5, color1 + 'aa');
        col.addColorStop(1, 'rgba(15,20,40,0)');
        ctx.fillStyle = col;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sxClamped, syClamped, rad * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.max(0.1, alpha * 1.6);
        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.arc(sxClamped, syClamped, Math.max(0.3, rad * 0.7), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      const target = ctx.createLinearGradient(0, 0, w, h);
      target.addColorStop(0, color1 + '08');
      target.addColorStop(0.5, 'rgba(0,0,0,0)');
      target.addColorStop(1, color1 + '12');
      ctx.fillStyle = target;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [w, h, dpr, color1]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: 0.85 }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default DynamicCanvasBackground;
