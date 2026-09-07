import { useState, useEffect } from 'react';
import { X, MapPin, Info, Compass, Clock, Ticket, AlertCircle, Camera, Navigation, Landmark, Bookmark, CheckCircle } from 'lucide-react';
import type { Monument } from '../data/monuments';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

interface Logistics {
  opening_time: string;
  closing_time: string;
  closed_days: string;
  ticket_indian: number;
  ticket_foreigner: number;
  ticket_saarc: number;
  camera_fee: number;
  booking_url: string;
}

interface Intelligence {
  best_season: string;
  golden_hour_tips: string;
  peak_rush_warning: string;
  dress_code: string;
  secret_trivia: string;
}

interface DrawerProps {
  monument: Monument;
  onClose: () => void;
  onShowRoute: (lat: number, lng: number) => void;
  onOpenStreetView: (id: string) => void;
}

export function MonumentInspectorDrawer({ monument, onClose, onShowRoute, onOpenStreetView }: DrawerProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [wikiData, setWikiData] = useState<any>(null);
  const [logistics, setLogistics] = useState<Logistics | null>(null);
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setActiveTab('Overview');
    setWikiData(null);
    setLogistics(null);
    setIntelligence(null);
    setLoading(true);

    const fetchData = async () => {
      // Fetch Wiki
      fetch(`/api/wiki/monument?name=${encodeURIComponent(monument.name)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setWikiData(data))
        .catch(console.error);

      // Fetch Intelligence - provide fallback if fails
      fetch(`/api/guide/${encodeURIComponent(monument.name)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setIntelligence(data);
          else setIntelligence({
            best_season: 'October to March',
            golden_hour_tips: 'Arrive 30 minutes before sunrise for the best light.',
            peak_rush_warning: 'Very crowded on weekends and national holidays.',
            dress_code: 'Modest clothing recommended. Avoid shorts above knees.',
            secret_trivia: `${monument.name} was built with architectural techniques way ahead of its time.`
          });
        })
        .catch(() => setIntelligence({
          best_season: 'October to March',
          golden_hour_tips: 'Arrive 30 minutes before sunrise for the best light.',
          peak_rush_warning: 'Very crowded on weekends and national holidays.',
          dress_code: 'Modest clothing recommended.',
          secret_trivia: `${monument.name} features unique regional architecture.`
        }));

      // Fetch Logistics - provide fallback
      supabase
        .from('monument_logistics')
        .select('*')
        .eq('monument_id', monument.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) setLogistics(data);
          else setLogistics({
            opening_time: '06:00',
            closing_time: '18:00',
            closed_days: 'None',
            ticket_indian: 50,
            ticket_foreigner: 600,
            ticket_saarc: 50,
            camera_fee: 0,
            booking_url: 'https://asi.payumoney.com/'
          });
        })
        .catch(console.error);

      if (session) {
        const { data } = await supabase.from('saved_monuments').select('*').eq('monument_id', monument.id).eq('user_id', session.user.id).maybeSingle();
        if (data) {
          setIsSaved(true);
          setIsVisited(data.visited);
        } else {
          setIsSaved(false);
          setIsVisited(false);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [monument, session]);

  const toggleSave = async () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    if (isSaved) {
      // Toggle visited state instead
      const newStatus = !isVisited;
      setIsVisited(newStatus);
      await supabase.from('saved_monuments').update({ visited: newStatus }).eq('monument_id', monument.id).eq('user_id', session.user.id);
    } else {
      setIsSaved(true);
      await supabase.from('saved_monuments').insert({ monument_id: monument.id, user_id: session.user.id });
    }
  };

  const TABS = ['Overview', 'Intelligence', 'Logistics', '360 & Route'];

  const isCurrentlyOpen = () => {
    if (!logistics) return false;
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (logistics.closed_days.includes(currentDay)) return false;
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    return timeStr >= logistics.opening_time && timeStr <= logistics.closing_time;
  };

  return (
    <>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md paper-surface-dark border-l-4 border-amber-500 shadow-2xl z-[60] flex flex-col font-sans" style={{ animation: 'slideInRight 0.3s ease-out' }}>
        {/* Header */}
        <div className="relative h-48 sm:h-56 shrink-0 bg-stone-900 border-b-2 border-amber-500">
          {wikiData?.thumbnailUrl ? (
            <img src={wikiData.thumbnailUrl} className="w-full h-full object-cover filter grayscale-[20%]" alt={monument.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Landmark size={48} className="text-stone-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />
          
          <button onClick={onClose} className="absolute top-4 right-4 neo-btn bg-stone-100 text-stone-900 p-2 z-10 shadow-lg border-2 border-stone-900">
            <X size={20} strokeWidth={2.5} />
          </button>
          
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border-2 border-amber-500 text-amber-500 bg-stone-900 shadow-[2px_2px_0px_#D97706]">
                    {monument.architectural_style || 'Heritage Site'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border-2 border-stone-400 text-stone-300 bg-stone-900 shadow-[2px_2px_0px_#A8A29E]">
                    {monument.built_century || 'Ancient'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#FBF9F4] leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {monument.name}
                </h2>
              </div>
              
              {/* Stamp Passport Button */}
              <div className="ml-4 shrink-0">
                {!isSaved ? (
                  <button onClick={toggleSave} className="neo-btn bg-amber-400 text-stone-900 px-3 py-3 flex flex-col items-center gap-1 font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900">
                    <Bookmark size={20} className="fill-stone-900" />
                    <span>Stamp</span>
                  </button>
                ) : (
                  <button onClick={toggleSave} className={`neo-btn px-3 py-2 flex flex-col items-center gap-1 font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900 ${isVisited ? 'bg-red-500 text-white' : 'bg-stone-300 text-stone-900'}`}>
                    <CheckCircle size={20} />
                    <span>{isVisited ? 'Explored' : 'Mark Visited'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-stone-800 shrink-0 bg-stone-900">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'text-amber-500 border-b-4 border-amber-500 bg-stone-800' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {tab.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 text-[#FBF9F4] custom-scrollbar relative bg-[#121214]">
          {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#121214] z-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}
          
          {/* TAB: OVERVIEW */}
          <div className={activeTab === 'Overview' ? 'block' : 'hidden'}>
            <p className="text-sm leading-relaxed text-stone-300 mb-6 font-medium">{monument.description || 'A monumental site of great historical significance in India.'}</p>
            
            {wikiData?.extract ? (
              <div className="mt-2 pt-6 border-t-2 border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2"><Info size={14}/> Field Notes (Wikipedia)</h4>
                <p className="text-sm leading-relaxed text-stone-300 font-medium">{wikiData.extract}</p>
                {wikiData.contentUrls?.desktop && (
                  <a href={wikiData.contentUrls.desktop} target="_blank" rel="noreferrer" className="inline-block mt-4 text-xs font-bold text-amber-500 hover:text-amber-400 underline underline-offset-4 uppercase tracking-widest">Read Full Dossier →</a>
                )}
              </div>
            ) : (
              <div className="mt-2 pt-6 border-t-2 border-stone-800">
                <div className="flex items-center gap-3 text-stone-400 text-xs font-bold uppercase tracking-widest">
                  <div className="w-4 h-4 border-2 border-stone-600 border-t-stone-300 rounded-full animate-spin"></div>
                  Retrieving Archival Data...
                </div>
              </div>
            )}
          </div>

          {/* TAB: INTELLIGENCE */}
          <div className={activeTab === 'Intelligence' ? 'block animate-fade-in' : 'hidden'}>
            {intelligence ? (
              <div className="space-y-5">
                <div className="bg-stone-900 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5">
                  <h4 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Compass size={16}/> Best Season</h4>
                  <p className="text-sm text-stone-300 font-medium">{intelligence.best_season}</p>
                </div>
                <div className="bg-stone-900 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5">
                  <h4 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Camera size={16}/> Golden Hour Tips</h4>
                  <p className="text-sm text-stone-300 font-medium">{intelligence.golden_hour_tips}</p>
                </div>
                <div className="bg-stone-900 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5">
                  <h4 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle size={16}/> Peak Rush Warning</h4>
                  <p className="text-sm text-stone-300 font-medium">{intelligence.peak_rush_warning}</p>
                </div>
                <div className="bg-stone-900 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5">
                  <h4 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={16}/> Secret Trivia</h4>
                  <p className="text-sm text-stone-300 font-medium">{intelligence.secret_trivia}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* TAB: LOGISTICS */}
          <div className={activeTab === 'Logistics' ? 'block animate-fade-in' : 'hidden'}>
            {logistics ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-stone-900 p-5 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917]">
                  <div className={`w-4 h-4 border-2 border-stone-900 shadow-[2px_2px_0px_#1C1917] ${isCurrentlyOpen() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-bold uppercase tracking-widest text-sm text-amber-500">{isCurrentlyOpen() ? 'Currently Open' : 'Currently Closed'}</div>
                    <div className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-wider">Hours: {logistics.opening_time} - {logistics.closing_time}</div>
                  </div>
                </div>

                <div className="bg-stone-900 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5">
                  <h4 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Ticket size={16}/> Entry Tariffs (2026)</h4>
                  <div className="space-y-3 text-sm font-medium">
                    <div className="flex justify-between border-b-2 border-stone-800 pb-2">
                      <span className="text-stone-400">Indian Citizens / Students</span>
                      <span className="font-bold text-stone-200">₹{logistics.ticket_indian}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-stone-800 pb-2">
                      <span className="text-stone-400">Foreign Tourists</span>
                      <span className="font-bold text-stone-200">₹{logistics.ticket_foreigner}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-stone-800 pb-2">
                      <span className="text-stone-400">SAARC / BIMSTEC</span>
                      <span className="font-bold text-stone-200">₹{logistics.ticket_saarc}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-stone-400">Photography Equipment</span>
                      <span className="font-bold text-stone-200">{logistics.camera_fee === 0 ? 'Free' : `₹${logistics.camera_fee}`}</span>
                    </div>
                  </div>
                </div>
                
                {logistics.booking_url && (
                  <a href={logistics.booking_url} target="_blank" rel="noreferrer" className="neo-btn block w-full py-4 bg-amber-500 text-stone-900 font-bold uppercase tracking-widest text-center shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900 hover:bg-amber-400 transition-all">
                    Book Official ASI Ticket
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* TAB: 360 & ROUTE */}
          <div className={activeTab === '360 & Route' ? 'block animate-fade-in' : 'hidden'}>
            <div className="space-y-6 flex flex-col items-center pt-2">
              <button 
                onClick={() => onShowRoute(monument.lat, monument.lng)}
                className="neo-btn w-full flex items-center justify-center gap-3 py-4 bg-cyan-600 text-[#FBF9F4] font-bold uppercase tracking-widest shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900 hover:bg-cyan-500 transition-all"
              >
                <Navigation size={18} />
                Deploy Live Route
              </button>

              {monument.street_view_id ? (
                <button 
                  onClick={() => onOpenStreetView(monument.street_view_id!)}
                  className="neo-btn w-full flex items-center justify-center gap-3 py-4 bg-stone-800 text-[#FBF9F4] font-bold uppercase tracking-widest shadow-[4px_4px_0px_#1C1917] border-2 border-stone-900 hover:bg-stone-700 transition-all"
                >
                  <Camera size={18} />
                  Initiate 360° Recon
                </button>
              ) : (
                <div className="bg-stone-900 border-2 border-stone-800 p-5 text-center shadow-[4px_4px_0px_#1C1917] w-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-500">360° Imagery is classified or unavailable for this sector.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
