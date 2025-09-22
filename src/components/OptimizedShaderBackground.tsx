'use client';

import React, { useEffect, useRef, useState } from 'react';

interface OptimizedShaderBackgroundProps {
  children?: React.ReactNode;
}

export default function OptimizedShaderBackground({ children }: OptimizedShaderBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const animationRef = useRef<number>();

  useEffect(() => {
    // Check if device can handle WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      setUseFallback(true);
      setIsLoaded(true);
      return;
    }

    // Check device performance indicators
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    if (isMobile || isLowEnd) {
      setUseFallback(true);
      setIsLoaded(true);
      return;
    }

    // Lazy load Three.js only when needed
    const loadThreeJS = async () => {
      try {
        const THREE = await import('three');

        if (!canvasRef.current) return;

        // Simplified shader background setup
        const canvas = canvasRef.current;
        const sizes = {
          width: window.innerWidth,
          height: window.innerHeight
        };

        // Simple noise function for better performance
        const fragmentShader = `
          uniform float u_time;
          uniform vec2 u_resolution;
          varying vec2 vUv;

          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
          }

          float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;

            // Create gradient base
            vec3 color1 = vec3(0.1, 0.06, 0.24); // Dark purple
            vec3 color2 = vec3(0.16, 0.1, 0.31); // Medium purple
            vec3 color3 = vec3(0.12, 0.08, 0.27); // Purple variant

            // Slow moving noise
            float n1 = noise(st * 2.0 + u_time * 0.01);
            float n2 = noise(st * 3.0 + u_time * 0.015);

            // Mix colors based on position and noise
            vec3 color = mix(color1, color2, st.y);
            color = mix(color, color3, n1 * 0.3);
            color += vec3(n2 * 0.05);

            gl_FragColor = vec4(color, 1.0);
          }
        `;

        const vertexShader = `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Simple plane geometry with lower resolution
        const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);

        const material = new THREE.ShaderMaterial({
          uniforms: {
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2(sizes.width, sizes.height) }
          },
          fragmentShader,
          vertexShader,
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // Camera
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

        // Renderer with performance optimizations
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: false, // Disabled for performance
          alpha: false,
          powerPreference: "high-performance"
        });

        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Limited to 1 for performance
        rendererRef.current = renderer;

        // Optimized resize handler
        let resizeTimeout: NodeJS.Timeout;
        const resize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(sizes.width, sizes.height);
            material.uniforms.u_resolution.value.set(sizes.width, sizes.height);
          }, 100);
        };

        window.addEventListener('resize', resize);

        // Optimized animation loop with frame limiting
        let lastFrame = 0;
        const targetFPS = 30; // Limit to 30 FPS for better performance
        const frameInterval = 1000 / targetFPS;

        const tick = (currentTime: number) => {
          if (currentTime - lastFrame >= frameInterval) {
            material.uniforms.u_time.value = currentTime * 0.001;
            renderer.render(scene, camera);
            lastFrame = currentTime;
          }
          animationRef.current = requestAnimationFrame(tick);
        };

        tick(0);
        setIsLoaded(true);

        return () => {
          window.removeEventListener('resize', resize);
          clearTimeout(resizeTimeout);

          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          if (renderer) {
            renderer.dispose();
          }

          if (scene) {
            scene.clear();
          }
        };
      } catch (error) {
        console.error('Failed to load Three.js:', error);
        setUseFallback(true);
        setIsLoaded(true);
      }
    };

    // Delay loading slightly to prioritize critical content
    const timer = setTimeout(loadThreeJS, 100);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // CSS-only fallback for low-end devices
  const FallbackBackground = () => (
    <div className="fallback-background">
      <style jsx>{`
        .fallback-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #190f3c 0%,
            #281950 25%,
            #1f1145 50%,
            #251851 75%,
            #190f3c 100%
          );
          z-index: 0;
        }

        .fallback-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 80%, rgba(96, 64, 192, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(128, 96, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(72, 48, 144, 0.12) 0%, transparent 50%);
          animation: gradientShift 20s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.1) rotate(180deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="background-container">
      {/* Show loading state */}
      {!isLoaded && (
        <div className="loading-background">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Render appropriate background */}
      {isLoaded && (
        useFallback ? (
          <FallbackBackground />
        ) : (
          <canvas
            ref={canvasRef}
            className="webgl"
            style={{ opacity: isLoaded ? 1 : 0 }}
          />
        )
      )}

      {/* Content overlay */}
      <div className="content-overlay">
        {children}
      </div>

      <style jsx>{`
        .background-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
        }

        .loading-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #190f3c;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid rgba(147, 51, 234, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .webgl {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          outline: none;
          z-index: 0;
          transition: opacity 0.5s ease-in-out;
        }

        .content-overlay {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100vh;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}