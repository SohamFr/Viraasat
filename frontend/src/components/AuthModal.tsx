import React, { useState, useRef, useEffect } from 'react';
import { X, Stamp } from 'lucide-react';
import gsap from 'gsap';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current, 
        { scale: 0.9, y: 20, opacity: 0 }, 
        { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.7)" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // On success, close or show message
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="paper-surface w-full max-w-md p-8 relative flex flex-col items-center"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-900 hover:scale-110 transition-transform"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-stone-900 flex items-center justify-center mb-4">
            <Stamp size={32} className="text-stone-900" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-widest text-center" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Heritage Passport Permit
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider text-stone-600 mt-2">
            {isSignUp ? 'Issue New Passport' : 'Verify Existing Permit'}
          </p>
        </div>

        {error && (
          <div className="w-full bg-red-100 border-2 border-red-900 text-red-900 px-4 py-2 mb-6 font-bold text-sm uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 font-sans">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Email Dispatch
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border-2 border-stone-900 p-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-400/50 transition-all rounded-none font-medium"
              placeholder="explorer@dispatch.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Security Seal
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border-2 border-stone-900 p-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-400/50 transition-all rounded-none font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-btn bg-amber-400 text-stone-950 font-bold uppercase tracking-wider py-4 mt-4 w-full disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Issue Permit' : 'Stamp Entry')}
          </button>
        </form>

        <div className="mt-8 text-sm font-bold uppercase text-stone-600 tracking-wider cursor-pointer hover:text-stone-900 transition-colors" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already hold a permit? Verify here' : 'Need a new passport? Apply here'}
        </div>
      </div>
    </div>
  );
}
