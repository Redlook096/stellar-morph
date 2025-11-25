import { useState } from 'react';
import ParticleScene, { ParticleSceneController } from './components/ParticleScene';
import TextInput from './components/TextInput';

const AIOrb = () => {
  const [sceneController, setSceneController] = useState<ParticleSceneController | null>(null);

  const handleTextSubmit = (text: string) => {
    if (sceneController) {
      sceneController.morphToText(text);
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
      <TextInput onSubmit={handleTextSubmit} />

      {/* Ambient Glow Effect */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow pointer-events-none" />
    </main>
  );
};

export default AIOrb;
