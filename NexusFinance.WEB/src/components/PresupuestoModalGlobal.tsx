import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, DollarSign, Calendar } from 'lucide-react';
import { gsap } from 'gsap';
import type { Presupuesto, CrearPresupuestoDTO, ActualizarPresupuestoDTO } from '../types/presupuesto';
import { presupuestoService } from '../services/presupuestoService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface PresupuestoFormData {
  nombrePresupuesto: string;
  periodoPresupuesto: string;
  presupuestoTotal: number;
  fechaInicio: string;
  fechaFin: string;
}

interface PresupuestoModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPresupuesto: Presupuesto | null;
}

const PresupuestoModalGlobal: React.FC<PresupuestoModalGlobalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPresupuesto 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<PresupuestoFormData>({
    nombrePresupuesto: '',
    periodoPresupuesto: 'Mensual',
    presupuestoTotal: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: ''
  });

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Obtener períodos disponibles del servicio
  const periodosPresupuesto = presupuestoService.getPeriodosPresupuesto();

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
      if (editingPresupuesto) {
        setFormData({
          nombrePresupuesto: editingPresupuesto.nombrePresupuesto,
          periodoPresupuesto: editingPresupuesto.periodoPresupuesto,
          presupuestoTotal: editingPresupuesto.presupuestoTotal,
          fechaInicio: editingPresupuesto.fechaInicio.split('T')[0],
          fechaFin: editingPresupuesto.fechaFin ? editingPresupuesto.fechaFin.split('T')[0] : ''
        });
      } else {
        setFormData({
          nombrePresupuesto: '',
          periodoPresupuesto: 'Mensual',
          presupuestoTotal: 0,
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: ''
        });
      }
      setError('');
    }
  }, [isOpen, editingPresupuesto]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFormChange = (field: keyof PresupuestoFormData, value: string | number) => {
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

      if (editingPresupuesto) {
        // Actualizar presupuesto existente
        const updateData: ActualizarPresupuestoDTO = {
          presupuestoId: editingPresupuesto.presupuestoId,
          nombrePresupuesto: formData.nombrePresupuesto,
          periodoPresupuesto: formData.periodoPresupuesto,
          presupuestoTotal: formData.presupuestoTotal,
          fechaInicio: new Date(formData.fechaInicio),
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : undefined
        };
        await presupuestoService.actualizarPresupuesto(editingPresupuesto.presupuestoId, updateData);
      } else {
        // Crear nuevo presupuesto
        const newPresupuesto: CrearPresupuestoDTO = {
          usuarioId,
          nombrePresupuesto: formData.nombrePresupuesto,
          periodoPresupuesto: formData.periodoPresupuesto,
          presupuestoTotal: formData.presupuestoTotal,
          fechaInicio: new Date(formData.fechaInicio),
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : undefined
        };
        await presupuestoService.crearPresupuesto(newPresupuesto);
      }

      // Mostrar éxito
      await Swal.fire({
        title: '¡Guardado!',
        text: `Presupuesto ${editingPresupuesto ? 'actualizado' : 'creado'} exitosamente`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        zIndex: 999999,
        customClass: {
          popup: 'rounded-xl'
        }
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
      setError(`Error al ${editingPresupuesto ? 'actualizar' : 'crear'} el presupuesto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingPresupuesto ? 'Modifica los datos de tu presupuesto' : 'Crea un nuevo presupuesto para controlar tus gastos'}
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
              {/* Nombre del Presupuesto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Presupuesto *
                </label>
                <input
                  type="text"
                  value={formData.nombrePresupuesto}
                  onChange={(e) => handleFormChange('nombrePresupuesto', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Ej: Presupuesto Mensual Enero 2024"
                  required
                />
              </div>

              {/* Período del Presupuesto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período *
                </label>
                <select
                  value={formData.periodoPresupuesto}
                  onChange={(e) => handleFormChange('periodoPresupuesto', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  required
                >
                  {periodosPresupuesto.map(periodo => (
                    <option key={periodo} value={periodo}>
                      {presupuestoService.formatearPeriodo(periodo)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Presupuesto Total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto Total *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.presupuestoTotal}
                    onChange={(e) => handleFormChange('presupuestoTotal', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => handleFormChange('fechaInicio', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Fecha de Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin {formData.periodoPresupuesto === 'Personalizado' ? '*' : ''}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => handleFormChange('fechaFin', e.target.value)}
                    disabled={formData.periodoPresupuesto !== 'Personalizado'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  />
                </div>
                {formData.periodoPresupuesto !== 'Personalizado' && formData.fechaFin && (
                  <p className="text-xs text-gray-500 mt-1">
                    Calculado automáticamente para período {presupuestoService.formatearPeriodo(formData.periodoPresupuesto)}
                  </p>
                )}
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
                disabled={loading || !formData.nombrePresupuesto.trim() || formData.presupuestoTotal <= 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingPresupuesto ? 'Actualizar' : 'Crear'} Presupuesto</span>
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

export default PresupuestoModalGlobal; 