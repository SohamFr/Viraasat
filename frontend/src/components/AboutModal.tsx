import { X, Globe2, ScanFace, Route, Landmark } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  {
    icon: Globe2,
    title: 'Interactive 3D Cartography',
    desc: 'Powered by MapLibre and Carto Dark Matter, exploring India feels fluid, highly detailed, and deeply immersive with pitch and bearing controls.',
  },
  {
    icon: ScanFace,
    title: 'Gemini Vision AI',
    desc: 'Point your camera at any structure, and our Smart Lens instantly analyzes architectural features, era, and history using Google Gemini Flash.',
  },
  {
    icon: Route,
    title: 'Live Mappls Routing',
    desc: 'Get precise, turn-by-turn routing to ancient monuments across India with instant polyline decoding directly on our immersive maps.',
  },
  {
    icon: Landmark,
    title: 'Verified ASI Logistics',
    desc: 'Accurate ticket prices, opening timings, closed days, and official booking portals for all centrally protected monuments.',
  },
];

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl liquid-glass rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden p-8 sm:p-12">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10 z-10">
          <X size={20} />
        </button>
        
        <div className="text-center mb-10 relative z-0">
          <h2 className="text-5xl sm:text-7xl text-white font-normal mb-4" style={{ fontFamily: "'Noto Serif Devanagari', serif" }}>
            About विरासत
          </h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
            A mission to preserve, digitize, and interactively explore over 3,600+ living heritage monuments across the Indian subcontinent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4 border border-cyan-500/30">
                <f.icon size={18} />
              </div>
              <h3 className="text-white font-semibold mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>{f.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed font-sans">{f.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-10 pt-8 border-t border-white/10 text-center relative z-0">
          <p className="text-xs text-white/40 uppercase tracking-widest">Built with precision and passion for history.</p>
        </div>
      </div>
    </div>
  );
}
