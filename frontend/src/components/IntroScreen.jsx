import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, FastForward, Play } from 'lucide-react';

export default function IntroScreen({ onComplete }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sintetizador de audio para acorde cinemático estilo Netflix en tono púrpura
  const playCinematicChord = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const freqs = [55, 110, 164.81, 220, 277.18, 329.63, 440, 659.25];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18 / (i + 1), ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.3);
      });
    } catch (_) {}
  };

  const handleStartPlay = () => {
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
    if (!isMuted) {
      playCinematicChord();
    }
  };

  useEffect(() => {
    // Intentar iniciar automáticamente
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          setHasStarted(true);
        }).catch(() => {
          // El navegador bloqueó autoplay con sonido
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
      if (videoRef.current.currentTime >= videoRef.current.duration - 0.2) {
        onComplete();
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    if (!newMuted) {
      playCinematicChord();
    }
  };

  return (
    <div
      onClick={handleStartPlay}
      className="fixed inset-0 z-50 bg-[#080312] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      {/* Video local de intro en background */}
      <video
        ref={videoRef}
        src="/videos/intro.mp4"
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Degradado morado cinematográfico superior e inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080312] via-[#080312]/40 to-[#080312] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#080312_85%)] pointer-events-none" />

      {/* Logo TECFLIX animado central con resplandor neón violeta */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute -inset-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full blur-3xl opacity-50 animate-pulse" />
          <h1 className="relative text-7xl md:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-200 to-purple-600 drop-shadow-[0_0_35px_rgba(168,85,247,0.9)]">
            TECFLIX
          </h1>
        </div>

        <p className="text-purple-300 font-medium tracking-[0.3em] uppercase text-sm md:text-lg drop-shadow-md">
          Streaming Futurista &bull; Comunidad de Creadores
        </p>

        {!hasStarted && (
          <div className="mt-8 flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200 text-sm animate-bounce">
            <Play className="w-4 h-4 fill-current text-purple-400" />
            <span>Haz clic para iniciar experiencia con audio</span>
          </div>
        )}
      </div>

      {/* Barra de progreso inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-purple-950/80">
        <div
          className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-300 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Botones de control inferiores: Audio y Saltar Intro */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4">
        <button
          onClick={toggleMute}
          title={isMuted ? 'Activar sonido cinemático' : 'Silenciar'}
          className="p-3 rounded-full bg-black/60 hover:bg-purple-950/80 border border-purple-600/40 text-purple-300 hover:text-white transition duration-200 backdrop-blur-md"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white font-semibold text-sm tracking-wide shadow-glow-lg border border-purple-400/50 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span>Saltar intro</span>
          <FastForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
