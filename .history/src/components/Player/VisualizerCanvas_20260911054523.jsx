import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const dataRef = useRef(null);
  const phaseRef = useRef(0);
  const synthNoiseRef = useRef(12345 + Math.random() * 233280);
  const isPlayingRef = useRef(false);

  // AudioContext'ten initWebAudio'yu da çekiyoruz
  const { analyserRef, isPlaying, initWebAudio } = useAudio();
  const { accentColor, gradientColors, themeStyle, visualizerStyle, visualizerColor } = useSettings();

  isPlayingRef.current = isPlaying;

  // RELOAD SONRASI OTOMATİK HAZIRLIK (MOUNT CHECK)
  useEffect(() => {
    // Sayfa yenilendiğinde/yüklendiğinde AudioContext zincirini hemen hazırla
    if (typeof initWebAudio === 'function') {
      initWebAudio();
    }

    // Tarayıcı kısıtlamasını aşmak için ilk tık/tuş basımında da hazıra geçir
    const handleFirstUserAction = () => {
      if (typeof initWebAudio === 'function') {
        initWebAudio();
      }
      window.removeEventListener('click', handleFirstUserAction);
      window.removeEventListener('keydown', handleFirstUserAction);
    };

    window.addEventListener('click', handleFirstUserAction);
    window.addEventListener('keydown', handleFirstUserAction);

    return () => {
      window.removeEventListener('click', handleFirstUserAction);
      window.removeEventListener('keydown', handleFirstUserAction);
    };
  }, []);

  const sanitizeColor = (colorStr, fallback = '#9333ea') => {
    if (!colorStr || typeof colorStr !== 'string') return fallback;
    if (colorStr === 'accent' || colorStr === 'primary') return fallback;
    return colorStr;
  };

  const getColor = (idx, total) => {
    if (visualizerColor === 'rgb-cycle') {
      const hue = (phaseRef.current * 40 + (idx / total) * 180) % 360;
      return `hsl(${hue}, 90%, 62%)`;
    }

    if (visualizerColor === 'accent' && accentColor === 'rgb-cycle') {
      const hue = (phaseRef.current * 40 + (idx / total) * 90) % 360;
      return `hsl(${hue}, 90%, 62%)`;
    }

    if (visualizerColor === 'rainbow') {
      const h = (idx / total) * 360;
      return `hsl(${h}, 85%, 60%)`;
    }

    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      if (visualizerColor === 'accent' || !visualizerColor) {
        const colorIndex = idx % gradientColors.length;
        return sanitizeColor(gradientColors[colorIndex], '#9333ea');
      }
    }

    const activeAccent = accentColor === 'rgb-cycle' 
      ? `hsl(${(phaseRef.current * 40) % 360}, 90%, 62%)` 
      : sanitizeColor(accentColor, '#9333ea');

    return sanitizeColor(visualizerColor === 'accent' ? activeAccent : visualizerColor, activeAccent);
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    dataRef.current = dataArray;

    const synthSpectrum = () => {
      const t = phaseRef.current;
      const beat = Math.pow(Math.sin(t * 3), 6);
      const amp = isPlayingRef.current ? 180 + beat * 75 : 10;
      for (let i = 0; i < 14; i++) {
        synthNoiseRef.current = (synthNoiseRef.current * 9301 + 49297) % 233280;
        const jit = (synthNoiseRef.current / 233280) * 0.4;
        const v = (1 - i / 14) * amp + jit * amp * 0.3;
        dataArray[i] = Math.max(0, Math.min(255, Math.round(v)));
      }
    };

    const readSpectrum = () => {
      const live = analyserRef && analyserRef.current;

      // Eğer analyser yoksa bile hemen initWebAudio çağırıp oluşturmayı dene
      if (!live && isPlayingRef.current && typeof initWebAudio === 'function') {
        initWebAudio();
      }

      if (live && live.getByteFrequencyData) {
        if (live.context && live.context.state === 'suspended' && isPlayingRef.current) {
          live.context.resume();
        }

        live.smoothingTimeConstant = 0.45;
        live.getByteFrequencyData(dataArray);

        // Veri boş geliyorsa ve müzik çalıyorsa fallback çalışsın
        const isSilent = dataArray.every((val) => val === 0);
        if (isSilent && isPlayingRef.current) {
          synthSpectrum();
        }
      } else {
        synthSpectrum();
      }
    };

    const getMirroredActiveData = () => {
      const active7 = [];
      for (let i = 0; i < 7; i++) {
        active7.push(dataArray[i * 2] || 0);
      }
      const reversed = [...active7].reverse();
      return [...reversed, ...active7];
    };

    const updateCanvasSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || container.clientWidth || 300;
      const height = rect.height || container.clientHeight || 56;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);
    let lastTime = 0;

    const drawSpectrum = (w, h) => {
      const mirrored = getMirroredActiveData();
      const totalBars = mirrored.length;
      const slotWidth = w / totalBars;
      const barWidth = Math.max(3, slotWidth * 0.65);
      const gap = slotWidth - barWidth;
      const radius = Math.min(barWidth / 2, 6);

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < totalBars; i++) {
        const val = mirrored[i];
        const barHeight = Math.max(4, (val / 255) * h);
        const x = i * slotWidth + gap / 2;
        const y = h - barHeight;

        ctx.fillStyle = getColor(i, totalBars);
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
      const mirrored = getMirroredActiveData();
      const fullCircleData = [...mirrored, ...mirrored];
      const bars = fullCircleData.length;
      
      const bassVal = mirrored[6] / 255;
      const baseRadius = Math.max(10, Math.min(w, h) * (0.18 + bassVal * 0.05));
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = getColor(0, 1);
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.8;
      ctx.stroke();

      for (let i = 0; i < bars; i++) {
        const val = fullCircleData[i];
        const barH = Math.max(2, (val / 255) * (baseRadius * 0.8));

        const angle = (i / bars) * Math.PI * 2 + phaseRef.current * 0.2;
        const x1 = centerX + Math.cos(angle) * (baseRadius + 2);
        const y1 = centerY + Math.sin(angle) * (baseRadius + 2);
        const x2 = centerX + Math.cos(angle) * (baseRadius + 2 + barH);
        const y2 = centerY + Math.sin(angle) * (baseRadius + 2 + barH);

        ctx.strokeStyle = getColor(i, bars);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    };

    const drawFluid = (w, h) => {
      ctx.clearRect(0, 0, w, h);
      const mirrored = getMirroredActiveData();
      const points = mirrored.length;
      const centerX = w / 2;
      const centerY = h / 2;
      const bassVal = mirrored[6] / 255;
      const baseRadius = Math.max(10, Math.min(w, h) * (0.18 + bassVal * 0.06));

      const pts = [];
      for (let i = 0; i < points; i++) {
        const val = mirrored[i];
        const r = baseRadius + (val / 255) * baseRadius * 0.7;
        const angle = (i / points) * Math.PI * 2 + phaseRef.current * 0.3;
        pts.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }

      ctx.save();
      const mainColor = getColor(0, 1);

      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[points - 1].x) / 2, (pts[0].y + pts[points - 1].y) / 2);

      for (let i = 0; i < points; i++) {
        const next = pts[(i + 1) % points];
        const midX = (pts[i].x + next.x) / 2;
        const midY = (pts[i].y + next.y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      ctx.closePath();

      ctx.fillStyle = mainColor;
      ctx.globalAlpha = 0.25;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = mainColor;
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      ctx.restore();
    };

    const render = (timestamp) => {
      animFrameRef.current = requestAnimationFrame(render);

      if (timestamp - lastTime < 16) return;
      lastTime = timestamp;

      phaseRef.current += 0.01;

      const r = container.getBoundingClientRect();
      const width = r.width || container.clientWidth;
      const height = r.height || container.clientHeight;

      if (!width || !height) return;

      readSpectrum();

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const styleKey = (visualizerStyle || '').toLowerCase();

      try {
        if (styleKey.includes('circular') || styleKey.includes('circle')) {
          drawCircular(width, height);
        } else if (styleKey.includes('fluid') || styleKey.includes('wave')) {
          drawFluid(width, height);
        } else {
          drawSpectrum(width, height);
        }
      } catch (e) {
        drawSpectrum(width, height);
      }
    };

    render();
    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserRef, accentColor, themeStyle, gradientColors, visualizerStyle, visualizerColor, isPlaying]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-14 relative overflow-hidden rounded-lg cursor-pointer"
      onClick={() => {
        if (typeof initWebAudio === 'function') initWebAudio();
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};