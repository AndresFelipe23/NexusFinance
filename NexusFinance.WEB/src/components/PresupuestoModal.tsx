import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Loader2, Calendar, DollarSign } from 'lucide-react';
import { gsap } from 'gsap';
import type { Presupuesto, CrearPresupuestoDTO, ActualizarPresupuestoDTO, PresupuestoFormData } from '../types/presupuesto';
import { presupuestoService } from '../services/presupuestoService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface PresupuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPresupuesto: Presupuesto | null;
}

const PresupuestoModal: React.FC<PresupuestoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPresupuesto 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<PresupuestoFormData>({
    nombrePresupuesto: '',
    periodoPresupuesto: 'Mensual',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    presupuestoTotal: 0
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const periodosPresupuesto = presupuestoService.getPeriodosPresupuesto();

  // Animaciones de entrada y salida
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen) {
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
      } else if (modalRef.current) {
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
          fechaInicio: editingPresupuesto.fechaInicio,
          fechaFin: editingPresupuesto.fechaFin || '',
          presupuestoTotal: editingPresupuesto.presupuestoTotal
        });
      } else {
        setFormData({
          nombrePresupuesto: '',
          periodoPresupuesto: 'Mensual',
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: '',
          presupuestoTotal: 0
        });
      }
      setError('');
      setHasChanges(false);
    }
  }, [isOpen, editingPresupuesto]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (editingPresupuesto) {
      const hasFormChanges = 
        formData.nombrePresupuesto !== editingPresupuesto.nombrePresupuesto ||
        formData.periodoPresupuesto !== editingPresupuesto.periodoPresupuesto ||
        formData.fechaInicio !== editingPresupuesto.fechaInicio ||
        formData.fechaFin !== (editingPresupuesto.fechaFin || '') ||
        formData.presupuestoTotal !== editingPresupuesto.presupuestoTotal;
      
      setHasChanges(hasFormChanges);
    } else {
      const hasFormChanges = 
        formData.nombrePresupuesto !== '' ||
        formData.periodoPresupuesto !== 'Mensual' ||
        formData.fechaInicio !== new Date().toISOString().split('T')[0] ||
        formData.fechaFin !== '' ||
        formData.presupuestoTotal !== 0;
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, editingPresupuesto]);

  const handleFormChange = (field: keyof PresupuestoFormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcular fecha fin automáticamente si es un período predefinido
      if (field === 'periodoPresupuesto' && typeof value === 'string') {
        if (value !== 'Personalizado') {
          newData.fechaFin = presupuestoService.calcularFechaFin(newData.fechaInicio, value);
        } else {
          newData.fechaFin = '';
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombrePresupuesto.trim()) {
      setError('El nombre del presupuesto es obligatorio');
      return;
    }

    if (formData.presupuestoTotal <= 0) {
      setError('El presupuesto total debe ser mayor a 0');
      return;
    }

    if (formData.periodoPresupuesto === 'Personalizado' && !formData.fechaFin) {
      setError('La fecha de fin es obligatoria para presupuestos personalizados');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      if (editingPresupuesto) {
        // Actualizar presupuesto existente
        const dto: ActualizarPresupuestoDTO = {
          presupuestoId: editingPresupuesto.presupuestoId,
          nombrePresupuesto: formData.nombrePresupuesto,
          periodoPresupuesto: formData.periodoPresupuesto,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin || undefined,
          presupuestoTotal: formData.presupuestoTotal
        };

        await presupuestoService.actualizarPresupuesto(editingPresupuesto.presupuestoId, dto);
      } else {
        // Crear nuevo presupuesto
        const dto: CrearPresupuestoDTO = {
          usuarioId,
          nombrePresupuesto: formData.nombrePresupuesto,
          periodoPresupuesto: formData.periodoPresupuesto,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin || undefined,
          presupuestoTotal: formData.presupuestoTotal
        };

        await presupuestoService.crearPresupuesto(dto);
      }

      // Mostrar éxito
      await Swal.fire({
        title: '¡Éxito!',
        text: editingPresupuesto ? 'Presupuesto actualizado exitosamente' : 'Presupuesto creado exitosamente',
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
      setError(`Error al guardar el presupuesto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6b7280',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando',
        reverseButtons: true,
        zIndex: 999999,
        customClass: {
          popup: 'rounded-xl'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          onClose();
        }
      });
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
              {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {editingPresupuesto ? 'Modifica los datos de tu presupuesto' : 'Crea un nuevo presupuesto para controlar tus gastos'}
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
                    <span>{editingPresupuesto ? 'Actualizar' : 'Crear'} Presupuesto</span>
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

export default PresupuestoModal; 