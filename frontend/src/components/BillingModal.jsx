import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CreditCard, ShieldCheck, Plus, Trash2, X, CheckCircle2,
  Calendar, AlertCircle, Sparkles, DollarSign, Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BillingModal({ onClose }) {
  const { user, subscription, paymentMethods, reloadSubscription, reloadPaymentMethods } = useAuth();

  const isCreator = user?.role === 'creator';
  const [showAddForm, setShowAddForm] = useState(paymentMethods.length === 0);

  // Formulario de nueva tarjeta
  const [cardType, setCardType] = useState('credit'); // 'credit' | 'debit'
  const [cardholderName, setCardholderName] = useState(user?.full_name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2028');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddCard = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await api.billing.addMethod({
        type: cardType,
        cardholder_name: cardholderName,
        card_number: cardNumber,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10),
        billing_address: billingAddress,
        is_default: isDefault
      });

      await reloadPaymentMethods();
      setShowAddForm(false);
      setSuccessMsg(`¡Tarjeta de ${cardType === 'credit' ? 'Crédito' : 'Débito'} agregada correctamente!`);
      setCardNumber('');
      setCvv('');
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este método de pago?')) return;
    try {
      await api.billing.deleteMethod(id);
      await reloadPaymentMethods();
    } catch (err) {
      alert(err.message || 'Error eliminando tarjeta');
    }
  };

  const handleActivatePlan = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.billing.subscribe({});
      await reloadSubscription();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setSuccessMsg(res.message || 'Membresía VIP activada con éxito');
    } catch (err) {
      setErrorMsg(err.message || 'Error al activar membresía');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de estado de prueba para suscriptor
  const videosWatched = subscription?.videos_watched_count || 0;
  const maxVideos = subscription?.max_free_videos || 2;
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#120726] border border-purple-700/50 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-purple-950/60 hover:bg-purple-900 text-purple-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-purple-900/60 text-fuchsia-400 border border-purple-600/40">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              {isCreator ? 'Facturación y Cobros de Creador' : 'Métodos de Pago & Suscripción'}
            </h2>
            <p className="text-xs text-purple-300">
              {isCreator
                ? 'Administra tus tarjetas de crédito y débito para transferencias de ganancias y regalías.'
                : 'Control de tu membresía TECFLIX, cuota de videos y tarjetas de débito/crédito.'}
            </p>
          </div>
        </div>

        {/* Mensajes de Notificación */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SECCIÓN 1: ESTADO DEL PLAN (Para Suscriptores) */}
        {!isCreator && (
          <div className="mb-6 p-5 rounded-2xl bg-[#090314] border border-purple-800/40">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">Estado Actual</span>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{subscription?.plan_name || 'TECFLIX Purple Pass'}</span>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                      VIP ACTIVO
                    </span>
                  )}
                  {isTrial && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                      PERIODO DE PRUEBA
                    </span>
                  )}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-xs text-purple-400">Precio Mensual</span>
                <p className="text-lg font-black text-fuchsia-400">$9.99 USD</p>
              </div>
            </div>

            {/* Regla de Cobro: 2 Videos y 1 Día */}
            {isTrial && (
              <div className="space-y-3 pt-2 border-t border-purple-900/60">
                <div className="flex justify-between text-xs text-purple-300">
                  <span>Videos iniciales vistos:</span>
                  <span className="font-bold text-white">{videosWatched} de {maxVideos} permitidos</span>
                </div>
                {/* Barra de progreso de la cuota inicial */}
                <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                    style={{ width: `${Math.min(100, (videosWatched / maxVideos) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-purple-400 leading-relaxed">
                  <span className="font-semibold text-purple-300">Regla TECFLIX:</span> Puedes ver hasta {maxVideos} videos de cortesía durante tu primer día. Al alcanzar los {maxVideos} videos o completarse 1 día, se procesará el cobro automático de tu membresía con tu tarjeta registrada.
                </p>

                <button
                  onClick={handleActivatePlan}
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-neon-purple transition"
                >
                  Activar Membresía VIP Ahora ($9.99 USD)
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: TARJETAS REGISTRADAS (Crédito y Débito) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-purple-200">
              Tarjetas de Crédito y Débito Registradas
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ocultar Formulario' : 'Añadir Tarjeta'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-purple-400 italic py-2">
                No tienes métodos de pago registrados. Añade una tarjeta para activar tu cuenta.
              </p>
            ) : (
              paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="p-3.5 rounded-xl bg-[#090314] border border-purple-800/40 flex items-center justify-between hover:border-purple-600/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-300">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {pm.card_brand} •••• {pm.card_last4}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pm.type === 'credit'
                            ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                            : 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/40'
                        }`}>
                          {pm.type === 'credit' ? 'Crédito' : 'Débito'}
                        </span>
                        {pm.is_default && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-400">
                        {pm.cardholder_name} &bull; Expira: {pm.exp_month}/{pm.exp_year}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCard(pm.id)}
                    className="p-2 text-purple-400 hover:text-red-400 transition"
                    title="Eliminar tarjeta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECCIÓN 3: FORMULARIO PARA AGREGAR TARJETA DE CRÉDITO O DÉBITO */}
        {showAddForm && (
          <form onSubmit={handleAddCard} className="p-5 rounded-2xl bg-[#090314] border border-purple-800/60 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Registrar Nueva Tarjeta
            </h4>

            {/* Selector de Tipo: Crédito vs Débito */}
            <div className="grid grid-cols-2 gap-2 bg-[#120726] p-1 rounded-xl border border-purple-900">
              <button
                type="button"
                onClick={() => setCardType('credit')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  cardType === 'credit' ? 'bg-purple-600 text-white shadow-neon-purple' : 'text-purple-400 hover:text-white'
                }`}
              >
                Tarjeta de Crédito
              </button>
              <button
                type="button"
                onClick={() => setCardType('debit')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  cardType === 'debit' ? 'bg-purple-600 text-white shadow-neon-purple' : 'text-purple-400 hover:text-white'
                }`}
              >
                Tarjeta de Débito
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">Nombre del Titular</label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Como figura en el plástico"
                className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">Número de Tarjeta</label>
              <input
                type="text"
                required
                maxLength="19"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4000 1234 5678 9010"
                className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">Mes</label>
                <select
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">Año</label>
                <select
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {[2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">CVV</label>
                <input
                  type="password"
                  required
                  maxLength="4"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">Dirección de Facturación (Opcional)</label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Calle, Ciudad, Código Postal"
                className="w-full bg-[#120726] border border-purple-800/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-neon-purple transition"
            >
              {loading ? 'Guardando...' : `Guardar Tarjeta de ${cardType === 'credit' ? 'Crédito' : 'Débito'}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
