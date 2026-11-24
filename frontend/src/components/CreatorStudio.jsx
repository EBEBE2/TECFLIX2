import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UploadCloud, Film, DollarSign, Eye, Trash2, CheckCircle2,
  AlertCircle, Sparkles, CreditCard, Clock, Layers, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreatorStudio({ onOpenBilling }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'videos' | 'analytics'
  const [categories, setCategories] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formulario de Subida
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('Original, 4K, Cyberpunk');
  const [duration, setDuration] = useState(600);
  const [isFeatured, setIsFeatured] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadCreatorData = async () => {
    try {
      const [catsRes, vidsRes, statsRes] = await Promise.all([
        api.categories.getAll(),
        api.videos.getAll({ creator_id: user?.id }),
        api.billing.getCreatorStats().catch(() => ({ data: null }))
      ]);

      setCategories(catsRes.data || []);
      if (catsRes.data && catsRes.data.length > 0 && !categoryId) {
        setCategoryId(catsRes.data[0].id);
      }
      setMyVideos((vidsRes.data || []).filter(v => v.creator_id === user?.id));
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [user]);

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    setFeedbackMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description);
      formData.append('category_id', categoryId || '1');
      formData.append('tags', tags);
      formData.append('duration_seconds', duration);
      formData.append('is_featured', isFeatured);

      if (videoFile) {
        formData.append('video', videoFile);
      } else {
        // En caso de usar URL remota
        formData.append('video_url', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
      }

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl) {
        formData.append('thumbnail_url', thumbnailUrl);
      }

      const res = await api.videos.upload(formData);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      setFeedbackMsg({
        type: 'success',
        text: `¡Video subido exitosamente a ${res.data.storage_type === 'gcs' ? 'Google Cloud Storage' : 'Servidor TECFLIX'}! Registrado en PostgreSQL.`
      });

      // Resetear campos
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailUrl('');

      await loadCreatorData();
      setActiveTab('videos');
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Error al procesar la subida del video.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta producción?')) return;
    try {
      await api.videos.delete(id);
      await loadCreatorData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-[#080312] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Encabezado del Estudio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-purple-900/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-600/40">
              TECFLIX Creator Studio
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
            Panel de Creador de Contenido
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Gestiona tus producciones audiovisuales, almacena en <span className="text-cyan-400 font-semibold">Google Cloud Storage</span> y monitorea tus ingresos.
          </p>
        </div>

        {/* Resumen Financiero Rápido */}
        <div className="flex items-center gap-4 bg-[#120726] p-4 rounded-2xl border border-purple-800/50 shadow-neon-purple">
          <div className="p-3 rounded-xl bg-purple-900/60 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">Ganancias Estimadas</span>
            <p className="text-2xl font-black text-white">
              ${stats?.estimated_earnings || '0.00'} <span className="text-xs text-purple-400 font-normal">USD</span>
            </p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Eye className="w-3 h-3" /> {stats?.total_views || 0} visualizaciones acumuladas
            </span>
          </div>
          <button
            onClick={onOpenBilling}
            className="ml-2 px-3 py-2 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-xs font-semibold text-white border border-purple-500/40 transition"
          >
            Tarjeta de Cobro
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Panel */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-neon-purple'
              : 'bg-[#120726] text-purple-300 hover:text-white border border-purple-900/50'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Subir Nuevo Video (GCS)</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 ${
            activeTab === 'videos'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-neon-purple'
              : 'bg-[#120726] text-purple-300 hover:text-white border border-purple-900/50'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Mis Videos Publicados ({myVideos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition duration-200 ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-neon-purple'
              : 'bg-[#120726] text-purple-300 hover:text-white border border-purple-900/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Monetización & Cobro</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
            : 'bg-red-950/80 border border-red-500/50 text-red-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* PESTAÑA 1: FORMULARIO DE SUBIDA (GOOGLE CLOUD STORAGE) */}
      {activeTab === 'upload' && (
        <div className="bg-[#120726]/90 border border-purple-800/40 rounded-3xl p-6 md:p-8 backdrop-blur-xl max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/40">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Subir a Google Cloud Storage</h2>
              <p className="text-xs text-purple-300">
                Tus archivos multimedia se transferirán a buckets de GCS y su metadata se indexará en PostgreSQL.
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadVideo} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Título del Video</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Protocolo Cuántico: Primera Misión"
                className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">Sinopsis / Descripción</label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la trama, protagonistas o temas del video..."
                className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ciencia Ficción, 4K, Cyberpunk"
                  className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Archivo de Video */}
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Archivo de Video (MP4, WebM, MKV) &bull; Se subirá a Google Cloud Storage
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0] || null)}
                className="w-full text-xs text-purple-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer bg-[#080312] border border-purple-800/60 rounded-xl p-2"
              />
              <p className="text-[11px] text-purple-400 mt-1">
                {videoFile ? `Archivo seleccionado: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(1)} MB)` : 'Si no seleccionas un archivo físico, se asignará un video de prueba optimizado.'}
              </p>
            </div>

            {/* Miniatura / Thumbnail */}
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1">
                Poster o Miniatura (JPG, PNG) o URL de Imagen
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0] || null)}
                  className="w-full text-xs text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer bg-[#080312] border border-purple-800/60 rounded-xl p-2"
                />
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="O ingresa URL directa de imagen (opcional)"
                  className="w-full bg-[#080312] border border-purple-800/60 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-xs text-purple-200 cursor-pointer font-medium">
                Destacar en la portada principal de TECFLIX (Hero Banner)
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-neon-purple transition flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              <span>{uploading ? 'Transfiriendo a Google Cloud Storage...' : 'Publicar Video en TECFLIX'}</span>
            </button>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: LISTA DE VIDEOS PUBLICADOS */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Catálogo de Videos del Creador</h3>
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-neon-purple transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Video</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myVideos.map((vid) => (
              <div
                key={vid.id}
                className="bg-[#120726] border border-purple-800/40 rounded-2xl overflow-hidden hover:border-purple-600 transition flex flex-col group shadow-lg"
              >
                {/* Miniatura */}
                <div className="relative h-44 overflow-hidden bg-black">
                  <img
                    src={vid.thumbnail_url}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                    {vid.storage_type === 'gcs' ? '☁ GCS Cloud' : 'Local HD'}
                  </div>
                  {vid.is_featured && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-600 text-white shadow-neon-purple">
                      Destacado
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white line-clamp-1 mb-1">{vid.title}</h4>
                    <p className="text-xs text-purple-300/80 line-clamp-2 mb-3">{vid.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-purple-900/50 text-xs text-purple-400">
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Eye className="w-3.5 h-3.5" /> {vid.views_count || 0} vistas
                    </span>

                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-1.5 text-purple-400 hover:text-red-400 transition"
                      title="Eliminar producción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: ANALYTICS Y LIQUIDACIONES DE CREADOR */}
      {activeTab === 'analytics' && (
        <div className="max-w-2xl bg-[#120726] border border-purple-800/40 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-900/60 text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Monetización y Métodos de Cobro</h2>
              <p className="text-xs text-purple-300">
                Cobro de regalías por reproducción en TECFLIX ($0.05 USD por vista única).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#090314] border border-purple-900/60">
              <span className="text-xs text-purple-400">Total de Visualizaciones</span>
              <p className="text-2xl font-black text-white mt-1">{stats?.total_views || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#090314] border border-purple-900/60">
              <span className="text-xs text-purple-400">Ganancias Disponibles</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">${stats?.estimated_earnings || '0.00'} USD</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#090314] border border-purple-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-950 text-purple-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Tarjeta de Débito / Crédito para Cobros</span>
                <p className="text-[11px] text-purple-400">
                  {stats?.payout_methods && stats.payout_methods.length > 0
                    ? `Vinculada: ${stats.payout_methods[0].card_brand} terminada en ${stats.payout_methods[0].card_last4}`
                    : 'Aún no has configurado una tarjeta de cobro.'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBilling}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-neon-purple transition"
            >
              Configurar Tarjeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
