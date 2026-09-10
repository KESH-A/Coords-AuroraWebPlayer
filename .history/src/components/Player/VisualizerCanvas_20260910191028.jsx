import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const { analyserRef, visualizerStyle, visualizerColor } = usePlayer();
  const heightsRef = useRef(new Array(14).fill(0));

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const dataArray = new Uint8Array(analyserRef.current ? analyserRef.current.frequencyBinCount : 64);

    const getColor = (index, total) => {
      if (visualizerColor === 'rainbow') {
        const hue = (index / total) * 360;
        return `hsl(${hue}, 80%, 60%)`;
      }
      if (visualizerColor === 'neon') {
        return index % 2 === 0 ? '#00f3ff' : '#ff00ff';
      }
      if (visualizerColor === 'fire') {
        return index % 2 === 0 ? '#ff4500' : '#ff8c00';
      }
      return visualizerColor || '#9333ea';
    };

    const render = () => {
      animId = requestAnimationFrame(render);

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (visualizerStyle === 'wave' || visualizerStyle === 'fluid') {
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = getColor(0, 1);

        const sliceWidth = w / 16;
        let x = 0;

        for (let i = 0; i <= 16; i++) {
          const val = (dataArray[i % 7] || 0) / 255;
          const y = h / 2 + Math.sin(i + Date.now() * 0.005) * val * (h / 2);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        // Spectrum / Classic Mode (Aynalanmış 14 Sütun)
        const activeBarsCount = 7;
        const totalBars = activeBarsCount * 2;
        const slotWidth = w / totalBars;
        const barWidth = Math.max(2, slotWidth * 0.65);
        const gap = slotWidth - barWidth;
        const radius = Math.min(barWidth / 2, 4);
        const decayMultiplier = 0.82;

        for (let i = 0; i < totalBars; i++) {
          const freqIndex = i < activeBarsCount 
            ? (activeBarsCount - 1 - i) 
            : (i - activeBarsCount);

          const val = dataArray[freqIndex] || 0;
          const targetHeight = Math.max(3, (val / 255) * h);
          heightsRef.current[i] = (heightsRef.current[i] || 0) * decayMultiplier + targetHeight * (1 - decayMultiplier);
        }

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < totalBars; i++) {
          const barHeight = heightsRef.current[i];
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
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [analyserRef, visualizerStyle, visualizerColor]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default VisualizerCanvas;