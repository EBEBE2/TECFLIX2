import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, Users, Lock, Mail, User, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthScreen({ initialRole = 'subscriber' }) {
  const { login, register } = useAuth();
  const [selectedRole, setSelectedRole] = useState(initialRole); // 'creator' | 'subscriber'
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password, selectedRole);
      } else {
        await register({
          full_name: fullName,
          email,
          password,
          role: selectedRole
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass, role) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoginMode(true);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#080312] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Fondo con manchas violetas brillantes */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-700/20 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera TECFLIX */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-400 to-fuchsia-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]">
          TECFLIX
        </h1>
        <p className="text-purple-300/80 text-sm mt-2 tracking-wide font-medium">
          Acceso Exclusivo por Roles: Creadores & Suscriptores
        </p>
      </div>

      {/* Contenedor Principal del Formulario */}
      <div className="w-full max-w-md bg-[#120726]/90 border border-purple-800/40 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-purple-950/50 z-10">
        {/* Selector de Rol (Creador vs Suscriptor con credenciales separadas) */}
        <div className="grid grid-cols-2 gap-2 bg-[#090314] p-1.5 rounded-xl mb-6 border border-purple-900/50">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('subscriber');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              selectedRole === 'subscriber'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-neon-purple'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Suscriptor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('creator');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              selectedRole === 'creator'
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-neon-purple'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Creador</span>
          </button>
        </div>

        {/* Indicador de Rol Seleccionado */}
        <div className="mb-6 p-3 rounded-lg bg-purple-950/40 border border-purple-800/30 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-900/60 text-purple-300">
            {selectedRole === 'creator' ? <Clapperboard className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div className="text-xs">
            <span className="font-semibold text-purple-200">
              {selectedRole === 'creator' ? 'Portal de Creadores de Contenido' : 'Portal de Suscriptores y Usuarios'}
            </span>
            <p className="text-purple-400/80">
              {selectedRole === 'creator'
                ? 'Sube tus videos a Google Cloud Storage y monetiza con tarjeta.'
                : 'Disfruta streaming 4K, personaliza tus skins y administra tu plan.'}
            </p>
          </div>
        </div>

        {/* Título de Modo */}
        <h2 className="text-xl font-bold text-white mb-2">
          {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <p className="text-xs text-purple-300/70 mb-6">
          {isLoginMode
            ? 'Ingresa tus credenciales para acceder a tu panel.'
            : 'Únete hoy y empieza a disfrutar o compartir contenido.'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Simón Bolívar"
                  className="w-full bg-[#090314] border border-purple-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'creator' ? 'creador@tecflix.com' : 'usuario@tecflix.com'}
                className="w-full bg-[#090314] border border-purple-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090314] border border-purple-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-neon-purple transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <span>{isLoginMode ? 'Entrar a TECFLIX' : 'Registrar y Continuar'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Alternar entre Iniciar Sesión y Registro */}
        <div className="mt-6 text-center text-xs text-purple-400">
          {isLoginMode ? '¿No tienes cuenta aún?' : '¿Ya tienes una cuenta registrada?'}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg('');
            }}
            className="ml-2 font-bold text-fuchsia-400 hover:text-fuchsia-300 underline"
          >
            {isLoginMode ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>

        {/* Acceso Rápido con Cuentas de Demostración */}
        <div className="mt-8 pt-6 border-t border-purple-900/60">
          <p className="text-[11px] font-semibold text-purple-300/70 uppercase tracking-wider mb-3 text-center">
            Acceso Rápido para Pruebas (Demo)
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('creador@tecflix.com', 'TecflixCreator2026!', 'creator')}
              className="w-full text-left p-2.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-purple-200">Creador de Contenido (Simón)</span>
                <p className="text-[10px] text-purple-400 font-mono">creador@tecflix.com</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-800 text-purple-200 font-semibold">Creador</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('suscriptor@tecflix.com', 'TecflixUser2026!', 'subscriber')}
              className="w-full text-left p-2.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-purple-200">Suscriptor VIP Activo (Ana)</span>
                <p className="text-[10px] text-purple-400 font-mono">suscriptor@tecflix.com</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900 text-emerald-200 font-semibold">VIP</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('nuevo@tecflix.com', 'TecflixUser2026!', 'subscriber')}
              className="w-full text-left p-2.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-purple-200">Suscriptor en Prueba (Carlos)</span>
                <p className="text-[10px] text-purple-400 font-mono">nuevo@tecflix.com (1/2 videos)</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-900 text-amber-200 font-semibold">Prueba</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
