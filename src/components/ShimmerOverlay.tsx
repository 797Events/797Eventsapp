'use client';

import { useEffect, useRef } from 'react';

// Perlin noise implementation
class PerlinNoise {
  private p: number[];

  constructor() {
    this.p = new Array(512);
    this.init();
  }

  private init() {
    for (let i = 0; i < 256; i++) {
      this.p[i] = this.p[i + 256] = Math.floor(Math.random() * 256);
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
      this.lerp(
        u,
        this.grad(this.p[A + 1], x, y - 1),
        this.grad(this.p[B + 1], x - 1, y - 1)
      )
    );
  }

  generatePerlinNoise(width: number, height: number, cellSize: number): HTMLCanvasElement {
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const noiseCtx = noiseCanvas.getContext('2d')!;
    const imageData = noiseCtx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = ((this.noise(x / cellSize, y / cellSize) + 1) / 2) * 255;
        const cell = (x + y * width) * 4;
        data[cell] = data[cell + 1] = data[cell + 2] = value;
        data[cell + 3] = 255;
      }
    }

    noiseCtx.putImageData(imageData, 0, 0);
    return noiseCanvas;
  }

  createSeamlessPerlinNoise(width: number, height: number, cellSize: number): string {
    const singleNoise = this.generatePerlinNoise(width, height, cellSize);
    const seamlessCanvas = document.createElement('canvas');
    seamlessCanvas.width = width * 4;
    seamlessCanvas.height = height;
    const seamlessCtx = seamlessCanvas.getContext('2d')!;

    // Draw first noise pattern
    seamlessCtx.drawImage(singleNoise, 0, 0);

    // Draw flipped middle pattern
    seamlessCtx.save();
    seamlessCtx.translate(width * 2, 0);
    seamlessCtx.scale(-1, 1);
    seamlessCtx.drawImage(singleNoise, 0, 0);
    seamlessCtx.restore();

    // Draw third noise pattern
    seamlessCtx.drawImage(singleNoise, width * 2, 0);

    // Draw flipped fourth image
    seamlessCtx.save();
    seamlessCtx.translate(width * 4, 0);
    seamlessCtx.scale(-1, 1);
    seamlessCtx.drawImage(singleNoise, 0, 0);
    seamlessCtx.restore();

    return seamlessCanvas.toDataURL();
  }
}

interface ShimmerOverlayProps {
  className?: string;
}

export default function ShimmerOverlay({ className = '' }: ShimmerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const perlinRef = useRef<PerlinNoise | null>(null);

  // Settings optimized for overlay effect
  const settings = {
    shapeType: 'Square' as 'Circle' | 'Square',
    size: 12,
    gap: 6,
    colors: ['rgb(255,255,255)', 'rgb(168,85,247)', 'rgb(147,51,234)'], // White and purple variants
    contrast: 3,
    speed: 25,
    animate: true
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const container = containerRef.current;

    // Initialize Perlin noise
    if (!perlinRef.current) {
      perlinRef.current = new PerlinNoise();
    }
    const perlin = perlinRef.current;

    // Function to get random opacity with contrast
    function getRandomOpacity(): number {
      let opacity = Math.random();
      if (settings.contrast > 0) {
        opacity = Math.pow(opacity, 1 + settings.contrast / 5);
      } else if (settings.contrast < 0) {
        opacity = 1 - Math.pow(1 - opacity, 1 - settings.contrast / 5);
      }
      return opacity * 0.6; // Reduce overall opacity for overlay effect
    }

    // Function to draw shapes
    function drawShapes() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colorBatch = settings.colors.length > 0 ? settings.colors : ['rgb(128,128,128)'];

      for (let y = 0; y < canvas.height; y += settings.size + settings.gap) {
        for (let x = 0; x < canvas.width; x += settings.size + settings.gap) {
          const color = colorBatch[Math.floor(Math.random() * colorBatch.length)];
          const opacity = getRandomOpacity();
          ctx.fillStyle = color.replace(')', `,${opacity})`).replace('rgb', 'rgba');

          if (settings.shapeType === 'Square') {
            ctx.fillRect(x, y, settings.size, settings.size);
          } else {
            ctx.beginPath();
            ctx.arc(
              x + settings.size / 2,
              y + settings.size / 2,
              settings.size / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();
          }
        }
      }
    }

    // Function to update mask
    function updateMask() {
      if (settings.animate) {
        const width = canvas.width;
        const height = canvas.height;
        const cellSize = Math.max(25, settings.size * 2);
        const perlinNoiseDataUrl = perlin.createSeamlessPerlinNoise(width, height, cellSize);

        // Size-dependent animation calculations
        const sizeFactor = Math.max(1, settings.size / 3);
        const baseValue = width * 2250 * sizeFactor;
        const maxSpeed = 100;
        const powerFactor = Math.log(baseValue / (baseValue / 100)) / Math.log(maxSpeed);
        const animationDuration = Math.round(baseValue / Math.pow(settings.speed, powerFactor));

        // Size-dependent mask position scaling
        const maskTravelDistance = 300 * (settings.size / 10);

        // Dynamic keyframe injection
        let style = document.getElementById('shimmer-mask-animation');
        if (!style) {
          style = document.createElement('style');
          style.id = 'shimmer-mask-animation';
          document.head.appendChild(style);
        }

        style.textContent = `
          @keyframes moveShimmerMask {
            0% { 
              mask-position: 0% 0%;
              -webkit-mask-position: 0% 0%;
            }
            100% { 
              mask-position: -${maskTravelDistance}% 0%;
              -webkit-mask-position: -${maskTravelDistance}% 0%;
            }
          }
        `;

        // Apply mask properties (with type assertion for webkit properties)
        canvas.style.maskImage = `url(${perlinNoiseDataUrl})`;
        (canvas.style as any).webkitMaskImage = `url(${perlinNoiseDataUrl})`;
        canvas.style.maskMode = 'luminance';
        (canvas.style as any).webkitMaskMode = 'luminance';
        canvas.style.maskSize = `${300 * sizeFactor}% 100%`;
        (canvas.style as any).webkitMaskSize = `${300 * sizeFactor}% 100%`;
        canvas.style.maskRepeat = 'repeat-x';
        (canvas.style as any).webkitMaskRepeat = 'repeat-x';
        canvas.style.animation = `moveShimmerMask ${animationDuration}ms linear infinite`;
        canvas.style.willChange = 'mask-position';
      } else {
        canvas.style.animation = 'none';
        (canvas.style as any).webkitAnimation = 'none';
        canvas.style.maskImage = 'none';
        (canvas.style as any).webkitMaskImage = 'none';
      }
    }

    // Function to resize canvas
    function resizeCanvas() {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      drawShapes();
      updateMask();
    }

    // Initialize
    resizeCanvas();

    // Set up resize observer for better performance
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      // Clean up animation style if it exists
      const style = document.getElementById('shimmer-mask-animation');
      if (style) {
        style.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-10 opacity-40 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          mixBlendMode: 'overlay',
          filter: 'blur(0.3px)'
        }}
      />
    </div>
  );
}