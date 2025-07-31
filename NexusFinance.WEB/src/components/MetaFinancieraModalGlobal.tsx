import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, DollarSign, Calendar, TrendingUp, Target, CreditCard, PiggyBank } from 'lucide-react';
import { gsap } from 'gsap';
import type { MetaFinanciera } from '../types/metaFinanciera';
import type { Cuenta } from '../types/cuenta';
import { metaFinancieraService, formatDateForInput } from '../services/metaFinancieraService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface MetaFormData {
  usuarioId: string;
  nombreMeta: string;
  descripcion: string;
  montoObjetivo: number;
  montoActual: number;
  fechaObjetivo: string;
  tipoMeta: string;
  cuentaId: string;
  estaCompletada?: boolean;
  fechaComplecion?: string;
}

interface MetaFinancieraModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMeta: MetaFinanciera | null;
}

const tiposMeta = [
  { value: 'ahorro', label: 'Ahorro', icon: PiggyBank, color: 'bg-green-100 text-green-600' },
  { value: 'pago_deuda', label: 'Pago de deuda', icon: TrendingUp, color: 'bg-red-100 text-red-600' },
  { value: 'inversion', label: 'Inversión', icon: Target, color: 'bg-blue-100 text-blue-600' }
];

const MetaFinancieraModalGlobal: React.FC<MetaFinancieraModalGlobalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingMeta 
}) => {
  const [form, setForm] = useState<MetaFormData>({
    usuarioId: '',
    nombreMeta: '',
    descripcion: '',
    montoObjetivo: 0,
    montoActual: 0,
    fechaObjetivo: '',
    tipoMeta: 'ahorro',
    cuentaId: '',
    estaCompletada: false,
    fechaComplecion: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Cargar cuentas del usuario
  const cargarCuentas = async () => {
    try {
      setLoadingCuentas(true);
      const usuarioId = authService.getUserId();
      if (usuarioId) {
        const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId, true);
        setCuentas(cuentasData);
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setCuentas([]);
    } finally {
      setLoadingCuentas(false);
    }
  };

  // Animaciones de entrada y salida
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen && overlayRef.current && contentRef.current) {
        // Animación de entrada
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(contentRef.current, { opacity: 0, scale: 0.9, y: 20 });

        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out"
        });

        gsap.to(contentRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          delay: 0.1,
          ease: "power2.out"
        });
      } else if (!isOpen && modalRef.current && overlayRef.current && contentRef.current) {
        // Animación de salida
        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.2,
          ease: "power2.in"
        });

        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          delay: 0.1,
          ease: "power2.in"
        });
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarCuentas();
      
      if (editingMeta) {
        setForm({
          usuarioId: editingMeta.usuarioId,
          nombreMeta: editingMeta.nombreMeta,
          descripcion: editingMeta.descripcion ?? '',
          montoObjetivo: editingMeta.montoObjetivo,
          montoActual: editingMeta.montoActual ?? 0,
          fechaObjetivo: editingMeta.fechaObjetivo ? formatDateForInput(editingMeta.fechaObjetivo) : '',
          tipoMeta: editingMeta.tipoMeta,
          cuentaId: editingMeta.cuentaId ?? '',
          estaCompletada: editingMeta.estaCompletada,
          fechaComplecion: editingMeta.fechaComplecion
        });
      } else {
        setForm({
          usuarioId: authService.getUserId() ?? '',
          nombreMeta: '',
          descripcion: '',
          montoObjetivo: 0,
          montoActual: 0,
          fechaObjetivo: '',
          tipoMeta: 'ahorro',
          cuentaId: '',
          estaCompletada: false,
          fechaComplecion: undefined
        });
      }
      setError('');
    }
  }, [isOpen, editingMeta]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (field: keyof MetaFormData, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreMeta.trim()) {
      setError('El nombre de la meta es obligatorio');
      return;
    }
    if (form.montoObjetivo <= 0) {
      setError('El monto objetivo debe ser mayor a 0');
      return;
    }
    if (!form.tipoMeta) {
      setError('El tipo de meta es obligatorio');
      return;
    }
    
    try {
      setLoading(true);
      if (editingMeta) {
        // Para actualizar, solo enviar los campos que se pueden modificar
        const updateData = {
          nombreMeta: form.nombreMeta,
          descripcion: form.descripcion,
          montoObjetivo: form.montoObjetivo,
          montoActual: form.montoActual,
          fechaObjetivo: form.fechaObjetivo,
          tipoMeta: form.tipoMeta,
          cuentaId: form.cuentaId || undefined,
          estaCompletada: form.estaCompletada,
          fechaComplecion: form.fechaComplecion
        };
        await metaFinancieraService.actualizarMeta(editingMeta.metaId, updateData);
      } else {
        await metaFinancieraService.crearMeta(form);
      }
      
      // Mostrar éxito
      await Swal.fire({
        title: '¡Éxito!',
        text: editingMeta ? 'Meta actualizada exitosamente' : 'Meta creada exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-xl'
        }
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(`Error al guardar la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const getTipoIcon = (tipo: string) => {
    const tipoInfo = tiposMeta.find(t => t.value === tipo);
    return tipoInfo ? tipoInfo.icon : Target;
  };

  const calcularProgreso = (): number => {
    if (form.montoObjetivo === 0) return 0;
    return Math.min((form.montoActual / form.montoObjetivo) * 100, 100);
  };

  const getColorProgreso = (progreso: number): string => {
    if (progreso >= 90) return 'bg-green-500';
    if (progreso >= 75) return 'bg-blue-500';
    if (progreso >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  if (!isOpen) return null;

  // Renderizar usando portal para que aparezca fuera del Layout
  return createPortal(
    <div
      ref={modalRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingMeta ? 'Editar Meta' : 'Nueva Meta Financiera'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {editingMeta ? 'Modifica los datos de tu meta financiera' : 'Crea una nueva meta para alcanzar tus objetivos'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la Meta */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Meta *
                </label>
                <input
                  type="text"
                  value={form.nombreMeta}
                  onChange={(e) => handleChange('nombreMeta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Ej: Viaje a Europa"
                  required
                />
              </div>

              {/* Tipo de Meta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Meta *
                </label>
                <select
                  value={form.tipoMeta}
                  onChange={(e) => handleChange('tipoMeta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  required
                >
                  {tiposMeta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cuenta Asociada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta Asociada
                </label>
                <select
                  value={form.cuentaId}
                  onChange={(e) => handleChange('cuentaId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                >
                  <option value="">Sin cuenta específica</option>
                  {cuentas.map(cuenta => (
                    <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                      {cuenta.nombreCuenta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Objetivo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montoObjetivo}
                    onChange={(e) => handleChange('montoObjetivo', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Monto Actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Actual
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montoActual}
                    onChange={(e) => handleChange('montoActual', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Fecha Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Objetivo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={form.fechaObjetivo}
                    onChange={(e) => handleChange('fechaObjetivo', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Descripción de tu meta financiera..."
                />
              </div>
            </div>

            {/* Progreso de la Meta */}
            {form.montoObjetivo > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Progreso de la Meta</h4>
                  <span className="text-sm font-semibold text-gray-900">
                    {calcularProgreso().toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getColorProgreso(calcularProgreso())}`}
                    style={{ width: `${calcularProgreso()}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(form.montoActual)}</span>
                  <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(form.montoObjetivo)}</span>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !form.nombreMeta.trim() || form.montoObjetivo <= 0}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingMeta ? 'Actualizar' : 'Crear'} Meta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MetaFinancieraModalGlobal; 