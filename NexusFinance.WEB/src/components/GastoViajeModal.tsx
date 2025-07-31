import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, DollarSign, Loader2, CalendarDays, MapPin, Users, Tag, Activity, FileText, Globe } from 'lucide-react';
import { gsap } from 'gsap';
import { gastosViajeService } from '../services/gastosViajeService';
import { categoriasGastosViajeService } from '../services/categoriasGastosViajeService';
import { actividadesViajeService } from '../services/actividadesViajeService';
import { authService } from '../services/authService';
import type { GastoViaje } from '../types/gastoViaje';
import type { CategoriaGastoViaje } from '../types/categoriaGastoViaje';
import type { ActividadViaje } from '../types/actividadViaje';
import Swal from 'sweetalert2';

interface GastoViajeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGasto?: GastoViaje | null;
  planId: string; // El planId es requerido para los gastos
}

interface FormData {
  planId: string;
  categoriaViajeId: string;
  monto: number;
  monedaGasto: string;
  descripcion: string;
  fechaGasto: string; // ISO date string
  ubicacion?: string;
  numeroPersonas?: number;
  actividadId?: string;
  transaccionId?: string;
  tasaCambioUsada?: number;
  urlRecibo?: string;
  notas?: string;
}

export default function GastoViajeModal({
  isOpen,
  onClose,
  onSuccess,
  editingGasto,
  planId,
}: GastoViajeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriasViaje, setCategoriasViaje] = useState<CategoriaGastoViaje[]>([]);
  const [actividadesViaje, setActividadesViaje] = useState<ActividadViaje[]>([]);

  const [formData, setFormData] = useState<FormData>({
    planId: planId,
    categoriaViajeId: '',
    monto: 0,
    monedaGasto: 'COP',
    descripcion: '',
    fechaGasto: new Date().toISOString().split('T')[0],
    numeroPersonas: 1,
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

  // Cargar datos iniciales y de edición
  useEffect(() => {
    if (isOpen) {
      setError(null);
      const currentUser = authService.getUser();
      if (!currentUser) {
        setError('Usuario no autenticado.');
        return;
      }

      const fetchDependencies = async () => {
        try {
          const categorias = await categoriasGastosViajeService.obtenerTodasCategorias(true, false, false, "NombreCategoria");
          setCategoriasViaje(categorias);

          // Solo cargar actividades si el planId no es temporal
          if (planId !== '123e4567-e89b-12d3-a456-426614174000') {
            const actividades = await actividadesViajeService.obtenerActividadesPorPlan(planId);
            setActividadesViaje(actividades);
          } else {
            setActividadesViaje([]);
          }
        } catch (err) {
          console.error('Error al cargar dependencias del gasto de viaje:', err);
          setError('Error al cargar categorías o actividades.');
        }
      };
      fetchDependencies();

      if (editingGasto) {
        setFormData({
          planId: editingGasto.planId,
          categoriaViajeId: editingGasto.categoriaViajeId,
          monto: editingGasto.monto,
          monedaGasto: editingGasto.monedaGasto,
          descripcion: editingGasto.descripcion,
          fechaGasto: editingGasto.fechaGasto.split('T')[0],
          ubicacion: editingGasto.ubicacion || '',
          numeroPersonas: editingGasto.numeroPersonas || 1,
          actividadId: editingGasto.actividadId || '',
          transaccionId: editingGasto.transaccionId || '',
          tasaCambioUsada: editingGasto.tasaCambioUsada || 0,
          urlRecibo: editingGasto.urlRecibo || '',
          notas: editingGasto.notas || '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingGasto, planId]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const resetForm = () => {
    setFormData({
      planId: planId,
      categoriaViajeId: '',
      monto: 0,
      monedaGasto: 'COP',
      descripcion: '',
      fechaGasto: new Date().toISOString().split('T')[0],
      ubicacion: '',
      numeroPersonas: 1,
      actividadId: '',
      transaccionId: '',
      tasaCambioUsada: 0,
      urlRecibo: '',
      notas: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoriaViajeId || !formData.monto || !formData.monedaGasto || !formData.descripcion || !formData.fechaGasto) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        ...formData,
        fechaGasto: formData.fechaGasto + 'T00:00:00', // Asegurar formato ISO con hora
        // Convertir a null si están vacíos para evitar errores de tipo
        ubicacion: formData.ubicacion || null,
        actividadId: formData.actividadId || null,
        transaccionId: formData.transaccionId || null,
        tasaCambioUsada: formData.tasaCambioUsada || null,
        urlRecibo: formData.urlRecibo || null,
        notas: formData.notas || null,
      };

      if (editingGasto) {
        await gastosViajeService.actualizarGasto({ ...dataToSend, gastoViajeId: editingGasto.gastoViajeId });
      } else {
        await gastosViajeService.crearGasto(dataToSend);
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: `Gasto ${editingGasto ? 'actualizado' : 'registrado'} exitosamente`,
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
      setError(`Error al ${editingGasto ? 'actualizar' : 'registrar'} el gasto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingGasto ? 'Editar Gasto de Viaje' : 'Registrar Nuevo Gasto de Viaje'}
                </h2>
                <p className="text-red-100 text-sm">
                  {editingGasto ? 'Modifica los detalles de tu gasto' : 'Registra un nuevo gasto incurrido durante tu viaje'}
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
        <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección 1: Información Básica */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Descripción */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Descripción del Gasto *
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="Ej: Almuerzo en restaurante local, Entrada museo, Taxi al hotel"
                    required
                  />
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      name="monto"
                      value={formData.monto}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-red-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Moneda *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="monedaGasto"
                      value={formData.monedaGasto}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-red-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400 uppercase"
                      placeholder="COP, USD, EUR"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Clasificación */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-600" />
                Clasificación
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categoría de Gasto *
                  </label>
                  <select
                    name="categoriaViajeId"
                    value={formData.categoriaViajeId}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categoriasViaje.map(cat => (
                      <option key={cat.categoriaViajeId} value={cat.categoriaViajeId}>
                        {cat.nombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actividad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Actividad Asociada
                  </label>
                  <select
                    name="actividadId"
                    value={formData.actividadId || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                  >
                    <option value="">Ninguna actividad específica</option>
                    {actividadesViaje.map(act => (
                      <option key={act.actividadId} value={act.actividadId}>
                        {act.nombreActividad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 3: Detalles */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-red-600" />
                Detalles del Gasto
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    name="fechaGasto"
                    value={formData.fechaGasto}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
                    required
                  />
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ubicación
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion || ''}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-red-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400"
                      placeholder="Restaurante, hotel, ciudad"
                    />
                  </div>
                </div>

                {/* Número de Personas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Personas
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="numeroPersonas"
                      value={formData.numeroPersonas || 1}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-red-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Información Adicional */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Información Adicional
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasa de Cambio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tasa de Cambio Usada
                  </label>
                  <input
                    type="number"
                    name="tasaCambioUsada"
                    value={formData.tasaCambioUsada || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    step="0.0001"
                    min="0"
                    placeholder="Ej: 4200.50"
                  />
                </div>

                {/* URL Recibo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    URL del Recibo
                  </label>
                  <input
                    type="url"
                    name="urlRecibo"
                    value={formData.urlRecibo || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="https://ejemplo.com/recibo.jpg"
                  />
                </div>

                {/* Notas */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    value={formData.notas || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-red-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400 resize-none"
                    placeholder="Información adicional sobre el gasto"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-8 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.descripcion.trim() || !formData.monto || !formData.monedaGasto.trim() || !formData.fechaGasto || !formData.categoriaViajeId}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-lg disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingGasto ? 'Actualizar' : 'Registrar'} Gasto</span>
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