import { useState, useEffect, useMemo } from 'react';
import { X, Search, Compass, Clock, MapPin, SearchX } from 'lucide-react';
import { fetchMonuments, type Monument } from '../data/monuments';

interface MonumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMap: (monumentName: string) => void;
}

const STYLES = ['All', 'Mughal', 'Rajput', 'Dravidian', 'Hindu', 'Indo-Saracenic'];

export function MonumentsModal({ isOpen, onClose, onViewMap }: MonumentsModalProps) {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [search, setSearch] = useState('');
  const [activeStyle, setActiveStyle] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && monuments.length === 0) {
      setIsLoading(true);
      fetchMonuments().then(data => {
        setMonuments(data);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const filteredMonuments = useMemo(() => {
    return monuments.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                            m.description.toLowerCase().includes(search.toLowerCase());
      const matchesStyle = activeStyle === 'All' || m.architectural_style.toLowerCase().includes(activeStyle.toLowerCase());
      return matchesSearch && matchesStyle;
    });
  }, [monuments, search, activeStyle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[85vh] liquid-glass rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl md:text-5xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
              India's Living Heritage
            </h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              <input 
                type="text" 
                placeholder="Search monuments, eras, styles..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {STYLES.map(style => (
                <button
                  key={style}
                  onClick={() => setActiveStyle(style)}
                  className={
                    'px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ' +
                    (activeStyle === style ? 'bg-white text-black' : 'bg-white/5 text-white/80 hover:bg-white/15 border border-white/10')
                  }
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-white/50 animate-pulse">
              Loading historical archives...
            </div>
          ) : filteredMonuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50 gap-4">
              <SearchX size={48} className="opacity-20" />
              <p>No monuments match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMonuments.map(monument => (
                <div key={monument.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{monument.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded text-cyan-100 border border-white/10">
                      {monument.built_century.split(' ')[0]}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/70 leading-relaxed mb-5 flex-1 line-clamp-3 font-sans">
                    {monument.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-white/50 mb-5 font-sans bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-cyan-400" />
                      <span>{monument.logistics ? `${monument.logistics.opening_time.substring(0,5)} - ${monument.logistics.closing_time.substring(0,5)}` : 'Timings varies'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-cyan-400" />
                      <span className="truncate max-w-[120px]">{monument.architectural_style}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onClose();
                      onViewMap(monument.name);
                    }}
                    className="w-full bg-white/10 hover:bg-white text-white hover:text-black font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    <Compass size={18} />
                    <span>View on Map</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
