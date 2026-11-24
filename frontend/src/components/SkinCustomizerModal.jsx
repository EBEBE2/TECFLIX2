import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Sparkles, Check, Palette, Plus, Wand2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESET_AVATARS = [
  { label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' },
  { label: 'Matriz Digital', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop' },
  { label: 'Reina Violeta', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop' },
  { label: 'Piloto Estelar', url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop' },
  { label: 'Hacker Holográfico', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop' },
  { label: 'Sombra Nocturna', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop' },
  { label: 'Guerrero Cósmico', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { label: 'Androide Sintético', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' },
];

const FRAME_OPTIONS = [
  { id: 'neon_purple', name: 'Neón Púrpura Imperial', border: '#a855f7' },
  { id: 'cyber_pulse', name: 'Pulso Cuántico Cian', border: '#06b6d4' },
  { id: 'golden_vip', name: 'Diamante VIP Dorado', border: '#f59e0b' },
  { id: 'crimson_flame', name: 'Llama Carmesí Neón', border: '#ef4444' },
  { id: 'holographic', name: 'Nebulosa Holográfica', border: '#c084fc' },
  { id: 'obsidian_dark', name: 'Obsidiana Sigilosa', border: '#64748b' },
];

const GLOW_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#ffffff'];

export default function SkinCustomizerModal({ onClose }) {
  const { currentProfile, reloadProfiles } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'create'
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para crear nueva skin
  const [skinName, setSkinName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [selectedFrame, setSelectedFrame] = useState('neon_purple');
  const [selectedGlow, setSelectedGlow] = useState('#a855f7');
  const [selectedAccent, setSelectedAccent] = useState('#7c3aed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSkins() {
      try {
        const res = await api.profiles.getSkins();
        setSkins(res.data || []);
      } catch (_) {}
      finally {
        setLoading(false);
      }
    }
    loadSkins();
  }, []);

  const handleApplySkin = async (skin) => {
    if (!currentProfile) return;
    try {
      await api.profiles.updateSkin(currentProfile.id, skin.id);
      await reloadProfiles();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
    } catch (err) {
      alert(err.message || 'Error al aplicar skin');
    }
  };

  const handleCreateCustomSkin = async (e) => {
    e.preventDefault();
    if (!skinName.trim()) return;
    setSaving(true);
    try {
      const res = await api.profiles.createCustomSkin({
        name: skinName.trim(),
        avatar_url: selectedAvatarUrl,
        frame_style: selectedFrame,
        glow_color: selectedGlow,
        theme_accent: selectedAccent,
        border_width: 4
      });

      // Aplicar de inmediato al perfil actual
      if (currentProfile && res.data) {
        await api.profiles.updateSkin(currentProfile.id, res.data.id);
        await reloadProfiles();
      }

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      alert(err.message || 'Error al crear skin personalizada');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#120726] border border-purple-700/50 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-purple-950/60 hover:bg-purple-900 text-purple-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-900/60 text-fuchsia-400 border border-purple-600/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Skins de Perfil TECFLIX</h2>
            <p className="text-xs text-purple-300">
              Personaliza avatares, marcos neón y efectos luminosos para{' '}
              <span className="font-bold text-white">{currentProfile?.name || 'tu perfil'}</span>
            </p>
          </div>
        </div>

        {/* Pestañas: Catálogo vs Creador */}
        <div className="flex border-b border-purple-800/40 mb-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'catalog'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Skins Oficiales</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'create'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-purple-400 hover:text-purple-200'
            }`}
          >
            <Wand2 className="w-4 h-4 text-fuchsia-400" />
            <span>Crear Skin Personalizada</span>
          </button>
        </div>

        {/* Tab 1: Catálogo de Skins */}
        {activeTab === 'catalog' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
              {skins.map((skin) => {
                const isSelected = currentProfile?.skin_id === skin.id;
                const frameClass = `frame-${skin.frame_style || 'neon_purple'}`;
                return (
                  <div
                    key={skin.id}
                    onClick={() => handleApplySkin(skin)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col items-center text-center group ${
                      isSelected
                        ? 'bg-purple-900/40 border-purple-400 shadow-neon-purple'
                        : 'bg-[#090314] border-purple-900/50 hover:border-purple-600 hover:bg-purple-950/40'
                    }`}
                  >
                    <div
                      className={`w-20 h-20 rounded-xl overflow-hidden mb-3 ${frameClass} transition duration-300 group-hover:scale-105`}
                      style={{ borderColor: skin.glow_color || '#a855f7' }}
                    >
                      <img src={skin.avatar_url} alt={skin.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-purple-200 mb-1">
                      {skin.name}
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">
                      {skin.frame_style}
                    </span>
                    {isSelected && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <Check className="w-3 h-3" /> Activa
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Crear Skin Personalizada */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateCustomSkin} className="space-y-6">
            {/* Vista Previa Interactiva */}
            <div className="p-4 rounded-2xl bg-[#090314] border border-purple-800/40 flex items-center justify-center gap-6">
              <div
                className={`w-24 h-24 rounded-2xl overflow-hidden frame-${selectedFrame}`}
                style={{
                  borderColor: selectedGlow,
                  boxShadow: `0 0 20px ${selectedGlow}88`
                }}
              >
                <img src={selectedAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Vista Previa</span>
                <h4 className="text-lg font-bold text-white">{skinName || 'Mi Skin Futurista'}</h4>
                <p className="text-xs text-purple-300 font-mono">Marco: {selectedFrame}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedGlow }} />
                  <span className="text-[11px] text-purple-400 font-mono">Glow: {selectedGlow}</span>
                </div>
              </div>
            </div>

            {/* Nombre de la Skin */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">Nombre de la skin</label>
              <input
                type="text"
                required
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
                placeholder="Ej. Guardián Cuántico Ultra"
                className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Seleccionar Avatar de Galería */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-2">Selecciona un Avatar</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatarUrl(av.url)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                      selectedAvatarUrl === av.url ? 'border-purple-400 scale-105' : 'border-purple-900/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Estilo de Marco */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-2">Estilo de Marco Luminoso</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FRAME_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFrame(f.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                      selectedFrame === f.id
                        ? 'bg-purple-900/50 border-purple-400 text-white'
                        : 'bg-[#090314] border-purple-900/40 text-purple-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: f.border }} />
                      <span>{f.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color del Resplandor (Glow) */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-2">Color del Resplandor Neón</label>
              <div className="flex items-center gap-3">
                {GLOW_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedGlow(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedGlow === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Botón Guardar Skin */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-neon-purple transition duration-200 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Guardando Skin...' : 'Crear y Aplicar Skin al Perfil'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
