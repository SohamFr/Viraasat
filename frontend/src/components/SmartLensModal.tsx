import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, MapPin, AlertCircle, RefreshCw, Upload } from 'lucide-react';

interface SmartLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMap: (name: string) => void;
}

interface AIResult {
  name: string;
  history_slides: string[];
  architectural_style: string;
  built_century: string;
  confidence_score: number;
}

type ModalState = 'viewfinder' | 'analyzing' | 'result' | 'error';

export function SmartLensModal({ isOpen, onClose, onViewMap }: SmartLensModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalState, setModalState] = useState<ModalState>('viewfinder');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCameraError, setHasCameraError] = useState(false);

  // ── Stream Teardown ────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // ── Initialization & Cleanup ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset state for next open
      setModalState('viewfinder');
      setAiResult(null);
      setCapturedImage(null);
      setHasCameraError(false);
      return;
    }

    if (modalState === 'viewfinder' && !hasCameraError) {
      startCamera();
    }

    return () => stopCamera();
  }, [isOpen, modalState, hasCameraError, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setHasCameraError(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera access denied. Please enable camera permissions in your browser settings to scan monuments.');
      } else {
        setErrorMsg('Camera not found or unavailable. You can upload an image instead.');
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // ── Geolocation ────────────────────────────────────────────────────────────
  const getCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 26.9124, lng: 75.7873 }); // Jaipur fallback
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve({ lat: 26.9124, lng: 75.7873 }); // Timeout fallback
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(timeoutId);
          resolve({ lat: 26.9124, lng: 75.7873 }); // Error fallback
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
      );
    });
  };

  // ── Capture & Analyze ──────────────────────────────────────────────────────
  const captureAndAnalyze = async (imageSrc?: string) => {
    setModalState('analyzing');
    setErrorMsg('');
    setActiveSlide(0);

    let base64Data = imageSrc;

    // Capture from video if no explicit image provided
    if (!base64Data) {
      if (!videoRef.current || !canvasRef.current) {
        setModalState('error');
        setErrorMsg('Camera not initialized properly.');
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        base64Data = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    if (!base64Data) {
      setModalState('error');
      setErrorMsg('Failed to capture image.');
      return;
    }

    setCapturedImage(base64Data);
    // Stop the camera as we have the frame
    stopCamera();

    // Strip prefix if needed, though our backend handles data URIs
    const prefixMatch = base64Data.match(/^data:(image\/\w+);base64,/);
    const mimeType = prefixMatch ? prefixMatch[1] : 'image/jpeg';
    const cleanBase64 = prefixMatch ? base64Data.replace(/^data:image\/\w+;base64,/, '') : base64Data;

    try {
      const coords = await getCoordinates();

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAiResult(data);
      setModalState('result');
    } catch (error) {
      console.error(error);
      setModalState('error');
      setErrorMsg('Could not identify this structure. Ensure it is well-lit and try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        captureAndAnalyze(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── UI Renderers ───────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* ── Background Layer ────────────────────────────────────── */}
      {modalState === 'viewfinder' || hasCameraError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      ) : (
        capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      )}

      {/* Off-screen canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Vignette / Blur Overlay ─────────────────────────────── */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
          modalState === 'viewfinder' && !hasCameraError
            ? 'bg-gradient-to-t from-black/60 via-transparent to-black/30'
            : 'backdrop-blur-md bg-black/50'
        }`}
      />

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleClose}
          className="liquid-glass rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── State: Active Viewfinder ────────────────────────────── */}
      {modalState === 'viewfinder' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none z-10 pb-12 pt-24">
          <div className="flex flex-col items-center gap-2">
            <span className="liquid-glass text-white/90 text-sm px-4 py-1.5 rounded-full font-medium tracking-wide">
              Point at a Monument
            </span>
          </div>

          {hasCameraError ? (
            <div className="text-center text-white px-6 max-w-md pointer-events-auto">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400 opacity-80" />
              <p className="text-lg mb-6">{errorMsg}</p>
              <label className="cursor-pointer liquid-glass px-6 py-3 rounded-full inline-flex items-center gap-2 hover:bg-white/20 transition">
                <Upload size={18} />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          ) : (
            <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl flex items-center justify-center">
              {/* Scan brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-xl" />
              
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
            </div>
          )}

          {!hasCameraError && (
            <div className="pointer-events-auto liquid-glass p-2 rounded-full mb-8">
              <button
                onClick={() => captureAndAnalyze()}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Capture"
              >
                <div className="w-14 h-14 border-2 border-black/10 rounded-full" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── State: Analyzing Loader ─────────────────────────────── */}
      {modalState === 'analyzing' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent h-32 animate-[scanline_2s_linear_infinite]" />
          
          <div className="liquid-glass px-6 py-4 rounded-full flex items-center gap-3 animate-pulse">
            <RefreshCw size={20} className="text-white animate-spin" />
            <span className="text-white font-medium">Consulting Historian AI...</span>
          </div>
        </div>
      )}

      {/* ── State: Error ────────────────────────────────────────── */}
      {modalState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-white text-lg max-w-sm mb-8">{errorMsg}</p>
          <button
            onClick={() => setModalState('viewfinder')}
            className="liquid-glass px-8 py-3 rounded-full text-white font-medium flex items-center gap-2 hover:bg-white/20 transition"
          >
            <Camera size={18} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ── State: Result Story Deck ────────────────────────────── */}
      {modalState === 'result' && aiResult && (
        <div className="absolute inset-0 z-10 flex flex-col pt-12 pb-8 px-4 sm:px-8">
          {/* Progress Bars */}
          <div className="flex gap-1.5 mb-6 w-full max-w-2xl mx-auto">
            {aiResult.history_slides.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < activeSlide ? 'w-full' : idx === activeSlide ? 'w-full scale-x-100 origin-left animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-auto max-w-2xl mx-auto">
            <span className="liquid-glass text-white/90 text-xs px-3 py-1 rounded-full font-medium">
              {aiResult.architectural_style}
            </span>
            <span className="liquid-glass text-white/90 text-xs px-3 py-1 rounded-full font-medium">
              {aiResult.built_century}
            </span>
            <span className="liquid-glass text-green-300 text-xs px-3 py-1 rounded-full font-medium border border-green-400/30">
              {aiResult.confidence_score}% Match
            </span>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto flex-1 my-8">
            <h2 className="text-5xl sm:text-7xl text-white mb-6 font-normal drop-shadow-lg" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {aiResult.name}
            </h2>
            <p className="text-white/95 text-lg sm:text-xl leading-relaxed max-w-lg drop-shadow-md">
              {aiResult.history_slides[activeSlide]}
            </p>
          </div>

          {/* Tap Zones for Navigation */}
          <div 
            className="absolute inset-y-24 left-0 w-[30%] cursor-w-resize z-20"
            onClick={() => setActiveSlide(s => Math.max(0, s - 1))}
          />
          <div 
            className="absolute inset-y-24 right-0 w-[70%] cursor-e-resize z-20"
            onClick={() => setActiveSlide(s => Math.min(aiResult.history_slides.length - 1, s + 1))}
          />

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto relative z-30">
            <button
              onClick={() => {
                setAiResult(null);
                setCapturedImage(null);
                setModalState('viewfinder');
              }}
              className="w-full liquid-glass text-white font-semibold px-6 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition"
            >
              <Camera size={18} />
              <span>Scan Another</span>
            </button>
            <button
              onClick={() => {
                handleClose();
                onViewMap(aiResult.name);
              }}
              className="w-full bg-white text-black font-semibold px-6 py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-white/90 transition"
            >
              <MapPin size={18} />
              <span>View on Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
