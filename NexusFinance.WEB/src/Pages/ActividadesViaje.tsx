import { useState, useEffect, useRef } from 'react';
import Layout from "../components/Layout";
import { actividadesViajeService } from '../services/actividadesViajeService';
import { planesVacacionesService } from '../services/planesVacacionesService';
import { authService } from '../services/authService';
import type { ActividadViaje } from '../types/actividadViaje';
import type { PlanVacaciones } from '../types/planVacaciones';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, Calendar, RefreshCw, ChevronDown, MapPin, Clock, DollarSign, Edit, Trash2, Star, AlertCircle } from 'lucide-react';
import ActividadViajeModal from '../components/ActividadViajeModal';

export default function ActividadesViaje() {
  const [actividades, setActividades] = useState<ActividadViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [showModal, setShowModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<ActividadViaje | null>(null);

  // Estados para planes de vacaciones
  const [planes, setPlanes] = useState<PlanVacaciones[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanVacaciones | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // Asumiendo que el planId se obtendría de la URL o de un selector de plan
  const [planId, setPlanId] = useState<string | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Verificar autenticación
  useEffect(() => {
    const token = authService.getToken();
    const user = authService.getUser();
    
    console.log('Token:', token);
    console.log('User from authService:', user);
    
    if (!token || !user) {
      console.log('No hay token o usuario, redirigiendo al login');
      window.location.href = '/login';
      return;
    }
    
    setCurrentUser(user);
  }, []);

  // Cargar planes de vacaciones del usuario
  useEffect(() => {
    const fetchPlanes = async () => {
      console.log('Current user:', currentUser);
      console.log('Usuario ID:', currentUser?.usuarioId);
      
      if (!currentUser?.usuarioId) {
        console.log('No hay usuario autenticado o usuarioId es undefined');
        return;
      }

      // Validar que el usuarioId sea un GUID válido
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(currentUser.usuarioId)) {
        console.error('UsuarioId no es un GUID válido:', currentUser.usuarioId);
        setError('Error: ID de usuario inválido. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      try {
        console.log('Llamando a obtenerPlanesPorUsuario con usuarioId:', currentUser.usuarioId);
        const planesData = await planesVacacionesService.obtenerPlanesPorUsuario(currentUser.usuarioId);
        console.log('Planes obtenidos:', planesData);
        console.log('Primer plan:', planesData[0]);
        if (planesData[0]) {
          console.log('Primer plan fechaInicio:', planesData[0].fechaInicio);
          console.log('Primer plan fechaFin:', planesData[0].fechaFin);
        }
        setPlanes(planesData);
        
        // Si hay un plan guardado en localStorage, seleccionarlo
        const savedPlanId = localStorage.getItem('selected_plan_id');
        if (savedPlanId) {
          const planGuardado = planesData.find(p => p.planId === savedPlanId);
          if (planGuardado) {
            setPlanSeleccionado(planGuardado);
            setPlanId(savedPlanId);
          }
        }
      } catch (err) {
        console.error('Error al cargar planes de vacaciones:', err);
        setError('Error al cargar los planes de vacaciones.');
      }
    };

    fetchPlanes();
  }, [currentUser?.usuarioId]);

  useEffect(() => {
    // Intentar obtener planId desde localStorage como fallback
    if (currentUser?.usuarioId && !planId) {
      const savedPlanId = localStorage.getItem('selected_plan_id');
      if (savedPlanId && savedPlanId !== '00000000-0000-0000-0000-000000000000' && savedPlanId !== '00000000-0000-0000-0000-000000000001') {
        setPlanId(savedPlanId);
      }
    }
  }, [currentUser, planId]);

  useEffect(() => {
    const fetchActividades = async () => {
      if (!planId || !currentUser?.usuarioId || planId === '123e4567-e89b-12d3-a456-426614174000') {
        setLoading(false);
        return;
      }
      try {
        const data = await actividadesViajeService.obtenerActividadesPorPlan(planId);
        console.log('Actividades obtenidas:', data);
        if (data.length > 0) {
          console.log('Primera actividad:', data[0]);
          console.log('Primera actividad fechaHoraInicio:', data[0].fechaHoraInicio);
          console.log('Primera actividad fechaHoraFin:', data[0].fechaHoraFin);
        }
        setActividades(data);
      } catch (err) {
        console.error('Error al obtener actividades de viaje:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar actividades.');
      }
      setLoading(false);
    };

    fetchActividades();
  }, [planId, currentUser?.usuarioId]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && actividades.length > 0) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, actividades]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cerrar selector de planes cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.plan-selector')) {
        setShowPlanSelector(false);
      }
    };

    if (showPlanSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlanSelector]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (planId && currentUser?.usuarioId && planId !== '123e4567-e89b-12d3-a456-426614174000') {
      actividadesViajeService.obtenerActividadesPorPlan(planId)
        .then(setActividades)
        .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar actividades.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: PlanVacaciones) => {
    console.log('Plan seleccionado para guardar:', plan);
    console.log('Plan fechaInicio:', plan.fechaInicio);
    console.log('Plan fechaFin:', plan.fechaFin);
    
    setPlanSeleccionado(plan);
    setPlanId(plan.planId);
    setShowPlanSelector(false);
    localStorage.setItem('selected_plan_id', plan.planId);
    localStorage.setItem('selected_plan', JSON.stringify(plan));
    
    // Verificar que se guardó correctamente
    const savedPlan = localStorage.getItem('selected_plan');
    console.log('Plan guardado en localStorage:', savedPlan);
    
    setError(null);
  };

  const handleOpenModal = (actividad?: ActividadViaje) => {
    if (!planId || planId.trim() === '') {
      setError('Debes seleccionar un plan de vacaciones antes de crear actividades.');
      return;
    }
    setEditingActividad(actividad || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActividad(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingActividad ? 'Actividad actualizada exitosamente' : 'Actividad creada exitosamente');
    handleRefresh();
  };

  const handleDelete = async (actividadId: string, nombreActividad: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar Actividad',
      text: `¿Estás seguro de que quieres eliminar la actividad "${nombreActividad}"? Esta acción es irreversible.`, 
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Eliminando actividad...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await actividadesViajeService.eliminarActividad(actividadId, true); // Eliminación física
        
        await Swal.fire({
          title: '¡Eliminada!',
          text: 'La actividad ha sido eliminada exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Actividad eliminada exitosamente');
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar la actividad: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar la actividad: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };

  // Calcular estadísticas (ejemplo)
  const estadisticas = {
    total: actividades.length,
    proximas: actividades.filter(a => a.fechaHoraInicio && new Date(a.fechaHoraInicio) > new Date()).length,
    completadas: actividades.filter(a => a.estadoActividad === 'completada').length,
    enCurso: actividades.filter(a => a.estadoActividad === 'en_curso' || (a.fechaHoraInicio && a.fechaHoraFin && new Date(a.fechaHoraInicio) <= new Date() && new Date(a.fechaHoraFin) >= new Date())).length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header Hero */}
        <div className="p-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Actividades de Viaje</h1>
                      <p className="text-blue-50 text-lg">Gestiona las actividades de tus viajes y aventuras</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{estadisticas.total}</div>
                      <div className="text-blue-50 text-sm">Total de Actividades</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">{estadisticas.completadas}</div>
                      <div className="text-blue-50 text-sm">Completadas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-yellow-300">{estadisticas.enCurso}</div>
                      <div className="text-blue-50 text-sm">En Curso</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-orange-300">{estadisticas.proximas}</div>
                      <div className="text-blue-50 text-sm">Próximas</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    disabled={!planSeleccionado}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Actividad</span>
                  </button>
                  
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="text-sm">Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Mensajes de error y éxito */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Éxito:</span>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Selector de Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Plan de Vacaciones
              </h3>
            </div>
            
            <div className="relative plan-selector">
              <button
                onClick={() => setShowPlanSelector(!showPlanSelector)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {planSeleccionado ? planSeleccionado.nombrePlan : 'Seleccionar Plan de Vacaciones'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {showPlanSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {planes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">No tienes planes de vacaciones</p>
                        <p className="text-sm mt-1">Crea tu primer plan para comenzar</p>
                      </div>
                    ) : (
                      planes.map((plan) => (
                        <button
                          key={plan.planId}
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full text-left px-3 py-3 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                            planSeleccionado?.planId === plan.planId ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{plan.nombrePlan}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(plan.fechaInicio).toLocaleDateString()} - {new Date(plan.fechaFin).toLocaleDateString()}
                          </div>
                        </button>
                      ))
                    )}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={() => window.location.href = '/planes-vacaciones'}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      >
                        + Crear nuevo plan de vacaciones
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Cargando actividades...</p>
              </div>
            </div>
          ) : !planSeleccionado ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecciona un plan de vacaciones
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Para ver y gestionar las actividades de viaje, primero debes seleccionar un plan.
                  </p>
                  <button
                    onClick={() => window.location.href = '/planes-vacaciones'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span>Ir a Planes de Vacaciones</span>
                  </button>
                </div>
              </div>
            </div>
          ) : actividades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes actividades de viaje registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primera actividad para este plan de vacaciones.
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Mi Primera Actividad</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {actividades.map((actividad) => {
                  const getPrioridadColor = (prioridad: string) => {
                    switch (prioridad?.toLowerCase()) {
                      case 'alta':
                        return 'bg-red-100 text-red-600';
                      case 'media':
                        return 'bg-yellow-100 text-yellow-600';
                      case 'baja':
                        return 'bg-green-100 text-green-600';
                      default:
                        return 'bg-gray-100 text-gray-600';
                    }
                  };

                  const getEstadoColor = (estado: string) => {
                    switch (estado?.toLowerCase()) {
                      case 'completada':
                        return 'bg-green-100 text-green-800';
                      case 'en_curso':
                        return 'bg-yellow-100 text-yellow-800';
                      case 'cancelada':
                        return 'bg-red-100 text-red-800';
                      default:
                        return 'bg-blue-100 text-blue-800';
                    }
                  };

                  const getPrioridadIcon = (prioridad: string) => {
                    switch (prioridad?.toLowerCase()) {
                      case 'alta':
                        return <AlertCircle className="w-4 h-4" />;
                      case 'media':
                        return <Clock className="w-4 h-4" />;
                      case 'baja':
                        return <Star className="w-4 h-4" />;
                      default:
                        return <Clock className="w-4 h-4" />;
                    }
                  };

                  return (
                    <div 
                      key={actividad.actividadId}
                      className="p-6 transition-all duration-200 hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${getPrioridadColor(actividad.prioridad)}`}>
                            {getPrioridadIcon(actividad.prioridad)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {actividad.nombreActividad}
                              </h4>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(actividad.estadoActividad)}`}>
                                {actividad.estadoActividad === 'completada' ? '✅ Completada' : 
                                 actividad.estadoActividad === 'en_curso' ? '🔄 En Curso' :
                                 actividad.estadoActividad === 'cancelada' ? '❌ Cancelada' : 
                                 '📅 Planificada'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {actividad.fechaHoraInicio && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(actividad.fechaHoraInicio).toLocaleString()}
                                </span>
                              )}
                              {actividad.ubicacion && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {actividad.ubicacion}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                Prioridad {actividad.prioridad}
                              </span>
                            </div>
                            
                            {actividad.descripcion && (
                              <p className="text-sm text-gray-600 line-clamp-2">{actividad.descripcion}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {actividad.costoEstimado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">Costo estimado</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal(actividad)}
                              className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 
                                        rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Editar actividad"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(actividad.actividadId, actividad.nombreActividad)}
                              className="p-3 text-red-600 hover:text-white hover:bg-red-600 
                                        rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Eliminar actividad"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ActividadViajeModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingActividad={editingActividad}
        planId={planId || ''}
      />
    </Layout>
  );
}