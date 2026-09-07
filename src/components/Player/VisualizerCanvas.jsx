import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';

export const VisualizerCanvas = () => {
  const canvasRef = useRef(null);
  const { analyserNode, isPlaying } = useAudio();

  useEffect(() => {
    if (!canvasRef.current || !analyserNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrameId;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 3;
      }
    };

    if (isPlaying) {
      render();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [analyserNode, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className="w-full h-16 rounded-xl bg-black/20 backdrop-blur-md border border-white/5"
    />
  );
};