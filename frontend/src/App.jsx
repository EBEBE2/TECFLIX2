import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import IntroScreen from './components/IntroScreen';
import AuthScreen from './components/AuthScreen';
import ProfileSelector from './components/ProfileSelector';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreatorStudio from './components/CreatorStudio';
import VideoPlayerModal from './components/VideoPlayerModal';
import SkinCustomizerModal from './components/SkinCustomizerModal';
import BillingModal from './components/BillingModal';

function MainApp() {
  const { user, currentProfile, selectProfile, loading, introCompleted, finishIntro } = useAuth();

  const [currentView, setCurrentView] = useState('home'); // 'home' | 'studio'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  // 1. Mostrar pantalla de carga inicial si se está recuperando la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080312] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-fuchsia-400 rounded-full animate-spin" />
          <p className="text-xs text-purple-300 font-mono tracking-wider">Cargando TECFLIX...</p>
        </div>
      </div>
    );
  }

  // 2. Experiencia de Intro estilo Netflix con soporte de video local y botón Saltar Intro
  if (!introCompleted) {
    return <IntroScreen onComplete={finishIntro} />;
  }

  // 3. Si no hay sesión iniciada, mostrar pantalla de autenticación con roles separados
  if (!user) {
    return <AuthScreen />;
  }

  // 4. Si el usuario está autenticado pero no ha elegido perfil, mostrar selector de perfil con skins
  if (!currentProfile || showProfileSelector) {
    return (
      <ProfileSelector
        onSelect={(p) => {
          selectProfile(p);
          setShowProfileSelector(false);
        }}
        onOpenSkinCustomizer={() => {
          setShowProfileSelector(false);
          setShowSkinsModal(true);
        }}
      />
    );
  }

  // 5. Aplicación Principal
  return (
    <div className="min-h-screen bg-[#080312] text-white selection:bg-purple-600 selection:text-white">
      {/* Barra de Navegación Superior */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenSkins={() => setShowSkinsModal(true)}
        onOpenBilling={() => setShowBillingModal(true)}
        onOpenProfiles={() => setShowProfileSelector(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Vista Activa */}
      {currentView === 'home' && (
        <HomePage
          onSelectVideo={setSelectedVideo}
          searchTerm={searchTerm}
        />
      )}

      {currentView === 'studio' && (
        <CreatorStudio
          onOpenBilling={() => setShowBillingModal(true)}
        />
      )}

      {/* Reproductor de Video Modal con Reglas de Cobro */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onOpenBilling={() => {
            setSelectedVideo(null);
            setShowBillingModal(true);
          }}
        />
      )}

      {/* Modal de Personalización de Skins de Perfil */}
      {showSkinsModal && (
        <SkinCustomizerModal
          onClose={() => setShowSkinsModal(false)}
        />
      )}

      {/* Modal de Facturación y Tarjetas (Crédito y Débito) */}
      {showBillingModal && (
        <BillingModal
          onClose={() => setShowBillingModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
