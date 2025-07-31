import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import { planesVacacionesService } from '../services/planesVacacionesService';
import { authService } from '../services/authService';
import type { PlanVacaciones } from '../types/planVacaciones';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, Plane, RefreshCw, Edit, Trash2, CalendarDays, Users, DollarSign, MapPin, Flag, Clock, ArrowLeft } from 'lucide-react';
import PlanVacacionesModal from '../components/PlanVacacionesModal';

export default function PlanesVacaciones() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [planes, setPlanes] = useState<PlanVacaciones[]>([]);
  const [planDetalle, setPlanDetalle] = useState<PlanVacaciones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanVacaciones | null>(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    enCurso: 0,
    completados: 0
  });

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentUser.usuarioId) {
        setError('Usuario no autenticado o ID de usuario no disponible.');
        setLoading(false);
        return;
      }

      try {
        if (planId) {
          // Cargar plan específico
          const plan = await planesVacacionesService.obtenerPlanPorId(planId);
          setPlanDetalle(plan);
        } else {
          // Cargar todos los planes
          const data = await planesVacacionesService.obtenerPlanesPorUsuario(currentUser.usuarioId);
          setPlanes(data);
          
          // Calcular estadísticas
          const stats = {
            total: data.length,
            activos: data.filter(p => p.estadoPlan !== 'cancelado' && new Date(p.fechaFin) >= new Date()).length,
            completados: data.filter(p => p.estadoPlan === 'completado' || new Date(p.fechaFin) < new Date()).length,
            enCurso: data.filter(p => p.estadoPlan === 'en_curso' || (new Date(p.fechaInicio) <= new Date() && new Date(p.fechaFin) >= new Date())).length
          };
          setEstadisticas(stats);
        }
      } catch (err) {
        console.error('Error al obtener planes de vacaciones:', err);
        if (planId) {
          setError(`No se pudo cargar el plan con ID: ${planId}. ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } else {
          setError(err instanceof Error ? err.message : 'Error desconocido al cargar planes.');
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [currentUser?.usuarioId, planId]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && (planes.length > 0 || planDetalle)) {
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
  }, [loading, planes, planDetalle]);

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

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (currentUser?.usuarioId) {
      planesVacacionesService.obtenerPlanesPorUsuario(currentUser.usuarioId)
        .then(setPlanes)
        .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar planes.'))
        .finally(() => setLoading(false));
    }
  };

  const handleOpenModal = (plan?: PlanVacaciones) => {
    setEditingPlan(plan || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingPlan ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente');
    handleRefresh();
  };

  const handleDelete = async (planId: string, nombrePlan: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar Plan',
      text: `¿Estás seguro de que quieres eliminar el plan "${nombrePlan}"? Esta acción es irreversible.`, 
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
          title: 'Eliminando plan...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await planesVacacionesService.eliminarPlan(planId, true); // Eliminación física
        
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'El plan ha sido eliminado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Plan eliminado exitosamente');
        handleRefresh(); // Recargar la lista de planes
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar el plan: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar el plan: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };



  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800';
      case 'en_curso': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'planificando': return 'bg-blue-100 text-blue-800';
      case 'confirmado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'completado': return 'Completado';
      case 'en_curso': return 'En Curso';
      case 'cancelado': return 'Cancelado';
      case 'planificando': return 'Planificando';
      case 'confirmado': return 'Confirmado';
      default: return 'Desconocido';
    }
  };

  const getDaysRemaining = (fecha: string) => {
    const today = new Date();
    const targetDate = new Date(fecha);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    {planId && planDetalle ? (
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => navigate(`/checklist-viaje/${planId}`)}
                          className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
                        >
                          <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                          <h1 className="text-4xl font-bold">Detalles del Plan</h1>
                          <p className="text-purple-50 text-lg">{planDetalle.nombrePlan}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Plane className="w-8 h-8" />
                        </div>
                        <div>
                          <h1 className="text-4xl font-bold">Mis Planes de Vacaciones</h1>
                          <p className="text-purple-50 text-lg">Organiza y gestiona tus próximas aventuras</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Estadísticas - Solo mostrar cuando no hay planId */}
                    {!planId && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="text-2xl font-bold">{estadisticas.total}</div>
                          <div className="text-purple-50 text-sm">Total Planes</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="text-2xl font-bold text-green-300">{estadisticas.activos}</div>
                          <div className="text-purple-50 text-sm">Activos</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="text-2xl font-bold text-yellow-300">{estadisticas.enCurso}</div>
                          <div className="text-purple-50 text-sm">En Curso</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                          <div className="text-2xl font-bold text-gray-300">{estadisticas.completados}</div>
                          <div className="text-purple-50 text-sm">Completados</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!planId && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Plan</span>
                      </button>
                      
                      <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Actualizar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={contentRef} className="max-w-7xl mx-auto px-6 py-8">

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

          {loading ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">
                  {planId ? 'Cargando detalles del plan...' : 'Cargando planes...'}
                </p>
              </div>
            </div>
          ) : planId && !planDetalle && !loading ? (
            // Plan no encontrado
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plane className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Plan no encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  No se pudo encontrar el plan con ID: {planId}
                </p>
                <button
                  onClick={() => navigate('/planes-vacaciones')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver a Planes</span>
                </button>
              </div>
            </div>
          ) : planId && planDetalle ? (
            // Vista de detalle del plan
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información básica */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Información del Plan</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
                      <p className="text-lg font-semibold text-gray-900">{planDetalle?.nombrePlan || 'No disponible'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Destino</label>
                      <p className="text-lg text-gray-900">{planDetalle?.destino || 'No disponible'}, {planDetalle?.pais || 'No disponible'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(planDetalle?.estadoPlan || '')}`}>
                        {getEstadoLabel(planDetalle?.estadoPlan || '')}
                      </span>
                    </div>
                    {planDetalle?.descripcion && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <p className="text-gray-900">{planDetalle.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fechas y detalles */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Fechas y Detalles</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                        <p className="text-lg text-gray-900">
                          {planDetalle?.fechaInicio ? new Date(planDetalle.fechaInicio).toLocaleDateString('es-CO') : 'No disponible'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                        <p className="text-lg text-gray-900">
                          {planDetalle?.fechaFin ? new Date(planDetalle.fechaFin).toLocaleDateString('es-CO') : 'No disponible'}
                        </p>
                      </div>
                    </div>
                    {planDetalle?.cantidadPersonas && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cantidad de Personas</label>
                        <p className="text-lg text-gray-900">{planDetalle.cantidadPersonas}</p>
                      </div>
                    )}
                    {planDetalle?.presupuestoEstimado && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Presupuesto Estimado</label>
                        <p className="text-lg text-gray-900">
                          {planDetalle.presupuestoEstimado.toLocaleString('es-CO', { 
                            style: 'currency', 
                            currency: planDetalle?.monedaDestino || 'COP' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/checklist-viaje/${planDetalle?.planId}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200"
                >
                  <Plane className="w-5 h-5" />
                  <span>Ver Checklist</span>
                </button>
                <button
                  onClick={() => handleOpenModal(planDetalle)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
                >
                  <Edit className="w-5 h-5" />
                  <span>Editar Plan</span>
                </button>
              </div>
            </div>
          ) : planes.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plane className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes planes de vacaciones registrados
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primer plan para organizar tus próximas aventuras
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Mi Primer Plan</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planes.map((plan) => (
                <div key={plan.planId} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{plan.nombrePlan}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(plan.estadoPlan)}`}>
                        {getEstadoLabel(plan.estadoPlan)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {plan.destino} ({plan.pais})
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        <span>{new Date(plan.fechaInicio).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-500" />
                        <span>{new Date(plan.fechaFin).toLocaleDateString()}</span>
                      </div>
                      {plan.cantidadPersonas && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span>{plan.cantidadPersonas} personas</span>
                        </div>
                      )}
                      {plan.presupuestoEstimado && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span>{plan.presupuestoEstimado.toLocaleString('es-CO', { style: 'currency', currency: plan.monedaDestino || 'COP' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Barra de progreso de días restantes */}
                    {plan.estadoPlan !== 'completado' && plan.estadoPlan !== 'cancelado' && new Date(plan.fechaInicio) > new Date() && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Faltan {getDaysRemaining(plan.fechaInicio)} días</span>
                          <span>Inicio: {new Date(plan.fechaInicio).toLocaleDateString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${Math.max(0, 100 - (getDaysRemaining(plan.fechaInicio) / 30) * 100)}%` }} // Ejemplo simple de progreso
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                      <button
                        onClick={() => navigate(`/planes-vacaciones/${plan.planId}`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plane className="w-4 h-4 mr-2" />
                        Ver Detalle
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(plan)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(plan.planId, plan.nombrePlan)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PlanVacacionesModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingPlan={editingPlan}
      />
    </Layout>
  );
}