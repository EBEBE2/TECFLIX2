import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, Bell, Sparkles, CreditCard, LogOut,
  Users, Clapperboard, ChevronDown, UserCircle
} from 'lucide-react';

export default function Navbar({
  searchTerm,
  onSearchChange,
  onOpenSkins,
  onOpenBilling,
  onOpenProfiles,
  currentView,
  onViewChange
}) {
  const { user, currentProfile, subscription, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCreator = user?.role === 'creator';
  const isSubscriber = user?.role === 'subscriber';
  const frameClass = `frame-${currentProfile?.frame_style || 'neon_purple'}`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 md:px-8 py-3.5 flex items-center justify-between ${
        isScrolled
          ? 'bg-[#080312]/95 backdrop-blur-md shadow-2xl border-b border-purple-900/40'
          : 'bg-gradient-to-b from-[#080312]/90 via-[#080312]/50 to-transparent'
      }`}
    >
      {/* Lado Izquierdo: Logo y Enlaces */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => onViewChange('home')}
          className="flex items-center gap-2 group text-left"
        >
          <span className="text-2xl md:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-400 to-fuchsia-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] group-hover:scale-105 transition-transform duration-200">
            TECFLIX
          </span>
        </button>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-purple-200">
          <button
            onClick={() => onViewChange('home')}
            className={`hover:text-white transition ${currentView === 'home' ? 'text-fuchsia-400 font-bold' : ''}`}
          >
            Inicio
          </button>
          <button
            onClick={() => onViewChange('home')}
            className="hover:text-white transition"
          >
            Películas
          </button>
          <button
            onClick={() => onViewChange('home')}
            className="hover:text-white transition"
          >
            Series & Originales
          </button>

          {isCreator && (
            <button
              onClick={() => onViewChange('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                currentView === 'studio'
                  ? 'bg-fuchsia-600 text-white shadow-neon-purple'
                  : 'bg-purple-950/80 text-fuchsia-300 border border-fuchsia-600/40 hover:bg-purple-900'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Estudio de Creador</span>
            </button>
          )}
        </div>
      </div>

      {/* Lado Derecho: Búsqueda, Estado de Suscripción, Perfil con Skin */}
      <div className="flex items-center gap-4">
        {/* Barra de Búsqueda */}
        <div className="relative flex items-center">
          {searchOpen ? (
            <div className="flex items-center bg-[#120726] border border-purple-600/60 rounded-full px-3 py-1.5 shadow-neon-purple transition-all duration-200">
              <Search className="w-4 h-4 text-purple-400 mr-2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Títulos, directores, tags..."
                className="bg-transparent text-xs text-white placeholder-purple-400 focus:outline-none w-36 md:w-56"
              />
              <button onClick={() => setSearchOpen(false)} className="text-purple-400 hover:text-white text-xs ml-1">
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-purple-300 hover:text-white transition"
              title="Buscar contenido"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Badge de Suscripción / Rol */}
        {isSubscriber && (
          <button
            onClick={onOpenBilling}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition border ${
              subscription?.status === 'active'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>
              {subscription?.status === 'active'
                ? 'VIP Activo'
                : `Prueba: ${subscription?.videos_watched_count || 0}/2 videos`}
            </span>
          </button>
        )}

        {isCreator && (
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/40">
            <Clapperboard className="w-3 h-3" /> Creador
          </span>
        )}

        {/* Dropdown de Perfil con Marco de Skin Activa */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-purple-950/40 transition"
          >
            {/* Avatar con marco de skin y color de resplandor */}
            <div
              className={`w-9 h-9 rounded-xl overflow-hidden bg-purple-950 ${frameClass} transition duration-200`}
              style={{ borderColor: currentProfile?.glow_color || '#a855f7' }}
            >
              <img
                src={currentProfile?.avatar_url || user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                alt={currentProfile?.name || 'Perfil'}
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-purple-300 hidden md:block" />
          </button>

          {/* Menú Flotante */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              className="absolute right-0 mt-3 w-64 bg-[#120726] border border-purple-700/60 rounded-2xl shadow-2xl py-2 backdrop-blur-xl animate-fade-in"
            >
              <div className="px-4 py-3 border-b border-purple-900/60">
                <p className="text-xs font-bold text-white line-clamp-1">
                  {currentProfile?.name || user?.full_name}
                </p>
                <p className="text-[10px] text-fuchsia-400 font-mono">
                  Skin: {currentProfile?.skin_name || 'Neón Violeta'}
                </p>
                <p className="text-[10px] text-purple-400 font-mono mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="py-1 text-xs">
                <button
                  onClick={onOpenProfiles}
                  className="w-full text-left px-4 py-2 hover:bg-purple-900/50 flex items-center gap-2.5 text-purple-200 hover:text-white"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Cambiar de Perfil</span>
                </button>

                <button
                  onClick={onOpenSkins}
                  className="w-full text-left px-4 py-2 hover:bg-purple-900/50 flex items-center gap-2.5 text-purple-200 hover:text-white"
                >
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>Personalizar Skins</span>
                </button>

                <button
                  onClick={onOpenBilling}
                  className="w-full text-left px-4 py-2 hover:bg-purple-900/50 flex items-center gap-2.5 text-purple-200 hover:text-white"
                >
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Tarjetas & Facturación</span>
                </button>

                {isCreator && (
                  <button
                    onClick={() => onViewChange('studio')}
                    className="w-full text-left px-4 py-2 hover:bg-purple-900/50 flex items-center gap-2.5 text-purple-200 hover:text-white"
                  >
                    <Clapperboard className="w-4 h-4 text-emerald-400" />
                    <span>Panel de Creador (GCS)</span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-purple-900/60">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-red-950/50 flex items-center gap-2.5 text-red-300 hover:text-red-200 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
