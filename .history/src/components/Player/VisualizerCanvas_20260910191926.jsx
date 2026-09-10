import React, { useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const dataRef = useRef(null);
  const heightsRef = useRef(null);
  const phaseRef = useRef(0);
  const synthNoiseRef = useRef(12345 + Math.random() * 233280);
  const isPlayingRef = useRef(false);

  const { analyserRef, isPlaying } = useAudio();
  const { accentColor, gradientColors, themeStyle, visualizerStyle, visualizerColor } = useSettings();

  isPlayingRef.current = isPlaying;

  const sanitizeColor = (colorStr, fallback = '#9333ea') => {
    if (!colorStr || typeof colorStr !== 'string') return fallback;
    if (colorStr === 'accent' || colorStr === 'primary') return fallback;
    return colorStr;
  };

  const activeColor = useMemo(() => {
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      return sanitizeColor(gradientColors[0], '#9333ea');
    }
    return sanitizeColor(accentColor, '#9333ea');
  }, [accentColor, gradientColors, themeStyle]);

  const getColor = (idx, total) => {
    if (visualizerColor === 'rainbow') {
      const h = (idx / total) * 360;
      return `hsl(${h}, 100%, 60%)`;
    }
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2 && idx < gradientColors.length) {
      return sanitizeColor(gradientColors[idx], activeColor);
    }
    return sanitizeColor(visualizerColor, activeColor);
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = 512;
    const dataArray = new Uint8Array(bufferLength);
    dataRef.current = dataArray;

    const synthSpectrum = () => {
      const t = phaseRef.current;
      const beat = Math.sin(t * 3.5) * 0.5 + 0.5;
      const amp = isPlayingRef.current ? 120 + beat * 135 : 15;
      const peakCenter = bufferLength * 0.35;
      for (let i = 0; i < bufferLength; i++) {
        const wave = Math.sin(i * 0.25 + t * 4) * 0.5 + 0.5;
        const peak = Math.exp(-Math.pow((i - peakCenter) / (bufferLength * 0.2), 2));
        synthNoiseRef.current = (synthNoiseRef.current * 9301 + 49297) % 233280;
        const jit = (synthNoiseRef.current / 233280) * 0.8;
        const v = wave * peak * amp + jit * amp * 0.4;
        dataArray[i] = Math.max(0, Math.min(255, Math.round(v)));
      }
    };

    const readSpectrum = () => {
      const live = analyserRef && analyserRef.current;
      if (live && live.getByteFrequencyData) {
        live.getByteFrequencyData(dataArray);
      } else {
        synthSpectrum();
      }
    };

    if (!heightsRef.current || heightsRef.current.length !== bufferLength) {
      heightsRef.current = new Float32Array(bufferLength).fill(0);
    }

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    });

    resizeObserver.observe(container);
    const rect = container.getBoundingClientRect();
    let dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const decayMultiplier = 0.65; // Tepki hızlandırıldı (eskisi 0.88)
    let lastTime = 0;

    const drawSpectrum = (w, h) => {
      const activeBarsCount = 12;
      const totalBars = activeBarsCount * 2;
      const slotWidth = w / totalBars;
      const barWidth = Math.max(2, slotWidth * 0.7);
      const gap = slotWidth - barWidth;
      const radius = Math.min(barWidth / 2, 4);

      for (let i = 0; i < totalBars; i++) {
        const freqIndex = (i < activeBarsCount ? (activeBarsCount - 1 - i) : (i - activeBarsCount)) * 3;
        const val = dataArray[freqIndex] || 0;
        const targetHeight = Math.max(3, (val / 255) * h);
        heightsRef.current[i] = heightsRef.current[i] * decayMultiplier + targetHeight * (1 - decayMultiplier);
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < totalBars; i++) {
        const barHeight = heightsRef.current[i];
        const x = i * slotWidth + gap / 2;
        const y = h - barHeight;
        const color = getColor(i, totalBars);
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    const drawCircular = (w, h) => {
      ctx.clearRect(0, 0, w, h);
      const bars = 48;
      const baseRadius = Math.min(w, h) * 0.18;
      const centerX = w / 2;
      const centerY = h / 2;

      for (let i = 0; i < bars; i++) {
        const freqIndex = (i % 16) * 4;
        const val = dataArray[freqIndex] || 0;
        const targetHeight = (val / 255) * (baseRadius * 1.8);
        const idx = i;
        heightsRef.current[idx] = heightsRef.current[idx] * decayMultiplier + targetHeight * (1 - decayMultiplier);

        const angle = (i / bars) * Math.PI * 2 + phaseRef.current;
        const barH = heightsRef.current[idx];

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barH);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barH);

        ctx.strokeStyle = getColor(i, bars);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawFluid = (w, h) => {
      ctx.clearRect(0, 0, w, h);
      const points = 36;
      const baseRadius = Math.min(w, h) * 0.22;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Dinamik Frekans Dalgası (Blob Şekli)
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const idx = i % points;
        const val = dataArray[idx * 3] || 0;
        const targetR = baseRadius + (val / 255) * baseRadius * 1.2;
        
        heightsRef.current[idx] = heightsRef.current[idx] * decayMultiplier + targetR * (1 - decayMultiplier);
        const r = heightsRef.current[idx];
        const angle = (i / points) * Math.PI * 2 + phaseRef.current;

        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const safeColor = getColor(0, 1);
      ctx.fillStyle = safeColor;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = safeColor;
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      // Bas Temposuna Göre Büyüyen İç Glow Pulse
      const bassVal = (dataArray[2] || 0) / 255;
      const pulseR = Math.max(1, baseRadius * (0.6 + bassVal * 0.8));
      
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseR);
      grad.addColorStop(0, safeColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      ctx.restore();
    };

    const drawVHS = (w, h) => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
      ctx.fillRect(0, 0, w, h);

      const scanOffset = (phaseRef.current * h * 0.2) % h;
      const scanGrad = ctx.createLinearGradient(0, scanOffset - 25, 0, scanOffset + 25);
      scanGrad.addColorStop(0, 'rgba(0, 255, 180, 0)');
      scanGrad.addColorStop(0.5, 'rgba(0, 255, 180, 0.15)');
      scanGrad.addColorStop(1, 'rgba(0, 255, 180, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, 0, w, h);

      const barCount = 24;
      const barWidth = w / barCount;
      const maxHeight = h * 0.75;
      const centerY = h * 0.5;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * 4] || 0;
        const targetHeight = (val / 255) * maxHeight;
        const idx = i;
        heightsRef.current[idx] = heightsRef.current[idx] * decayMultiplier + targetHeight * (1 - decayMultiplier);

        const x = i * barWidth + 2;
        const barH = Math.max(4, heightsRef.current[idx]);
        const y = centerY - barH / 2;

        ctx.fillStyle = getColor(i, barCount);
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, barWidth - 4, barH);

        // Neon Çerçeve Glitch Efekti
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x, y, barWidth - 4, barH);
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 4; i++) {
        const y = ((scanOffset + i * (h / 4)) % h);
        ctx.fillRect(0, y, w, 1);
      }
    };

    const render = (timestamp) => {
      if (!canvasRef.current) return;
      animFrameRef.current = requestAnimationFrame(render);

      if (timestamp - lastTime < 16) return;
      lastTime = timestamp;
      phaseRef.current += 0.04;

      const r = container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      readSpectrum();

      dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);

      const styleKey = (visualizerStyle || '').toLowerCase();

      if (styleKey.includes('circular') || styleKey.includes('circle')) {
        drawCircular(r.width, r.height);
      } else if (styleKey.includes('fluid') || styleKey.includes('wave')) {
        drawFluid(r.width, r.height);
      } else if (styleKey.includes('vhs') || styleKey.includes('retro')) {
        drawVHS(r.width, r.height);
      } else {
        drawSpectrum(r.width, r.height);
      }
    };

    render();
    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserRef, accentColor, themeStyle, gradientColors, visualizerStyle, visualizerColor]);

  return (
    <div ref={containerRef} className="w-full h-14 relative overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};