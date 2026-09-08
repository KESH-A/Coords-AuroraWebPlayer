import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const { analyserRef, isPlaying } = useAudio();

  useEffect(() => {
    if (!canvasRef.current || !analyserRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const halfBars = Math.max(4, Math.floor(bufferLength / 2));
    const totalBars = halfBars * 2;
    const slotWidth = canvas.width / totalBars;
    const barWidth = slotWidth * 0.7;
    const gap = slotWidth * 0.3;
    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssW = rect.width || 320;
      const cssH = rect.height || 64;
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      return { width: cssW, height: cssH, dpr };
    };

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(1, '#ec4899');

    let animationFrameId;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const { width, height, dpr } = syncCanvasSize();
      if (width === 0 || height === 0) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const halfBars = Math.max(4, Math.floor(bufferLength / 2));
      const totalBars = halfBars * 2;
      const slotWidth = width / totalBars;
      const barWidth = Math.max(2, slotWidth * 0.7);
      const gap = slotWidth - barWidth;
      const radius = Math.min(barWidth / 2, 4);

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;

      for (let i = 0; i < totalBars; i++) {
        const freqIndex = i < halfBars ? (halfBars - 1 - i) : (i - halfBars);
        const val = dataArray[freqIndex] || 0;
        const barHeight = Math.max(3, (val / 255) * canvas.height);
        const barHeight = Math.max(3, (val / 255) * height);
        const x = i * slotWidth + gap / 2;
        const y = height - barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    if (isPlaying) {
      render();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { width, height, dpr } = syncCanvasSize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [analyserRef, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className="w-full h-16 rounded-xl bg-black/20 backdrop-blur-md border border-white/5"
    />
  );
};
};