'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShaderBackgroundProps {
  children?: React.ReactNode;
}

export default function ShaderBackground({ children }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Variables
    const canvas = canvasRef.current;
    const sizes = {
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight
    };

    // Cursor Settings
    const cursor = { x: 0, y: 0 };

    function randomInteger(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function rgb(r: number, g: number, b: number) {
      return new THREE.Vector3(r, g, b);
    }

    let vCheck = false;
    const randomisePosition = new THREE.Vector2(1, 2);

    // Shader code
    const sNoise = `
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                            -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i); // Avoid truncation effects in permutation
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));

        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
    `;

    const vertexShader = sNoise + `
      uniform float u_time;
      uniform vec2 u_randomisePosition;

      varying float vDistortion;
      varying float xDistortion;
      varying vec2 vUv;

      void main() {
          vUv = uv;
          vDistortion = snoise(vUv.xx * 1. - u_randomisePosition * 0.2);
          xDistortion = snoise(vUv.yy * 1. - u_randomisePosition * 0.1);
          vec3 pos = position;
          pos.z += (vDistortion * 1.);
          pos.x += (xDistortion * 1.);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = sNoise + `
      vec3 rgb(float r, float g, float b) {
          return vec3(r / 255., g / 255., b / 255.);
      }

      vec3 rgb(float c) {
          return vec3(c / 255., c / 255., c / 255.);
      }

      uniform vec3 u_bg;
      uniform vec3 u_bgMain;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform float u_time;

      varying vec2 vUv;
      varying float vDistortion;

      void main() {
          vec3 bg = rgb(u_bg.r, u_bg.g, u_bg.b);
          vec3 c1 = rgb(u_color1.r, u_color1.g, u_color1.b);
          vec3 c2 = rgb(u_color2.r, u_color2.g, u_color2.b);
          vec3 bgMain = rgb(u_bgMain.r, u_bgMain.g, u_bgMain.b);

          float noise1 = snoise(vUv + u_time * 0.2);
          float noise2 = snoise(vUv * 1.0 + u_time * 0.2);

          vec3 color = bg;
          color = mix(color, c1, noise1 * 0.008);
          color = mix(color, c2, noise2 * 0.008);

          color = mix(color, mix(c1, c2, vUv.x), vDistortion);

          float border = smoothstep(0.03, 0.7, vUv.x);

          color = mix(color, bgMain, 1. -border);

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Plane
    const gradientGeometry = new THREE.PlaneGeometry(8, 8, 40, 40);

    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        // Dark purple matte colors
        u_bg: { value: rgb(25, 15, 60) },        // Dark purple
        u_bgMain: { value: rgb(40, 25, 80) },     // Slightly lighter purple
        u_color1: { value: rgb(60, 40, 120) },    // Medium purple
        u_color2: { value: rgb(30, 20, 70) },     // Dark purple variant
        u_time: { value: 30 },
        u_randomisePosition: { value: randomisePosition }
      },
      fragmentShader,
      vertexShader,
    });

    const gradientPlane = new THREE.Mesh(gradientGeometry, gradientMaterial);
    scene.add(gradientPlane);

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Resize handler
    const resize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    // Event listeners
    const handleMouseMove = (event: MouseEvent) => {
      cursor.x = event.clientX / sizes.width - 0.5;
      cursor.y = event.clientY / sizes.height - 0.5;
    };

    const handleMouseOut = () => {
      cursor.x = 0;
      cursor.y = 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      cursor.x = touch.pageX / sizes.width - 0.5;
      cursor.y = touch.pageY / sizes.height - 0.5;
    };

    const handleTouchEnd = () => {
      cursor.x = 0;
      cursor.y = 0;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Animation
    const clock = new THREE.Clock();
    let previousTime = 0;
    let t = 0;
    let j = 0;
    let x = randomInteger(0, 32);

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - previousTime;
      previousTime = elapsedTime;

      gradientPlane.material.uniforms.u_randomisePosition.value = new THREE.Vector2(j, j);
      gradientPlane.material.uniforms.u_time.value = t;

      if (t % 0.1 == 0) {
        if (vCheck == false) {
          x -= 1;
          if (x <= 0) {
            vCheck = true;
          }
        } else {
          x += 1;
          if (x >= 32) {
            vCheck = false;
          }
        }
      }

      j = j + 0.01;
      t = t + 0.05;

      renderer.render(scene, camera);
      animationRef.current = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="shader-background-container">
      <canvas ref={canvasRef} className="webgl" />
      <div className="content-overlay">
        {children}
      </div>
      
      <style jsx>{`
        .shader-background-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
        }

        .webgl {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          outline: none;
          z-index: 0;
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