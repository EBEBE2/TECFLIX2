import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Play, Info, Plus, Check, ChevronLeft, ChevronRight,
  Sparkles, Star, Film, Eye, ShieldAlert
} from 'lucide-react';

export default function HomePage({ onSelectVideo, searchTerm }) {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [infoModalVideo, setInfoModalVideo] = useState(null);
  const [myList, setMyList] = useState([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [vidsRes, catsRes] = await Promise.all([
          api.videos.getAll({ search: searchTerm }),
          api.categories.getAll()
        ]);

        const list = vidsRes.data || [];
        setVideos(list);
        setCategories(catsRes.data || []);

        const featured = list.find(v => v.is_featured) || list[0] || null;
        setFeaturedVideo(featured);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [searchTerm]);

  const toggleMyList = (videoId) => {
    setMyList(prev =>
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const getVideosByCategory = (catId) => {
    return videos.filter(v => v.category_id === catId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080312] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-fuchsia-400 rounded-full animate-spin" />
          <p className="text-xs text-purple-300 font-mono tracking-widest uppercase">Cargando Catálogo TECFLIX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080312] text-white pb-20 overflow-x-hidden">
      {/* 1. HERO BANNER PRINCIPAL (cinemático de TECFLIX) */}
      {featuredVideo && !searchTerm && (
        <div className="relative w-full h-[75vh] md:h-[85vh] select-none">
          {/* Imagen de fondo con gradientes */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={featuredVideo.thumbnail_url}
              alt={featuredVideo.title}
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-1000"
            />
            {/* Gradientes para fundir perfectamente con la estética morada de TECFLIX */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080312] via-[#080312]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080312] via-[#080312]/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.25),transparent_70%)]" />
          </div>

          {/* Información del Video Destacado */}
          <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-16 md:pb-24 max-w-3xl">
            {/* Badges de calidad */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-fuchsia-600/90 text-white shadow-neon-purple">
                N° 1 EN TENDENCIAS TECFLIX
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                99% Coincidencia
              </span>
              <span className="text-[11px] font-bold text-purple-200 border border-purple-500/40 px-1.5 py-0.5 rounded">
                {featuredVideo.rating || '16+'}
              </span>
              <span className="text-[11px] font-mono text-purple-300">
                {featuredVideo.release_year || '2026'}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-wide mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {featuredVideo.title}
            </h1>

            <p className="text-sm md:text-base text-purple-200/90 line-clamp-3 mb-6 leading-relaxed max-w-2xl drop-shadow-md">
              {featuredVideo.description}
            </p>

            {/* Botones de Acción */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onSelectVideo(featuredVideo)}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide shadow-xl hover:bg-purple-200 transition duration-200 hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Reproducir</span>
              </button>

              <button
                onClick={() => setInfoModalVideo(featuredVideo)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1d0c3d]/80 hover:bg-[#281155] border border-purple-500/40 text-white font-semibold text-sm tracking-wide backdrop-blur-md transition duration-200"
              >
                <Info className="w-5 h-5 text-purple-300" />
                <span>Más información</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILAS DE CATEGORÍAS (CARROUSELES HORIZONTALES) */}
      <div className={`space-y-10 px-4 md:px-8 ${featuredVideo && !searchTerm ? '-mt-12 relative z-20' : 'pt-24'}`}>
        {/* Fila de Búsqueda si está activa */}
        {searchTerm && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Resultados de búsqueda para: <span className="text-fuchsia-400">"{searchTerm}"</span>
            </h2>
            {videos.length === 0 ? (
              <p className="text-xs text-purple-400 italic">No se encontraron videos con ese criterio.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={() => onSelectVideo(video)}
                    onInfo={() => setInfoModalVideo(video)}
                    isInList={myList.includes(video.id)}
                    onToggleList={() => toggleMyList(video.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fila: Tendencias Populares */}
        {!searchTerm && (
          <div>
            <h2 className="text-lg md:text-xl font-black text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-fuchsia-500 rounded-full" />
              <span>Tendencias en TECFLIX</span>
            </h2>
            <VideoRow
              videos={videos}
              onPlay={onSelectVideo}
              onInfo={setInfoModalVideo}
              myList={myList}
              onToggleList={toggleMyList}
            />
          </div>
        )}

        {/* Filas Dinámicas por Categoría */}
        {!searchTerm && categories.map((cat) => {
          const catVideos = getVideosByCategory(cat.id);
          if (catVideos.length === 0) return null;
          return (
            <div key={cat.id}>
              <h2 className="text-lg md:text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-purple-500 rounded-full" />
                <span>{cat.name}</span>
                <span className="text-xs text-purple-400/80 font-normal ml-2">({cat.description})</span>
              </h2>
              <VideoRow
                videos={catVideos}
                onPlay={onSelectVideo}
                onInfo={setInfoModalVideo}
                myList={myList}
                onToggleList={toggleMyList}
              />
            </div>
          );
        })}
      </div>

      {/* Modal de Más Información */}
      {infoModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120726] border border-purple-700/50 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="relative h-64 bg-black">
              <img
                src={infoModalVideo.thumbnail_url}
                alt={infoModalVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120726] via-transparent to-black/40" />
              <button
                onClick={() => setInfoModalVideo(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-purple-900 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-bold text-emerald-400">98% Coincidencia</span>
                <span className="border border-purple-500/40 px-1 rounded text-purple-300">{infoModalVideo.rating || '16+'}</span>
                <span className="font-mono text-purple-400">{infoModalVideo.release_year || '2026'}</span>
                <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 text-[10px] font-bold">
                  {infoModalVideo.storage_type === 'gcs' ? '☁ Google Cloud Storage' : 'Local HD'}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{infoModalVideo.title}</h3>
              <p className="text-xs text-purple-300 leading-relaxed mb-6">{infoModalVideo.description}</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const v = infoModalVideo;
                    setInfoModalVideo(null);
                    onSelectVideo(v);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-neon-purple flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Reproducir Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Fila Desplazable Horizontalmente
function VideoRow({ videos, onPlay, onInfo, myList, onToggleList }) {
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/row">
      {/* Botón flecha izquierda */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-28 bg-black/60 hover:bg-purple-950/90 text-white flex items-center justify-center rounded-r-xl opacity-0 group-hover/row:opacity-100 transition duration-200 backdrop-blur-sm"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Contenedor con scroll horizontal suave */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
      >
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={() => onPlay(video)}
            onInfo={() => onInfo(video)}
            isInList={myList.includes(video.id)}
            onToggleList={() => onToggleList(video.id)}
          />
        ))}
      </div>

      {/* Botón flecha derecha */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-28 bg-black/60 hover:bg-purple-950/90 text-white flex items-center justify-center rounded-l-xl opacity-0 group-hover/row:opacity-100 transition duration-200 backdrop-blur-sm"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

// Tarjeta Individual de Video con Efecto Zoom Hover
function VideoCard({ video, onPlay, onInfo, isInList, onToggleList }) {
  return (
    <div className="min-w-[200px] md:min-w-[260px] max-w-[260px] rounded-2xl overflow-hidden bg-[#120726] border border-purple-900/50 hover:border-purple-500/80 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple flex flex-col group cursor-pointer">
      {/* Miniatura */}
      <div onClick={onPlay} className="relative h-36 md:h-40 overflow-hidden bg-black">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        />

        {/* Overlay al hacer hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
          <div className="p-3 rounded-full bg-white text-black shadow-lg transform scale-90 group-hover:scale-100 transition">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badge de Almacenamiento */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/70 backdrop-blur-md text-purple-300 border border-purple-500/30">
          {video.storage_type === 'gcs' ? '☁ GCS' : 'HD'}
        </span>
      </div>

      {/* Info de Tarjeta */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider line-clamp-1">
              {video.category_name || 'Original'}
            </span>
            <span className="text-[10px] font-mono text-purple-400">
              {video.release_year || '2026'}
            </span>
          </div>

          <h3 onClick={onPlay} className="text-sm font-bold text-white group-hover:text-purple-200 line-clamp-1 mb-1">
            {video.title}
          </h3>
          <p className="text-[11px] text-purple-300/70 line-clamp-2">{video.description}</p>
        </div>

        {/* Acciones de la Tarjeta */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-purple-950 text-xs">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views_count || 0}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleList();
              }}
              className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-300 hover:text-white transition"
              title={isInList ? 'Quitar de mi lista' : 'Agregar a mi lista'}
            >
              {isInList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-300 hover:text-white transition"
              title="Más información"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

