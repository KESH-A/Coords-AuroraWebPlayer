import React, { useEffect, useRef } from 'react';

const VisualizerCanvas = ({ audioRef, isPlaying, visualizerStyle = 'bars' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const phaseRef = useRef(0);
  const particlesRef = useRef([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        
        try {
          sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
        } catch (e) {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const handlePlay = () => initAudio();
    audio.addEventListener('play', handlePlay);
    if (isPlaying) initAudio();

    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: 40 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          alpha: Math.random() * 0.5 + 0.2
        }));
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    handleResize();

    let lastTime = 0;
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = (timestamp) => {
      animationRef.current = requestAnimationFrame(render);

      if (timestamp - lastTime < 16) return;
      lastTime = timestamp;

      phaseRef.current += 0.03;

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(phaseRef.current + i * 0.2) * 10 + 15;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      if (visualizerStyle === 'bars') {
        const barCount = 32;
        const barWidth = (width / barCount) * 0.6;
        const gap = (width / barCount) * 0.4;

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i] || 0;
          const percent = value / 255;
          const barHeight = Math.max(percent * (height * 0.7), 4);
          
          const x = i * (barWidth + gap) + gap / 2;
          const y = height - barHeight;

          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
          gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 1)');

          ctx.fillStyle = gradient;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      } else if (visualizerStyle === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#6366f1');
        ctx.strokeStyle = gradient;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (visualizerStyle === 'particles') {
        particlesRef.current.forEach((p, index) => {
          const freqValue = dataArray[index % bufferLength] || 0;
          const factor = 1 + freqValue / 128;

          p.x += p.vx * factor;
          p.y += p.vy * factor;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (factor * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(236, 72, 153, ${Math.min(p.alpha * factor, 1)})`;
          ctx.fill();
        });
      }
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [isPlaying, visualizerStyle]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none absolute inset-0"
    />
  );
};

export default VisualizerCanvas;