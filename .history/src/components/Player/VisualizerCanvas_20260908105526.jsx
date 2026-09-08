import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const { analyserNode, isPlaying } = useAudio();
  const { analyserRef, isPlaying } = useAudio();

  useEffect(() => {
    if (!canvasRef.current || !analyserNode) return;
    if (!canvasRef.current || !analyserRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const halfBars = Math.max(4, Math.floor(bufferLength / 2));
    const totalBars = halfBars * 2;
    const slotWidth = canvas.width / totalBars;
    const barWidth = slotWidth * 0.7;
    const gap = slotWidth * 0.3;

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(1, '#ec4899');

    let animationFrameId;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      analyserNode.getByteFrequencyData(dataArray);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = gradient;

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;
      for (let i = 0; i < totalBars; i++) {
        const freqIndex = i < halfBars ? (halfBars - 1 - i) : (i - halfBars);
        const val = dataArray[freqIndex] || 0;
        const barHeight = Math.max(3, (val / 255) * canvas.height);
        const x = i * slotWidth + gap / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 3;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }
      }
    };

    if (isPlaying) {
      render();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [analyserNode, isPlaying]);
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