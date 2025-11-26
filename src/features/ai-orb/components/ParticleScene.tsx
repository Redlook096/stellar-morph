import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface ParticleSceneProps {
  onSceneReady?: (scene: ParticleSceneController) => void;
}

export interface ParticleSceneController {
  morphToText: (text: string) => void;
  morphToSphere: () => void;
  morphToWaves: () => void;
  morphToBreathing: () => void;
}

const ParticleScene = ({ onSceneReady }: ParticleSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const currentStateRef = useRef<'sphere' | 'text' | 'waves' | 'breathing'>('sphere');
  const breathingPhaseRef = useRef(0);
  const originalPositionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const count = 12000;
    let animationFrameId: number;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Create particles
    const createParticles = () => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      const sphericalDistribution = (i: number) => {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        return {
          x: 8 * Math.cos(theta) * Math.sin(phi),
          y: 8 * Math.sin(theta) * Math.sin(phi),
          z: 8 * Math.cos(phi)
        };
      };

      for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        color.setHSL(0.55 + depth * 0.15, 0.8, 0.5 + depth * 0.2);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
      });

      const particles = new THREE.Points(geometry, material);
      particlesRef.current = particles;
      scene.add(particles);
    };

    createParticles();

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (particlesRef.current && currentStateRef.current === 'sphere') {
        particlesRef.current.rotation.y += 0.001;
      } else if (particlesRef.current && currentStateRef.current === 'waves') {
        // Animate waves
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < count; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const waveOffset = Math.sin(x * 0.5 + time * 2) * 0.8 + Math.sin(y * 0.3 + time * 1.5) * 0.6;
          positions[i * 3 + 2] = waveOffset;
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      } else if (particlesRef.current && currentStateRef.current === 'breathing') {
        // Complex breathing animation from current positions
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
        const time = Date.now() * 0.001;
        
        if (originalPositionsRef.current) {
          for (let i = 0; i < count; i++) {
            const originalX = originalPositionsRef.current[i * 3];
            const originalY = originalPositionsRef.current[i * 3 + 1];
            const originalZ = originalPositionsRef.current[i * 3 + 2];
            
            // Calculate distance from center for radial variation
            const distFromCenter = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ);
            const normalizedDist = distFromCenter / 15; // Normalize to 0-1 range
            
            // Multiple layered breathing frequencies for complexity
            const particlePhase = (i / count) * Math.PI * 4;
            const spatialPhase = (originalX * 0.1 + originalY * 0.15 + originalZ * 0.12);
            
            // Core breathing pulse - main rhythm
            const corePulse = Math.sin(time * 1.8 + particlePhase) * 0.25;
            
            // Secondary pulse - faster, adds complexity
            const secondaryPulse = Math.sin(time * 3.2 + spatialPhase) * 0.15;
            
            // Tertiary pulse - creates wave-like propagation
            const tertiaryPulse = Math.sin(time * 4.5 + normalizedDist * Math.PI * 2) * 0.08;
            
            // Slow drift for organic feel
            const drift = Math.sin(time * 0.7 + particlePhase * 0.5) * 0.12;
            
            // Combine all pulses with distance-based scaling
            const combinedPulse = (corePulse + secondaryPulse + tertiaryPulse + drift) * (0.8 + normalizedDist * 0.4);
            
            // Direction from origin (normalized)
            const dirX = originalX / (distFromCenter || 1);
            const dirY = originalY / (distFromCenter || 1);
            const dirZ = originalZ / (distFromCenter || 1);
            
            // Apply pulse in radial direction from current position
            positions[i * 3] = originalX + dirX * combinedPulse * 3;
            positions[i * 3 + 1] = originalY + dirY * combinedPulse * 3;
            positions[i * 3 + 2] = originalZ + dirZ * combinedPulse * 3;
            
            // Complex color animation
            const color = new THREE.Color();
            const colorPhase = Math.sin(time * 2 + particlePhase) * 0.5 + 0.5;
            const colorWave = Math.sin(time * 3.5 + spatialPhase) * 0.5 + 0.5;
            
            const hue = 0.52 + colorPhase * 0.25 + Math.sin(time * 4 + particlePhase) * 0.08;
            const saturation = 0.65 + colorWave * 0.3;
            const lightness = 0.4 + colorPhase * 0.35 + Math.abs(combinedPulse) * 0.2;
            
            color.setHSL(hue, saturation, lightness);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          particlesRef.current.geometry.attributes.color.needsUpdate = true;
        }
        
        // Very subtle rotation
        particlesRef.current.rotation.y += 0.0003;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Text morphing functions
    const createTextPoints = (text: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      const fontSize = 100;
      const padding = 20;

      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;

      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const points: { x: number; y: number }[] = [];
      const threshold = 128;

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);
          
          if (Math.random() < 0.3) {
            points.push({
              x: (x - canvas.width / 2) / (fontSize / 10),
              y: -(y - canvas.height / 2) / (fontSize / 10)
            });
          }
        }
      }

      return points;
    };

    const morphToText = (text: string) => {
      if (!particlesRef.current) return;

      currentStateRef.current = 'text';
      const textPoints = createTextPoints(text);
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const targetPositions = new Float32Array(count * 3);

      gsap.to(particlesRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
      });

      for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
          targetPositions[i * 3] = textPoints[i].x;
          targetPositions[i * 3 + 1] = textPoints[i].y;
          targetPositions[i * 3 + 2] = 0;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20 + 10;
          targetPositions[i * 3] = Math.cos(angle) * radius;
          targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
          targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
      }

      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
          }
        });
      }

      setTimeout(() => {
        morphToSphere();
      }, 4000);
    };

    const morphToSphere = () => {
      if (!particlesRef.current) return;

      currentStateRef.current = 'sphere';
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
      const targetPositions = new Float32Array(count * 3);

      const sphericalDistribution = (i: number) => {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        return {
          x: 8 * Math.cos(theta) * Math.sin(phi),
          y: 8 * Math.sin(theta) * Math.sin(phi),
          z: 8 * Math.cos(phi)
        };
      };

      for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        
        targetPositions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        targetPositions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
        const color = new THREE.Color();
        color.setHSL(0.55 + depth * 0.15, 0.8, 0.5 + depth * 0.2);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
          }
        });
      }

      for (let i = 0; i < colors.length; i += 3) {
        gsap.to(colors, {
          [i]: colors[i],
          [i + 1]: colors[i + 1],
          [i + 2]: colors[i + 2],
          duration: 2,
          ease: "power2.inOut",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.color.needsUpdate = true;
            }
          }
        });
      }
    };

    const morphToWaves = () => {
      if (!particlesRef.current) return;

      currentStateRef.current = 'waves';
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
      const targetPositions = new Float32Array(count * 3);

      // Stop rotation
      gsap.to(particlesRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5
      });

      // Create wave grid
      const gridSize = Math.ceil(Math.sqrt(count));
      const spacing = 0.8;
      
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        
        const x = (col - gridSize / 2) * spacing;
        const y = (row - gridSize / 2) * spacing;
        const z = 0;
        
        targetPositions[i * 3] = x;
        targetPositions[i * 3 + 1] = y;
        targetPositions[i * 3 + 2] = z;

        // Vibrant wave colors
        const color = new THREE.Color();
        const hue = 0.55 + (col / gridSize) * 0.2;
        color.setHSL(hue, 0.9, 0.6);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      // Animate to wave positions
      for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
          }
        });
      }

      // Animate colors
      for (let i = 0; i < colors.length; i += 3) {
        gsap.to(colors, {
          [i]: colors[i],
          [i + 1]: colors[i + 1],
          [i + 2]: colors[i + 2],
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.color.needsUpdate = true;
            }
          }
        });
      }
    };

    const morphToBreathing = () => {
      if (!particlesRef.current) return;

      currentStateRef.current = 'breathing';
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

      // Stop rotation smoothly
      gsap.to(particlesRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.8
      });

      // Store current positions as base for breathing
      originalPositionsRef.current = new Float32Array(positions);
    };

    // Expose controller to parent
    if (onSceneReady) {
      onSceneReady({
        morphToText,
        morphToSphere,
        morphToWaves,
        morphToBreathing
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSceneReady]);

  return (
    <div 
      ref={containerRef} 
      className="fixed top-0 left-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleScene;
