import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const barHeightsRef = useRef(null);
  const { analyserRef, isPlaying } = useAudio();

  useEffect(() => {
    if (!canvasRef.current || !analyserRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    if (!barHeightsRef.current || barHeightsRef.current.length !== bufferLength) {
      barHeightsRef.current = new Float32Array(bufferLength).fill(0);
    }

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

    const decayMultiplier = 0.88;
    const minimalHeight = 0.5;

    let animationFrameId;
    let isDecayActive = false;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const { width, height, dpr } = syncCanvasSize();
      if (width === 0 || height === 0) return;

      analyser.getByteFrequencyData(dataArray);

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

      const heights = barHeightsRef.current;
      let allBelowThreshold = true;

      for (let i = 0; i < totalBars; i++) {
        const freqIndex = i < halfBars ? (halfBars - 1 - i) : (i - halfBars);
        let targetHeight;

        if (isPlaying) {
          const val = dataArray[freqIndex] || 0;
          targetHeight = Math.max(3, (val / 255) * height);
          heights[i] = targetHeight;
          allBelowThreshold = false;
        } else {
          heights[i] *= decayMultiplier;
          if (heights[i] < minimalHeight) {
            heights[i] = 0;
          } else {
            allBelowThreshold = false;
          }
          targetHeight = heights[i];
        }

        const barHeight = targetHeight;
        const x = i * slotWidth + gap / 2;
        const y = height - barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      if (!isPlaying && allBelowThreshold && isDecayActive) {
        isDecayActive = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      } else if (!isDecayActive && !isPlaying) {
        isDecayActive = true;
      }
    };

    if (isPlaying) {
      render();
    } else {
      isDecayActive = true;
      render();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [analyserRef, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-10 rounded-lg bg-black/20 border border-white/5"
    />
  );
};