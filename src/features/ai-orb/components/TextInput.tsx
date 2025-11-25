import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface TextInputProps {
  onSubmit: (text: string) => void;
}

const TextInput = ({ onSubmit }: TextInputProps) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText) {
      onSubmit(trimmedText);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-2xl px-4">
      <div className="glass-morphism rounded-2xl p-2 flex gap-2 shadow-2xl transition-all duration-300 hover:bg-white/15 hover:border-white/30">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type something magical..."
          maxLength={20}
          className="flex-1 bg-transparent border-none px-5 py-4 text-foreground text-base font-medium placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-2px_hsl(250_95%_63%/0.5)] active:translate-y-0 flex items-center gap-2 group"
        >
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>
    </div>
  );
};

export default TextInput;
