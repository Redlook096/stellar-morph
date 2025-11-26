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
  const particleVariationsRef = useRef<Float32Array | null>(null);
  const introCompleteRef = useRef(false);

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

      // Create unique variations for each particle
      const variations = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        variations[i * 4] = Math.random(); // Speed variation
        variations[i * 4 + 1] = Math.random() * Math.PI * 2; // Phase offset
        variations[i * 4 + 2] = 0.5 + Math.random() * 1.5; // Amplitude variation
        variations[i * 4 + 3] = Math.random(); // Turbulence seed
      }
      particleVariationsRef.current = variations;
    };

    createParticles();

    // Cinematic intro animation
    const cinematicIntro = () => {
      if (!particlesRef.current) return;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const targetPositions = new Float32Array(count * 3);

      // Store final sphere positions
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
      }

      // Start particles far away in dispersed formation
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 40 + Math.random() * 30;
        const height = (Math.random() - 0.5) * 40;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Animate to sphere
      for (let i = 0; i < positions.length; i += 3) {
        const delay = (i / positions.length) * 0.5;
        gsap.to(positions, {
          [i]: targetPositions[i],
          [i + 1]: targetPositions[i + 1],
          [i + 2]: targetPositions[i + 2],
          duration: 2.5,
          delay: delay,
          ease: "power3.out",
          onUpdate: () => {
            if (particlesRef.current) {
              particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
          },
          onComplete: () => {
            if (i >= positions.length - 3) {
              introCompleteRef.current = true;
            }
          }
        });
      }
    };

    cinematicIntro();

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
        // Advanced AI-like breathing - chaotic and organic
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
        const time = Date.now() * 0.001;
        const variations = particleVariationsRef.current;
        
        if (originalPositionsRef.current && variations) {
          for (let i = 0; i < count; i++) {
            const originalX = originalPositionsRef.current[i * 3];
            const originalY = originalPositionsRef.current[i * 3 + 1];
            const originalZ = originalPositionsRef.current[i * 3 + 2];
            
            // Per-particle unique variations
            const speedVar = variations[i * 4];
            const phaseOffset = variations[i * 4 + 1];
            const amplitudeVar = variations[i * 4 + 2];
            const turbulenceSeed = variations[i * 4 + 3];
            
            // Distance-based effects
            const distFromCenter = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ);
            const normalizedDist = distFromCenter / 15;
            
            // Asymmetric multi-frequency breathing
            const particleTime = time * (0.8 + speedVar * 0.6);
            const spatialPhase = (originalX * 0.08 + originalY * 0.11 + originalZ * 0.13) + phaseOffset;
            
            // Primary pulse - varies per particle
            const pulse1 = Math.sin(particleTime * 1.3 + spatialPhase) * amplitudeVar;
            
            // Chaotic secondary pulses at different frequencies
            const pulse2 = Math.sin(particleTime * 2.7 + turbulenceSeed * Math.PI) * (0.6 + speedVar * 0.4);
            const pulse3 = Math.cos(particleTime * 4.1 + normalizedDist * Math.PI * 3) * 0.35;
            const pulse4 = Math.sin(particleTime * 5.8 - spatialPhase * 0.7) * 0.25;
            
            // Turbulence - creates chaotic motion
            const turbulence1 = Math.sin(particleTime * 3.5 + turbulenceSeed * 10) * 0.15;
            const turbulence2 = Math.cos(particleTime * 4.8 - turbulenceSeed * 8) * 0.12;
            const turbulence3 = Math.sin(particleTime * 6.2 + turbulenceSeed * 6) * 0.08;
            
            // Swirling drift - organic movement
            const swirlAngle = particleTime * 0.5 + spatialPhase;
            const swirlRadius = (pulse1 + pulse2) * 0.3;
            const driftX = Math.cos(swirlAngle) * swirlRadius;
            const driftY = Math.sin(swirlAngle * 0.8) * swirlRadius;
            const driftZ = Math.sin(swirlAngle * 1.2) * swirlRadius;
            
            // Pulsation - varies strength per particle
            const pulsation = (pulse1 * 0.4 + pulse2 * 0.3 + pulse3 * 0.2 + pulse4 * 0.1) * (1.2 + normalizedDist * 0.6);
            
            // Add all turbulence layers
            const totalTurbulence = (turbulence1 + turbulence2 + turbulence3) * amplitudeVar;
            
            // Direction from origin
            const dirX = originalX / (distFromCenter || 1);
            const dirY = originalY / (distFromCenter || 1);
            const dirZ = originalZ / (distFromCenter || 1);
            
            // Combine all movements - chaotic but centered around original position
            const radialMovement = pulsation * 2.5;
            const tangentialX = driftX * 0.8;
            const tangentialY = driftY * 0.8;
            const tangentialZ = driftZ * 0.8;
            
            positions[i * 3] = originalX + dirX * radialMovement + tangentialX + totalTurbulence;
            positions[i * 3 + 1] = originalY + dirY * radialMovement + tangentialY + totalTurbulence * 0.8;
            positions[i * 3 + 2] = originalZ + dirZ * radialMovement + tangentialZ + totalTurbulence * 1.2;
            
            // Dynamic color shifts - AI-like glow
            const color = new THREE.Color();
            const colorShift1 = Math.sin(particleTime * 2.2 + phaseOffset) * 0.5 + 0.5;
            const colorShift2 = Math.cos(particleTime * 3.7 + spatialPhase) * 0.5 + 0.5;
            const colorShift3 = Math.sin(particleTime * 5.1 - turbulenceSeed * 5) * 0.5 + 0.5;
            
            const intensity = Math.abs(pulsation) + Math.abs(totalTurbulence);
            
            const hue = 0.48 + colorShift1 * 0.3 + Math.sin(particleTime * 3.3 + phaseOffset) * 0.12;
            const saturation = 0.6 + colorShift2 * 0.35 + intensity * 0.1;
            const lightness = 0.35 + colorShift3 * 0.4 + intensity * 0.25;
            
            color.setHSL(hue, saturation, lightness);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          particlesRef.current.geometry.attributes.color.needsUpdate = true;
        }
        
        // Asymmetric rotation - more organic
        particlesRef.current.rotation.y += 0.0002;
        particlesRef.current.rotation.x += 0.00015;
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
