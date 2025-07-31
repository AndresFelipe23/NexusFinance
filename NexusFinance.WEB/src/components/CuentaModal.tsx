import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import type { Cuenta, CrearCuentaDTO, ActualizarCuentaDTO, CuentaFormData } from '../types/cuenta';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface CuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCuenta?: Cuenta | null;
}

const CuentaModal: React.FC<CuentaModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingCuenta 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<CuentaFormData>({
    nombreCuenta: '',
    tipoCuenta: 'Cuenta de Ahorros',
    saldo: 0,
    moneda: 'COP',
    nombreBanco: '',
    numeroCuenta: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const tiposCuenta = cuentaService.getTiposCuenta();
  const monedas = cuentaService.getMonedas();

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
          saldo: editingCuenta.saldo || 0,
          moneda: editingCuenta.moneda || 'COP',
          nombreBanco: editingCuenta.nombreBanco || '',
          numeroCuenta: editingCuenta.numeroCuenta || ''
        });
      } else {
        setFormData({
          nombreCuenta: '',
          tipoCuenta: 'Cuenta de Ahorros',
          saldo: 0,
          moneda: 'COP',
          nombreBanco: '',
          numeroCuenta: ''
        });
      }
      setError('');
      setHasChanges(false);
    }
  }, [isOpen, editingCuenta]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Detectar cambios en el formulario
  const handleFormChange = (field: keyof CuentaFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
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
          moneda: formData.moneda,
          nombreBanco: formData.nombreBanco,
          numeroCuenta: formData.numeroCuenta
        };
        await cuentaService.actualizarCuenta(editingCuenta.cuentaId, updateData);
      } else {
        // Crear nueva cuenta
        const newCuenta: CrearCuentaDTO = {
          usuarioId,
          nombreCuenta: formData.nombreCuenta,
          tipoCuenta: formData.tipoCuenta,
          saldo: formData.saldo,
          moneda: formData.moneda,
          nombreBanco: formData.nombreBanco,
          numeroCuenta: formData.numeroCuenta
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

  const handleClose = async () => {
    if (loading) return; // No permitir cerrar mientras está cargando
    
    if (hasChanges) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6b7280',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl'
        }
      });

      if (result.isConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
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

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {editingCuenta ? 'Modifica los datos de tu cuenta' : 'Agrega una nueva cuenta a tu portafolio'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                      rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <div className="w-1 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta *
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={formData.nombreCuenta}
                  onChange={(e) => handleFormChange('nombreCuenta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Ej: Cuenta Principal"
                />
              </div>

              {/* Tipo de Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta *
                </label>
                <select
                  required
                  disabled={loading}
                  value={formData.tipoCuenta}
                  onChange={(e) => handleFormChange('tipoCuenta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                >
                  {tiposCuenta.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {/* Saldo Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={loading}
                  value={formData.saldo}
                  onChange={(e) => handleFormChange('saldo', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="0.00"
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  disabled={loading}
                  value={formData.moneda}
                  onChange={(e) => handleFormChange('moneda', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                >
                  {monedas.map(moneda => (
                    <option key={moneda} value={moneda}>{moneda}</option>
                  ))}
                </select>
              </div>

              {/* Nombre del Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Banco
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={formData.nombreBanco}
                  onChange={(e) => handleFormChange('nombreBanco', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Ej: Banco de Bogotá"
                />
              </div>

              {/* Número de Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={formData.numeroCuenta}
                  onChange={(e) => handleFormChange('numeroCuenta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="****-****-****-1234"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 
                          rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white 
                          rounded-lg transition-colors duration-200 disabled:opacity-50 
                          flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{editingCuenta ? 'Actualizar' : 'Crear'} Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CuentaModal;