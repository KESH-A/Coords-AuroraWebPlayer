export const extractPalette = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const colorCounts = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          if (!colorCounts[key]) colorCounts[key] = { count: 0, r: 0, g: 0, b: 0 };
          colorCounts[key].count++;
          colorCounts[key].r += r;
          colorCounts[key].g += g;
          colorCounts[key].b += b;
        }
        const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);
        const getColor = (entry) => {
          const r = Math.round(entry.r / entry.count);
          const g = Math.round(entry.g / entry.count);
          const b = Math.round(entry.b / entry.count);
          return { r, g, b, hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}` };
        };
        const dominant = sorted[0] ? getColor(sorted[0]) : { hex: '#8b5cf6', r: 139, g: 92, b: 246 };
        const accent = sorted[1] ? getColor(sorted[1]) : dominant;
        const vibrant = sorted[2] ? getColor(sorted[2]) : accent;
        resolve({ dominant, accent, vibrant });
      } catch (e) {
        resolve({ dominant: { hex: '#8b5cf6', r: 139, g: 92, b: 246 }, accent: { hex: '#ec4899', r: 236, g: 72, b: 153 }, vibrant: { hex: '#f59e0b', r: 245, g: 158, b: 11 } });
      }
    };
    img.onerror = () => {
      resolve({ dominant: { hex: '#8b5cf6', r: 139, g: 92, b: 246 }, accent: { hex: '#ec4899', r: 236, g: 72, b: 153 }, vibrant: { hex: '#f59e0b', r: 245, g: 158, b: 11 } });
    };
    img.src = imageSrc;
  });
};