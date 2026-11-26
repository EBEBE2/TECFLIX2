import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Sparkles, User, Check, X } from 'lucide-react';
import { api } from '../services/api';

export default function ProfileSelector({ onSelect, onOpenSkinCustomizer }) {
  const { profiles, reloadProfiles, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isKids, setIsKids] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setLoading(true);
    try {
      await api.profiles.create({
        name: newProfileName.trim(),
        skin_id: 1,
        is_kids: isKids
      });
      await reloadProfiles();
      setIsCreating(false);
      setNewProfileName('');
      setIsKids(false);
    } catch (err) {
      alert(err.message || 'Error al crear perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080312] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Luces de fondo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl w-full">
        <h1 className="text-4xl md:text-5xl font-black tracking-wider text-white mb-3">
          ¿Quién está viendo ahora?
        </h1>
        <p className="text-purple-300 text-sm mb-12">
          Selecciona tu perfil de <span className="text-fuchsia-400 font-bold">TECFLIX</span> con tu skin personalizada
        </p>

        {/* Grilla de Perfiles */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-12">
          {profiles.map((profile) => {
            const frameClass = `frame-${profile.frame_style || 'neon_purple'}`;
            return (
              <div
                key={profile.id}
                onClick={() => onSelect(profile)}
                className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-110"
              >
                {/* Contenedor del Avatar con Marco de Skin */}
                <div className="relative mb-3">
                  <div
                    className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-purple-950 p-1 transition-all duration-300 ${frameClass} group-hover:shadow-glow-lg`}
                    style={{
                      borderColor: profile.glow_color || '#a855f7',
                    }}
                  >
                    <img
                      src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  {profile.is_kids && (
                    <span className="absolute bottom-1 right-1 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      INFANTIL
                    </span>
                  )}
                </div>

                {/* Nombre de Perfil */}
                <span className="text-base md:text-lg font-medium text-purple-200 group-hover:text-white group-hover:font-bold transition">
                  {profile.name}
                </span>

                {/* Nombre de Skin */}
                <span className="text-[11px] text-purple-400/70 font-mono mt-0.5">
                  {profile.skin_name || 'Skin Neón'}
                </span>
              </div>
            );
          })}

          {/* Tarjeta de Agregar Perfil */}
          <div
            onClick={() => setIsCreating(true)}
            className="group flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-2 border-dashed border-purple-700/60 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-900/40 flex items-center justify-center transition mb-3">
              <Plus className="w-10 h-10 text-purple-400 group-hover:text-white transition" />
            </div>
            <span className="text-sm md:text-base font-medium text-purple-400 group-hover:text-white">
              Añadir Perfil
            </span>
          </div>
        </div>

        {/* Botones de Administración de Skins */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenSkinCustomizer}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 hover:text-white text-sm font-semibold tracking-wide transition duration-200 shadow-neon-purple hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Personalizar Skins de Perfil</span>
          </button>
        </div>
      </div>

      {/* Modal Crear Perfil */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120726] border border-purple-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nuevo Perfil</h3>
              <button onClick={() => setIsCreating(false)} className="text-purple-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">Nombre del perfil</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ej. Cine Nocturno"
                  className="w-full bg-[#080312] border border-purple-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="kidsCheck"
                  checked={isKids}
                  onChange={(e) => setIsKids(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="kidsCheck" className="text-xs text-purple-200 cursor-pointer">
                  ¿Es un perfil para menores (infantil)?
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 rounded-xl bg-purple-950/60 text-purple-300 text-xs font-semibold hover:bg-purple-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-neon-purple"
                >
                  {loading ? 'Creando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
