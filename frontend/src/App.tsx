import { useState, useRef, useCallback, useEffect } from 'react'
import { Menu, X, Search, Compass, Camera, ExternalLink } from 'lucide-react'
import { SmartLensModal } from './components/SmartLensModal'
import { HeritageMap } from './components/HeritageMap'
import { MonumentsModal } from './components/MonumentsModal'
import { AboutModal } from './components/AboutModal'
import { PassportView } from './components/PassportView'
import { AuthModal } from './components/AuthModal'
import { fetchMonuments, type Monument } from './data/monuments'
import { supabase } from './lib/supabase'

const VIDEOS = [
  { url: '/videos/amber-fort.mp4', label: 'Amber Fort' },
  { url: '/videos/varanasi-ghats.mp4', label: 'Varanasi Ghats' },
  { url: '/videos/taj-mahal.mp4', label: 'Taj Mahal' },
  { url: '/videos/hampi-ruins.mp4', label: 'Hampi Ruins' },
]

const NAV_LINKS = ['Heritage Map', 'AI Lens', 'Monuments', 'About']

const STATS = [
  '3,600+ Protected Sites',
  '42 UNESCO World Heritage',
  'AI Visual Recognition',
  'Live ASI Timings & Routes',
]

export default function App() {
  const [activeVideo, setActiveVideo] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Views & Modals state
  const [viewMode, setViewMode] = useState<'home' | 'explore' | 'heritage' | 'passport'>('home')
  const [targetMonument, setTargetMonument] = useState<string | null>(null)
  const [isLensOpen, setIsLensOpen] = useState(false)
  const [isMonumentsOpen, setIsMonumentsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Auth State
  const [session, setSession] = useState<any>(null)
  const [visitedCount, setVisitedCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchVisitedCount(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchVisitedCount(session.user.id);
      else setVisitedCount(0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchVisitedCount = async (userId: string) => {
    const { count } = await supabase.from('saved_monuments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('visited', true);
    setVisitedCount(count || 0);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [monuments, setMonuments] = useState<Monument[]>([])
  const [searchResults, setSearchResults] = useState<Monument[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set([0]))
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const isDark = activeVideo === 2

  useEffect(() => {
    fetchMonuments().then(setMonuments);
  }, []);

  useEffect(() => {
    const v = videoRefs.current[0]
    if (!v) return
    if (!v.src || v.src !== VIDEOS[0].url) {
      v.src = VIDEOS[0].url
      v.load()
    }
    const tryPlay = () => {
      v.play().catch(() => {
        const retry = () => {
          v.play().catch(() => {})
          document.removeEventListener('pointerdown', retry)
        }
        document.addEventListener('pointerdown', retry, { once: true })
      })
    }
    const t = setTimeout(tryPlay, 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 1) {
      const results = monuments.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) || 
        m.architectural_style.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(results)
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleSearchSelect = (monumentName: string) => {
    setSearchQuery('');
    setShowDropdown(false);
    openMapWithTarget(monumentName);
  }

  const handleSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchSelect(searchResults[0].name)
    }
  }

  const openMapWithTarget = (name: string | null = null, mode: 'explore' | 'heritage' = 'explore') => {
    setMenuOpen(false);
    setTargetMonument(name);
    setViewMode(mode);
  }

  const handleNavClick = (link: string) => {
    setMenuOpen(false);
    if (link === 'Heritage Map') openMapWithTarget(null, 'heritage');
    if (link === 'AI Lens') setIsLensOpen(true);
    if (link === 'Monuments') setIsMonumentsOpen(true);
    if (link === 'About') setIsAboutOpen(true);
  }

  const switchVideo = useCallback((index: number) => {
    if (index === activeVideo || isTransitioning) return
    setIsTransitioning(true)
    setLoadedVideos((prev) => new Set([...prev, index]))

    setTimeout(() => {
      const incoming = videoRefs.current[index]
      if (incoming) {
        if (!incoming.src || incoming.src !== VIDEOS[index].url) {
          incoming.src = VIDEOS[index].url
          incoming.load()
        }
        incoming.currentTime = 0
        incoming.play().catch(() => {})
      }
    }, 50)

    const prevIndex = activeVideo
    setTimeout(() => {
      const outgoing = videoRefs.current[prevIndex]
      if (outgoing) {
        outgoing.pause()
        outgoing.currentTime = 0
      }
    }, 1050)

    setActiveVideo(index)
    transitionTimer.current = setTimeout(() => setIsTransitioning(false), 1000)
  }, [activeVideo, isTransitioning])

  const contentStyle = isDark ? { color: '#182C41' } : { color: '#ffffff' }

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      
      {/* Modals */}
      <SmartLensModal isOpen={isLensOpen} onClose={() => setIsLensOpen(false)} onViewMap={openMapWithTarget} />
      <MonumentsModal isOpen={isMonumentsOpen} onClose={() => setIsMonumentsOpen(false)} onViewMap={openMapWithTarget} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Video Background Layer */}
      {VIDEOS.map((v, i) => (
        <video
          key={v.label}
          ref={(el) => { videoRefs.current[i] = el }}
          className="video-layer absolute inset-0"
          style={{
            zIndex: 0,
            opacity: i === activeVideo ? 1 : 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center center',
          }}
          src={loadedVideos.has(i) ? v.url : undefined}
          muted loop playsInline
          preload={i === 0 ? 'auto' : 'none'}
        />
      ))}

      {/* PNG Overlay */}
      <img
        src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png"
        alt="" aria-hidden="true"
        className="animate-train-bob absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
      />

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center" style={{ zIndex: 50 }}>
          <nav className="flex flex-col items-center gap-8">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className="menu-link-enter menu-link-enter-active text-white text-3xl hover:text-cyan-300 transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif', transitionDelay: `${100 + i * 50}ms` }}
              >
                {link}
              </button>
            ))}
            <button
              onClick={() => openMapWithTarget()}
              className="mt-4 bg-white text-black px-8 py-3 rounded-full font-semibold text-lg menu-link-enter menu-link-enter-active"
              style={{ transitionDelay: '300ms', transition: 'transform 500ms cubic-bezier(0.4,0,0.2,1), opacity 500ms cubic-bezier(0.4,0,0.2,1)' }}
            >
              Explore Map
            </button>
          </nav>
          <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 liquid-glass rounded-full w-12 h-12 flex items-center justify-center text-white">
            <X size={24} />
          </button>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative flex flex-col h-full px-5 sm:px-8 md:px-12 lg:px-16 py-6" style={{ zIndex: 2 }}>
        
        {/* Navigation */}
        <nav className="flex items-center justify-between w-full pointer-events-auto">
          <span className="text-3xl text-white font-normal select-none cursor-pointer" style={{ fontFamily: "'AMS Indu', 'Noto Serif Devanagari', serif" }} onClick={() => setViewMode('home')}>
            विरासत
          </span>

          <div className="hidden md:flex items-center liquid-glass rounded-full px-2 py-2 gap-1 border border-white/10 shadow-lg">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                className="text-white/90 hover:text-white hover:bg-white/10 text-sm px-4 py-1.5 rounded-full transition-colors duration-200"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {link}
              </button>
            ))}
            
            {session ? (
              <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-3">
                <button
                  onClick={() => setViewMode('passport')}
                  className="bg-amber-500 text-stone-900 text-sm font-bold uppercase tracking-wider px-5 py-2 rounded-full hover:bg-amber-400 transition-colors duration-200 shadow-md flex items-center gap-2"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  My Passport {visitedCount > 0 && <span className="bg-stone-900 text-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{visitedCount}</span>}
                </button>
                <button onClick={() => supabase.auth.signOut()} className="text-white/70 hover:text-white px-3 py-1 text-xs font-semibold uppercase">Logout</button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="ml-2 bg-white text-black text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded-full hover:bg-white/90 transition-colors duration-200 shadow-md"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Login / Passport
              </button>
            )}
            
            <button
              onClick={() => openMapWithTarget()}
              className="ml-2 bg-transparent border-2 border-white text-white text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-white/10 transition-colors duration-200 shadow-md"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Explore Map
            </button>
          </div>

          <button
            className="md:hidden liquid-glass rounded-full w-12 h-12 flex items-center justify-center text-white relative shadow-lg"
            onClick={() => setMenuOpen(o => !o)}
          >
            <span className="absolute transition-transform duration-300" style={{ opacity: menuOpen ? 0 : 1, transform: menuOpen ? 'rotate(90deg) scale(0.75)' : 'rotate(0deg) scale(1)' }}>
              <Menu size={20} />
            </span>
            <span className="absolute transition-transform duration-300" style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.75)' }}>
              <X size={20} />
            </span>
          </button>
        </nav>

        {/* Main Conditional Content */}
        {viewMode === 'passport' ? (
          <div className="absolute inset-0 z-50">
            <PassportView onBack={() => setViewMode('home')} onPlotMap={(name) => openMapWithTarget(name, 'explore')} />
          </div>
        ) : viewMode !== 'home' ? (
          <HeritageMap onBack={() => { setViewMode('home'); setTargetMonument(null); }} targetMonumentName={targetMonument} viewMode={viewMode} />
        ) : (
          <>
            {/* Hero Content */}
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-6 md:gap-8 mt-4 animate-fade-in pointer-events-auto">
              <div className="liquid-glass rounded-full px-5 py-2 text-xs sm:text-sm hero-content-text border border-white/20 shadow-md" style={{ fontFamily: 'system-ui, sans-serif', ...contentStyle }}>
                Exploring 3,600+ Living Monuments Across India
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] leading-[1.05] max-w-4xl hero-content-text drop-shadow-2xl" style={contentStyle}>
                Walk Through Millennia of <br className="hidden sm:block" />
                Living History
              </h1>

              <p className="text-sm sm:text-base md:text-xl max-w-2xl leading-relaxed hero-content-text drop-shadow-lg" style={{ fontFamily: 'system-ui, sans-serif', ...contentStyle, opacity: isDark ? 0.8 : 0.9 }}>
                Explore interactive heritage maps, uncover architectural secrets with AI camera vision, and navigate India's timeless monuments with real-time guides.
              </p>

              {/* Primary Search & Action Bar */}
              <div ref={searchRef} className="relative w-full max-w-md sm:max-w-2xl mt-4">
                <div className="liquid-glass rounded-full flex flex-col sm:flex-row items-center p-2 w-full border border-white/20 shadow-2xl">
                  <div className="flex items-center flex-1 w-full pl-4 pr-3 py-2">
                    <Search size={20} className="hero-content-text mr-2" style={{ ...contentStyle, opacity: 0.7 }} />
                    <input
                      type="text"
                      placeholder="Search monuments, dynasties, or cities..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onKeyDown={handleSearchEnter}
                      className={`flex-1 bg-transparent outline-none text-base px-2 hero-content-text placeholder-current ${isDark ? 'opacity-80' : 'opacity-90'}`}
                      style={{ fontFamily: 'system-ui, sans-serif', ...contentStyle }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={() => setIsLensOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/25 text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors border border-white/10 shadow-inner whitespace-nowrap"
                    >
                      <Camera size={18} />
                      <span>AI Lens</span>
                    </button>
                    <button
                      onClick={() => openMapWithTarget()}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors shadow-lg whitespace-nowrap"
                    >
                      <Compass size={18} />
                      <span>Open Map</span>
                    </button>
                  </div>
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 liquid-glass rounded-2xl border border-white/20 shadow-2xl overflow-hidden text-left z-50 max-h-60 overflow-y-auto">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchSelect(result.name)}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-white group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                          <MapPin size={14} className="text-white group-hover:text-cyan-300" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>{result.name}</span>
                          <span className="text-xs text-white/50">{result.architectural_style}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Tabs */}
              <div className="flex items-center gap-3 sm:gap-6 mt-6" role="tablist">
                {VIDEOS.map((v, i) => (
                  <div key={v.label} className="flex flex-col items-center gap-2">
                    <button
                      role="tab"
                      onClick={() => switchVideo(i)}
                      className={`text-xs sm:text-base pb-1.5 transition-all duration-300 hero-content-text border-b-2 font-medium ${
                        i === activeVideo ? 'border-current opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-90'
                      }`}
                      style={{ fontFamily: 'system-ui, sans-serif', ...contentStyle }}
                    >
                      {v.label}
                    </button>
                    {i === activeVideo && (
                      <button 
                        onClick={() => openMapWithTarget(v.label)}
                        className="flex items-center gap-1 text-[10px] sm:text-xs uppercase tracking-widest bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full text-white transition-colors border border-white/10 animate-fade-in"
                      >
                        <span>Explore</span>
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/70 text-xs sm:text-sm pb-4 animate-fade-in pointer-events-auto font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {STATS.map((stat, i) => (
                <span key={stat} className="flex items-center gap-4">
                  <span>{stat}</span>
                  {i < STATS.length - 1 && <span className="hidden md:inline text-white/20">|</span>}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
