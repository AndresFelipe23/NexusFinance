import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react';
import { gsap } from 'gsap';
import type { Cuenta, CrearCuentaDTO, ActualizarCuentaDTO } from '../types/cuenta';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface CuentaFormData {
  nombreCuenta: string;
  tipoCuenta: string;
  saldoInicial: number;
  descripcion: string;
  color: string;
}

interface CuentaModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCuenta: Cuenta | null;
}

const CuentaModalGlobal: React.FC<CuentaModalGlobalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingCuenta 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CuentaFormData>({
    nombreCuenta: '',
    tipoCuenta: 'Ahorros',
    saldoInicial: 0,
    descripcion: '',
    color: '#3B82F6'
  });

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const tiposCuenta = [
    { value: 'Ahorros', label: 'Cuenta de Ahorros', icon: PiggyBank, color: 'bg-green-100 text-green-600' },
    { value: 'Corriente', label: 'Cuenta Corriente', icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
    { value: 'Efectivo', label: 'Efectivo', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
    { value: 'Inversión', label: 'Cuenta de Inversión', icon: Wallet, color: 'bg-purple-100 text-purple-600' }
  ];

  const coloresDisponibles = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

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
      if (editingCuenta) {
        setFormData({
          nombreCuenta: editingCuenta.nombreCuenta,
          tipoCuenta: editingCuenta.tipoCuenta,
          saldoInicial: editingCuenta.saldoInicial,
          descripcion: editingCuenta.descripcion || '',
          color: editingCuenta.color || '#3B82F6'
        });
      } else {
        setFormData({
          nombreCuenta: '',
          tipoCuenta: 'Ahorros',
          saldoInicial: 0,
          descripcion: '',
          color: '#3B82F6'
        });
      }
      setError('');
    }
  }, [isOpen, editingCuenta]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFormChange = (field: keyof CuentaFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      if (editingCuenta) {
        // Actualizar cuenta existente
        const updateData: ActualizarCuentaDTO = {
          cuentaId: editingCuenta.cuentaId,
          nombreCuenta: formData.nombreCuenta,
          tipoCuenta: formData.tipoCuenta,
          saldoInicial: formData.saldoInicial,
          descripcion: formData.descripcion,
          color: formData.color
        };
        await cuentaService.actualizarCuenta(editingCuenta.cuentaId, updateData);
      } else {
        // Crear nueva cuenta
        const newCuenta: CrearCuentaDTO = {
          usuarioId,
          nombreCuenta: formData.nombreCuenta,
          tipoCuenta: formData.tipoCuenta,
          saldoInicial: formData.saldoInicial,
          descripcion: formData.descripcion,
          color: formData.color
        };
        await cuentaService.crearCuenta(newCuenta);
      }

      // Mostrar éxito
      await Swal.fire({
        title: '¡Guardado!',
        text: `Cuenta ${editingCuenta ? 'actualizada' : 'creada'} exitosamente`,
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
      console.error('Error al guardar cuenta:', err);
      setError(`Error al ${editingCuenta ? 'actualizar' : 'crear'} la cuenta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
    const tipoInfo = tiposCuenta.find(t => t.value === tipo);
    return tipoInfo ? tipoInfo.icon : CreditCard;
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
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h2>
                <p className="text-green-100 text-sm">
                  {editingCuenta ? 'Modifica los datos de tu cuenta' : 'Crea una nueva cuenta para gestionar tus finanzas'}
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
              {/* Nombre de la Cuenta */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta *
                </label>
                <input
                  type="text"
                  value={formData.nombreCuenta}
                  onChange={(e) => handleFormChange('nombreCuenta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-green-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Ej: Cuenta de Ahorros Principal"
                  required
                />
              </div>

              {/* Tipo de Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta *
                </label>
                <select
                  value={formData.tipoCuenta}
                  onChange={(e) => handleFormChange('tipoCuenta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-green-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  required
                >
                  {tiposCuenta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Saldo Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.saldoInicial}
                    onChange={(e) => handleFormChange('saldoInicial', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-green-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-green-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Descripción opcional de la cuenta..."
                />
              </div>

              {/* Color */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de la Cuenta
                </label>
                <div className="flex flex-wrap gap-3">
                  {coloresDisponibles.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleFormChange('color', color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        formData.color === color 
                          ? 'border-gray-800 scale-110 shadow-lg' 
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vista Previa */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa</h4>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formData.color }}
                >
                  {React.createElement(getTipoIcon(formData.tipoCuenta), { 
                    className: "w-6 h-6 text-white" 
                  })}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">
                    {formData.nombreCuenta || 'Nombre de la cuenta'}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {tiposCuenta.find(t => t.value === formData.tipoCuenta)?.label || 'Tipo de cuenta'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(formData.saldoInicial)}
                  </p>
                </div>
              </div>
            </div>

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
                disabled={loading || !formData.nombreCuenta.trim()}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingCuenta ? 'Actualizar' : 'Crear'} Cuenta</span>
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

export default CuentaModalGlobal; 