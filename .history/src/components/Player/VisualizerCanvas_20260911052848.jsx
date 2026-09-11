import React, { useRef, useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';

export const VisualizerCanvas = () => {
  const { analyserRef, isPlaying, initWebAudio } = useAudio();
  const { accentColor, themeStyle, gradientColors } = useSettings();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resizing
    const resize = () => {
      canvas.width = canvas.offsetWidth || 300;
      canvas.height = canvas.offsetHeight || 60;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Spectrum için Analyser kontrolü
      const analyser = analyserRef?.current;

      if (!analyser || !isPlaying) {
        // Müzik çalmıyorsa veya analyser yoksa düz/hafif bir çizgi çiz
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      // AudioContext uykudaysa otomatik uyandır
      if (analyser.context && analyser.context.state === 'suspended') {
        analyser.context.resume();
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Renk Ayarı
      let barColor = accentColor || '#9333ea';
      if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, gradientColors[0]);
        grad.addColorStop(1, gradientColors[1]);
        barColor = grad;
      }

      const barWidth = (width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        ctx.fillStyle = barColor;
        // Alt ve üst simetrik veya yuvarlatılmış çubuklar
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 1;
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserRef, isPlaying, accentColor, themeStyle, gradientColors]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-pointer"
      onClick={() => {
        if (typeof initWebAudio === 'function') initWebAudio();
      }}
    />
  );
};

export default VisualizerCanvas;