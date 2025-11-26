import { useState } from 'react';
import ParticleScene, { ParticleSceneController } from './components/ParticleScene';
import TextInput from './components/TextInput';

const AIOrb = () => {
  const [sceneController, setSceneController] = useState<ParticleSceneController | null>(null);
  const [isWaveMode, setIsWaveMode] = useState(false);
  const [isBreathingMode, setIsBreathingMode] = useState(false);

  const handleTextSubmit = (text: string) => {
    if (sceneController) {
      sceneController.morphToText(text);
      setIsWaveMode(false);
      setIsBreathingMode(false);
    }
  };

  const handleWaveToggle = () => {
    if (sceneController) {
      if (isWaveMode) {
        sceneController.morphToSphere();
        setIsWaveMode(false);
      } else {
        sceneController.morphToWaves();
        setIsWaveMode(true);
        setIsBreathingMode(false);
      }
    }
  };

  const handleBreathingToggle = () => {
    if (sceneController) {
      if (isBreathingMode) {
        sceneController.morphToSphere();
        setIsBreathingMode(false);
      } else {
        sceneController.morphToBreathing();
        setIsBreathingMode(true);
        setIsWaveMode(false);
      }
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      {/* Three.js Scene */}
      <ParticleScene onSceneReady={setSceneController} />
      
      {/* Header */}
      <header className="fixed top-8 left-8 z-10 mix-blend-difference">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-gradient animate-float">
          Particle
          <br />
          Morphing
        </h1>
      </header>

      {/* Text Input */}
      <TextInput 
        onSubmit={handleTextSubmit} 
        onWaveToggle={handleWaveToggle}
        isWaveMode={isWaveMode}
        onBreathingToggle={handleBreathingToggle}
        isBreathingMode={isBreathingMode}
      />

      {/* Ambient Glow Effect */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow pointer-events-none" />
    </main>
  );
};

export default AIOrb;
