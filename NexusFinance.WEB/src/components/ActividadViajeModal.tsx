import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar, Loader2, CalendarDays, MapPin, DollarSign, Flag, Activity, FileText, Link, Star } from 'lucide-react';
import { gsap } from 'gsap';
import { actividadesViajeService } from '../services/actividadesViajeService';
import { categoriasGastosViajeService } from '../services/categoriasGastosViajeService';
import { authService } from '../services/authService';
import type { ActividadViaje } from '../types/actividadViaje';
import type { CategoriaGastoViaje } from '../types/categoriaGastoViaje';
import Swal from 'sweetalert2';

interface ActividadViajeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingActividad?: ActividadViaje | null;
  planId: string;
}

interface FormData {
  planId: string;
  nombreActividad: string;
  descripcion?: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  costoEstimado: number;
  costoReal?: number;
  ubicacion?: string;
  categoriaViajeId?: string;
  prioridad: string;
  estadoActividad?: string;
  urlReferencia?: string;
}

const prioridadOptions = [
  { value: 'alta', label: 'Alta', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
  { value: 'media', label: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' },
  { value: 'baja', label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' }
];

const estadoOptions = [
  { value: 'planificada', label: 'Planificada', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
  { value: 'en_curso', label: 'En Curso', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' },
  { value: 'completada', label: 'Completada', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
  { value: 'cancelada', label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' }
];

export default function ActividadViajeModal({
  isOpen,
  onClose,
  onSuccess,
  editingActividad,
  planId,
}: ActividadViajeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CategoriaGastoViaje[]>([]);
  const [planInfo, setPlanInfo] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    planId: planId,
    nombreActividad: '',
    descripcion: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
    costoEstimado: 0,
    costoReal: 0,
    ubicacion: '',
    categoriaViajeId: '',
    prioridad: 'media',
    estadoActividad: 'planificada',
    urlReferencia: '',
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

      // Cargar información del plan seleccionado
      const planSeleccionado = localStorage.getItem('selected_plan');
      console.log('Plan seleccionado en modal (raw):', planSeleccionado);
      
      if (planSeleccionado) {
        try {
          const planData = JSON.parse(planSeleccionado);
          console.log('Plan cargado en modal:', planData);
          console.log('Plan fechaInicio:', planData.fechaInicio);
          console.log('Plan fechaFin:', planData.fechaFin);
          setPlanInfo(planData);
        } catch (err) {
          console.error('Error al parsear plan seleccionado:', err);
        }
      } else {
        console.log('No se encontró plan en localStorage');
      }

      const fetchDependencies = async () => {
        try {
          // Intentar cargar categorías siempre
          let categoriasData = await categoriasGastosViajeService.obtenerCategorias();
          
          // Si no hay categorías, intentar inicializarlas
          if (!categoriasData || categoriasData.length === 0) {
            console.log('No hay categorías, intentando inicializar...');
            try {
              await categoriasGastosViajeService.inicializarCategorias();
              categoriasData = await categoriasGastosViajeService.obtenerTodasCategorias(true, false, false, "NombreCategoria");
            } catch (initError) {
              console.log('Error al inicializar categorías:', initError);
            }
          }
          
          setCategorias(categoriasData || []);
          console.log('Categorías cargadas:', categoriasData);
          console.log('Primera categoría:', categoriasData?.[0]);
          console.log('Tipo de categoriaViajeId:', typeof categoriasData?.[0]?.categoriaViajeId);
          console.log('Valor de categoriaViajeId:', categoriasData?.[0]?.categoriaViajeId);
        } catch (err) {
          console.error('Error al cargar categorías:', err);
          setError('No se pudieron cargar las categorías. Por favor, inténtalo de nuevo más tarde.');
          setCategorias([]);
        }
      };
      fetchDependencies();

      if (editingActividad) {
        setFormData({
          planId: editingActividad.planId,
          nombreActividad: editingActividad.nombreActividad,
          descripcion: editingActividad.descripcion || '',
          fechaHoraInicio: editingActividad.fechaHoraInicio ? editingActividad.fechaHoraInicio.slice(0, 16) : '',
          fechaHoraFin: editingActividad.fechaHoraFin ? editingActividad.fechaHoraFin.slice(0, 16) : '',
          costoEstimado: editingActividad.costoEstimado,
          costoReal: editingActividad.costoReal || 0,
          ubicacion: editingActividad.ubicacion || '',
          categoriaViajeId: editingActividad.categoriaViajeId || '',
          prioridad: editingActividad.prioridad,
          estadoActividad: editingActividad.estadoActividad,
          urlReferencia: editingActividad.urlReferencia || '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingActividad, planId]);

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
      nombreActividad: '',
      descripcion: '',
      fechaHoraInicio: '',
      fechaHoraFin: '',
      costoEstimado: 0,
      costoReal: 0,
      ubicacion: '',
      categoriaViajeId: '',
      prioridad: 'media',
      estadoActividad: 'planificada',
      urlReferencia: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'datetime-local') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.planId || formData.planId.trim() === '') {
      setError('No se ha seleccionado un plan de vacaciones válido.');
      return;
    }

    if (!formData.nombreActividad.trim()) {
      setError('El nombre de la actividad es obligatorio.');
      return;
    }

    if (formData.costoEstimado < 0) {
      setError('El costo estimado no puede ser negativo.');
      return;
    }

    // Validar fechas si se proporcionan
    if (formData.fechaHoraInicio) {
      const fechaInicio = new Date(formData.fechaHoraInicio);
      const fechaFin = formData.fechaHoraFin ? new Date(formData.fechaHoraFin) : null;
      
      console.log('Fechas de la actividad:');
      console.log('- Fecha inicio:', fechaInicio);
      console.log('- Fecha fin:', fechaFin);
      
      // Obtener las fechas del plan desde el localStorage o props
      const planSeleccionadoRaw = localStorage.getItem('selected_plan');
      console.log('Plan seleccionado raw:', planSeleccionadoRaw);
      
      const planSeleccionado = JSON.parse(planSeleccionadoRaw || '{}');
      console.log('Plan seleccionado:', planSeleccionado);
      
      if (planSeleccionado.fechaInicio && planSeleccionado.fechaFin) {
        const planFechaInicio = new Date(planSeleccionado.fechaInicio);
        const planFechaFin = new Date(planSeleccionado.fechaFin);
        
        console.log('Fechas del plan:');
        console.log('- Plan fecha inicio:', planFechaInicio);
        console.log('- Plan fecha fin:', planFechaFin);
        
        if (fechaInicio < planFechaInicio || fechaInicio > planFechaFin) {
          console.log('Error: Fecha inicio fuera del rango del plan');
          setError(`La fecha de inicio debe estar entre ${planFechaInicio.toLocaleDateString()} y ${planFechaFin.toLocaleDateString()}`);
          return;
        }
        
        if (fechaFin && (fechaFin < planFechaInicio || fechaFin > planFechaFin)) {
          console.log('Error: Fecha fin fuera del rango del plan');
          setError(`La fecha de fin debe estar entre ${planFechaInicio.toLocaleDateString()} y ${planFechaFin.toLocaleDateString()}`);
          return;
        }
      } else {
        console.log('No se encontraron fechas del plan en localStorage');
        console.log('Plan seleccionado keys:', Object.keys(planSeleccionado));
      }
      
      if (fechaFin && fechaFin <= fechaInicio) {
        console.log('Error: Fecha fin debe ser posterior a fecha inicio');
        setError('La fecha y hora de fin debe ser posterior a la de inicio.');
        return;
      }
    } else {
      console.log('No hay fecha de inicio, saltando validación de fechas');
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        ...formData,
        // Convertir fechas a formato ISO en zona horaria local
        fechaHoraInicio: formData.fechaHoraInicio ? new Date(formData.fechaHoraInicio).toLocaleString('sv-SE').replace(' ', 'T') : undefined,
        fechaHoraFin: formData.fechaHoraFin ? new Date(formData.fechaHoraFin).toLocaleString('sv-SE').replace(' ', 'T') : undefined,
        // Convertir campos vacíos a undefined
        descripcion: formData.descripcion?.trim() || undefined,
        ubicacion: formData.ubicacion?.trim() || undefined,
        categoriaViajeId: formData.categoriaViajeId || undefined,
        urlReferencia: formData.urlReferencia?.trim() || undefined,
      };

      console.log('Datos a enviar:', dataToSend);
      console.log('PlanId a enviar:', dataToSend.planId);

      if (editingActividad) {
        await actividadesViajeService.actualizarActividad({ 
          ...dataToSend, 
          actividadId: editingActividad.actividadId 
        });
      } else {
        await actividadesViajeService.crearActividad(dataToSend);
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: `Actividad ${editingActividad ? 'actualizada' : 'creada'} exitosamente`,
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
      setError(`Error al ${editingActividad ? 'actualizar' : 'crear'} la actividad: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingActividad ? 'Editar Actividad de Viaje' : 'Nueva Actividad de Viaje'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingActividad ? 'Modifica los detalles de tu actividad' : 'Planifica una nueva actividad para tu viaje'}
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
                <Activity className="w-5 h-5 text-blue-600" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nombre de la Actividad */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nombre de la Actividad *
                  </label>
                  <input
                    type="text"
                    name="nombreActividad"
                    value={formData.nombreActividad}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="Ej: Visita al museo, Cena en restaurante local, Tour por la ciudad"
                    required
                  />
                </div>

                {/* Descripción */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400 resize-none"
                    placeholder="Describe los detalles de la actividad"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Fechas y Horarios */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Fechas y Horarios
              </h3>
              
              {planInfo && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Plan:</strong> {planInfo.nombrePlan} • 
                    <strong> Rango disponible:</strong> {new Date(planInfo.fechaInicio).toLocaleDateString()} - {new Date(planInfo.fechaFin).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fecha y Hora de Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    name="fechaHoraInicio"
                    value={formData.fechaHoraInicio || ''}
                    onChange={handleChange}
                    disabled={loading}
                    min={planInfo ? new Date(planInfo.fechaInicio).toISOString().slice(0, 16) : undefined}
                    max={planInfo ? new Date(planInfo.fechaFin).toISOString().slice(0, 16) : undefined}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
                  />
                </div>

                {/* Fecha y Hora de Fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="datetime-local"
                    name="fechaHoraFin"
                    value={formData.fechaHoraFin || ''}
                    onChange={handleChange}
                    disabled={loading}
                    min={planInfo ? new Date(planInfo.fechaInicio).toISOString().slice(0, 16) : undefined}
                    max={planInfo ? new Date(planInfo.fechaFin).toISOString().slice(0, 16) : undefined}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Clasificación y Estado */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-600" />
                Clasificación y Estado
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Prioridad *
                  </label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                    required
                  >
                    {prioridadOptions.map(option => (
                      <option key={`prioridad-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado (solo para edición) */}
                {editingActividad && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Estado
                    </label>
                    <select
                      name="estadoActividad"
                      value={formData.estadoActividad || 'planificada'}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                text-gray-700"
                    >
                      {estadoOptions.map(option => (
                        <option key={`estado-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categoría
                  </label>
                  <select
                    name="categoriaViajeId"
                    value={formData.categoriaViajeId || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                  >
                    <option key="categoria-vacia" value="">Sin categoría</option>
                    {categorias.map((categoria, index) => (
                      <option 
                        key={`categoria-${categoria.categoriaViajeId || `index-${index}`}`} 
                        value={categoria.categoriaViajeId || ''}
                      >
                        {categoria.nombreCategoria}
                      </option>
                    ))}
                  </select>
                  {categorias.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Las categorías se están cargando o no hay categorías creadas aún.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 4: Costos y Ubicación */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Costos y Ubicación
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Costo Estimado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Costo Estimado *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      name="costoEstimado"
                      value={formData.costoEstimado}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Costo Real (solo para edición) */}
                {editingActividad && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Costo Real
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        name="costoReal"
                        value={formData.costoReal || 0}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                  disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                  placeholder:text-gray-400"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                )}

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
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400"
                      placeholder="Dirección o lugar"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5: Información Adicional */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                Información Adicional
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                {/* URL de Referencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    URL de Referencia
                  </label>
                  <input
                    type="url"
                    name="urlReferencia"
                    value={formData.urlReferencia || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="https://ejemplo.com/actividad"
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
                disabled={loading || !formData.nombreActividad.trim()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-lg disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingActividad ? 'Actualizar' : 'Crear'} Actividad</span>
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