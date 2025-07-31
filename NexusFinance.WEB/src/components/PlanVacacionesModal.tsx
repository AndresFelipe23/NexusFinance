import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plane, Loader2, CalendarDays, Users, DollarSign, Globe, TrendingUp } from 'lucide-react';
import { gsap } from 'gsap';
import { planesVacacionesService } from '../services/planesVacacionesService';
import { authService } from '../services/authService';
import type { PlanVacaciones } from '../types/planVacaciones';
import Swal from 'sweetalert2';

interface PlanVacacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPlan?: PlanVacaciones | null;
}

interface FormData {
  usuarioId: string;
  nombrePlan: string;
  descripcion?: string;
  destino: string;
  pais: string;
  ciudad?: string;
  fechaInicio: string; // ISO date string
  fechaFin: string; // ISO date string
  cantidadPersonas?: number;
  presupuestoEstimado?: number;
  monedaDestino?: string;
  tasaCambio?: number;
  esViajeInternacional?: boolean;
  metaFinancieraId?: string;
  estadoPlan?: string; // Solo para actualizar
}

export default function PlanVacacionesModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingPlan 
}: PlanVacacionesModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metasFinancieras, setMetasFinancieras] = useState<any[]>([]); // Placeholder para metas

  const [formData, setFormData] = useState<FormData>({
    usuarioId: authService.getUserId() || '',
    nombrePlan: '',
    destino: '',
    pais: '',
    fechaInicio: '',
    fechaFin: '',
  });

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Animaciones de entrada y salida
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen && overlayRef.current && contentRef.current) {
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
      const currentUser = authService.getUser();
      if (!currentUser) {
        setError('Usuario no autenticado.');
        return;
      }

      // Placeholder para cargar metas financieras
      // En una aplicación real, llamarías a un servicio aquí
      setMetasFinancieras([
        { metaId: '1', nombreMeta: 'Ahorro para Viaje' },
        { metaId: '2', nombreMeta: 'Fondo de Emergencia' },
      ]);

      if (editingPlan) {
        setFormData({
          usuarioId: editingPlan.usuarioId,
          nombrePlan: editingPlan.nombrePlan,
          descripcion: editingPlan.descripcion || '',
          destino: editingPlan.destino,
          pais: editingPlan.pais,
          ciudad: editingPlan.ciudad || '',
          fechaInicio: editingPlan.fechaInicio.split('T')[0], // Formato YYYY-MM-DD
          fechaFin: editingPlan.fechaFin.split('T')[0], // Formato YYYY-MM-DD
          cantidadPersonas: editingPlan.cantidadPersonas || 1,
          presupuestoEstimado: editingPlan.presupuestoEstimado || 0,
          monedaDestino: editingPlan.monedaDestino || '',
          tasaCambio: editingPlan.tasaCambio || 0,
          esViajeInternacional: editingPlan.esViajeInternacional || false,
          metaFinancieraId: editingPlan.metaFinancieraId || '',
          estadoPlan: editingPlan.estadoPlan || 'planificando',
        });
      } else {
        resetForm();
        setFormData(prev => ({ ...prev, usuarioId: currentUser.usuarioId }));
      }
      setError(null);
    }
  }, [isOpen, editingPlan]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const resetForm = () => {
    setFormData({
      usuarioId: '',
      nombrePlan: '',
      descripcion: '',
      destino: '',
      pais: '',
      ciudad: '',
      fechaInicio: '',
      fechaFin: '',
      cantidadPersonas: 1,
      presupuestoEstimado: 0,
      monedaDestino: '',
      tasaCambio: 0,
      esViajeInternacional: false,
      metaFinancieraId: '',
      estadoPlan: 'planificando',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombrePlan.trim() || !formData.destino.trim() || !formData.pais.trim() || !formData.fechaInicio || !formData.fechaFin) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (new Date(formData.fechaFin) <= new Date(formData.fechaInicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        ...formData,
        fechaInicio: formData.fechaInicio + 'T00:00:00', // Asegurar formato ISO con hora
        fechaFin: formData.fechaFin + 'T00:00:00', // Asegurar formato ISO con hora
        // Convertir a null si están vacíos para evitar errores de tipo
        descripcion: formData.descripcion || null,
        ciudad: formData.ciudad || null,
        monedaDestino: formData.monedaDestino || null,
        metaFinancieraId: formData.metaFinancieraId || null,
      };

      if (editingPlan) {
        await planesVacacionesService.actualizarPlan({ ...dataToSend, planId: editingPlan.planId });
      } else {
        await planesVacacionesService.crearPlan(dataToSend);
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: `Plan ${editingPlan ? 'actualizado' : 'creado'} exitosamente`,
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
      setError(`Error al ${editingPlan ? 'actualizar' : 'crear'} el plan: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingPlan ? 'Editar Plan de Vacaciones' : 'Nuevo Plan de Vacaciones'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {editingPlan ? 'Modifica los detalles de tu plan de viaje' : 'Crea un nuevo plan para organizar tu próxima aventura'}
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

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre del Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Plan *</label>
              <input
                type="text"
                name="nombrePlan"
                value={formData.nombrePlan}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destino *</label>
              <input
                type="text"
                name="destino"
                value={formData.destino}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">País *</label>
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio *</label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin *</label>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Cantidad Personas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Personas</label>
              <input
                type="number"
                name="cantidadPersonas"
                value={formData.cantidadPersonas || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                min="1"
              />
            </div>

            {/* Presupuesto Estimado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto Estimado</label>
              <input
                type="number"
                name="presupuestoEstimado"
                value={formData.presupuestoEstimado || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                step="0.01"
                min="0"
              />
            </div>

            {/* Moneda Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Moneda de Destino</label>
              <input
                type="text"
                name="monedaDestino"
                value={formData.monedaDestino || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: USD, EUR, COP"
              />
            </div>

            {/* Tasa de Cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tasa de Cambio</label>
              <input
                type="number"
                name="tasaCambio"
                value={formData.tasaCambio || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                step="0.0001"
                min="0"
              />
            </div>

            {/* Es Viaje Internacional */}
            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                name="esViajeInternacional"
                checked={formData.esViajeInternacional || false}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm font-medium text-gray-700">Es Viaje Internacional</label>
            </div>

            {/* Meta Financiera Asociada */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Financiera Asociada (Opcional)</label>
              <select
                name="metaFinancieraId"
                value={formData.metaFinancieraId || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Ninguna</option>
                {metasFinancieras.map(meta => (
                  <option key={meta.metaId} value={meta.metaId}>{meta.nombreMeta}</option>
                ))}
              </select>
            </div>

            {/* Estado del Plan (solo para edición) */}
            {editingPlan && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Plan</label>
                <select
                  name="estadoPlan"
                  value={formData.estadoPlan || 'planificando'}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="planificando">Planificando</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_curso">En Curso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            )}

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              ></textarea>
            </div>

            {/* Botones */}
            <div className="md:col-span-2 flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                disabled={loading || !formData.nombrePlan.trim() || !formData.destino.trim() || !formData.pais.trim() || !formData.fechaInicio || !formData.fechaFin}
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
                    <span>{editingPlan ? 'Actualizar' : 'Crear'} Plan</span>
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
}