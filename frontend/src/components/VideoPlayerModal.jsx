import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize,
  Minimize, X, Lock, CreditCard, Sparkles, AlertCircle, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VideoPlayerModal({ video, onClose, onOpenBilling }) {
  const { currentProfile, reloadSubscription } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Estados de Paywall y Reglas de Cobro
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const [quotaToast, setQuotaToast] = useState('');
  const [activatingPlan, setActivatingPlan] = useState(false);

  // Comprobar regla de cobro al cargar el video
  useEffect(() => {
    async function checkQuotaAndWatch() {
      try {
        const res = await api.videos.watch(video.id, currentProfile?.id);
        if (res.allowed) {
          if (res.status === 'trial') {
            setQuotaToast(`Video ${res.videos_watched_count} de ${res.max_free_videos} de tu periodo de prueba gratis`);
          }
          if (videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }
      } catch (err) {
        if (err.status === 402 || (err.data && err.data.requires_billing)) {
          setPaywallBlocked(true);
          setPaywallReason(err.data?.message || 'Has alcanzado el límite inicial de videos de prueba o tu día ha concluido.');
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      }
    }

    if (video) {
      checkQuotaAndWatch();
    }
  }, [video]);

  // Manejo de Controles de Reproducción
  const togglePlay = () => {
    if (paywallBlocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume || 0.8;
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Desbloqueo rápido desde el Paywall
  const handleActivateSubscription = async () => {
    setActivatingPlan(true);
    try {
      await api.billing.subscribe({});
      await reloadSubscription();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setPaywallBlocked(false);
      setQuotaToast('¡Membresía TECFLIX VIP activada! Disfruta reproducción ilimitada.');
      if (videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } catch (err) {
      alert(err.message || 'Por favor registra una tarjeta de crédito o débito antes de continuar.');
      onOpenBilling?.();
    } finally {
      setActivatingPlan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none">
      <div
        ref={containerRef}
        onMouseMove={() => setShowControls(true)}
        className="relative w-full h-full max-w-7xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center"
      >
        {/* Elemento de Video */}
        <video
          ref={videoRef}
          src={video.video_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Notificación de Cuota / Trial */}
        {quotaToast && !paywallBlocked && (
          <div className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/80 border border-purple-500/50 backdrop-blur-md text-xs text-purple-200 shadow-neon-purple animate-fade-in">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>{quotaToast}</span>
          </div>
        )}

        {/* Botón Cerrar Superior */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-black/60 hover:bg-purple-950/80 text-white/80 hover:text-white border border-white/20 transition duration-200 backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* OVERLAY DE PAYWALL (Reglas de cobro: 2 videos y 1 día) */}
        {paywallBlocked && (
          <div className="absolute inset-0 z-40 bg-[#080312]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-md w-full bg-[#120726] border border-purple-600/60 rounded-3xl p-8 shadow-glow-lg flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border border-purple-400 flex items-center justify-center text-purple-300 mb-4 shadow-neon-purple">
                <Lock className="w-8 h-8 text-fuchsia-400" />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-400 mb-1">
                Límite de Reproducción Alcanzado
              </span>
              <h3 className="text-2xl font-black text-white mb-3">
                Continúa viendo en TECFLIX
              </h3>

              <p className="text-xs text-purple-300/90 leading-relaxed mb-6">
                {paywallReason}
              </p>

              <div className="w-full p-4 rounded-2xl bg-[#090314] border border-purple-800/40 mb-6 text-left">
                <div className="flex items-center justify-between text-xs text-purple-200 font-semibold mb-2">
                  <span>Membresía TECFLIX VIP</span>
                  <span className="text-fuchsia-400 font-bold">$9.99 USD / mes</span>
                </div>
                <div className="space-y-1 text-[11px] text-purple-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reproducción ilimitada en 4K Ultra HD</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pago con Tarjeta de Crédito o Débito</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cancela en cualquier momento sin penalizaciones</span>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={handleActivateSubscription}
                  disabled={activatingPlan}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-neon-purple transition duration-200 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{activatingPlan ? 'Procesando Cobro...' : 'Activar Membresía VIP ($9.99 USD)'}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBilling?.();
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-800/40 transition"
                >
                  Configurar Tarjetas de Crédito / Débito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Controles Inferior Personalizada */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
            showControls && !paywallBlocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Título del Video */}
          <div className="mb-3">
            <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-md">
              {video.title}
            </h3>
            <p className="text-xs text-purple-300/80 line-clamp-1">{video.description}</p>
          </div>

          {/* Barra de Búsqueda / Seekbar */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono text-purple-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 hover:h-2 transition-all"
            />
            <span className="text-xs font-mono text-purple-300">{formatTime(duration)}</span>
          </div>

          {/* Controles Principales */}
          <div className="flex items-center justify-between">
            {/* Lado Izquierdo: Play/Pause, Rewind, FastForward, Volumen */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-white text-black hover:bg-purple-200 transition duration-150"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => skipTime(-10)}
                title="Retroceder 10s"
                className="p-2 text-purple-300 hover:text-white transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => skipTime(10)}
                title="Avanzar 10s"
                className="p-2 text-purple-300 hover:text-white transition"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 group">
                <button onClick={toggleMute} className="text-purple-300 hover:text-white">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Lado Derecho: Velocidad, Calidad y Pantalla Completa */}
            <div className="flex items-center gap-4">
              {/* Selector de Velocidad */}
              <div className="flex items-center gap-1 bg-purple-950/60 px-2 py-1 rounded-lg border border-purple-800/40 text-xs">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      playbackSpeed === speed ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Badge de Calidad */}
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/40">
                4K HDR
              </span>

              {/* Pantalla Completa */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-purple-300 hover:text-white transition"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
