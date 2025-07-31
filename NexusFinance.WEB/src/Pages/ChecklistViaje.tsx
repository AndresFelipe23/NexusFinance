import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle, 
  Circle, 
  Edit, 
  Trash2, 
  Calendar, 
  Filter, 
  ArrowLeft,
  RefreshCw,
  CheckSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { gsap } from 'gsap';
import Layout from '../components/Layout';
import ChecklistViajeModal from '../components/ChecklistViajeModal';
import { checklistViajeService } from '../services/checklistViajeService';
import { planesVacacionesService } from '../services/planesVacacionesService';
import type { ChecklistViaje, ChecklistPorCategoria, ChecklistStats } from '../types/checklistViaje';
import type { PlanVacaciones } from '../types/planVacaciones';
import Swal from 'sweetalert2';
import { useModal } from '../contexts/ModalContext';

const ChecklistViajeView: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const [plan, setPlan] = useState<PlanVacaciones | null>(null);
  const [items, setItems] = useState<ChecklistViaje[]>([]);
  const [categorias, setCategorias] = useState<ChecklistPorCategoria[]>([]);
  const [estadisticas, setEstadisticas] = useState<ChecklistStats>({
    total: 0,
    completados: 0,
    pendientes: 0,
    porVencer: 0,
    vencidos: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ChecklistViaje | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('');
  const [mostrarCompletados, setMostrarCompletados] = useState(true);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<{ [key: string]: boolean }>({
    documentos: true,
    equipaje: true,
    salud: true,
    finanzas: true,
    general: true
  });

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [planes, setPlanes] = useState<PlanVacaciones[]>([]);

  useEffect(() => {
    if (planId) {
      cargarDatos();
    } else {
      cargarPlanes();
    }
  }, [planId, navigate]);

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      const usuario = JSON.parse(localStorage.getItem('nexus_user') || '{}');
      const planesData = await planesVacacionesService.obtenerPlanesPorUsuario(usuario.usuarioId);
      setPlanes(planesData);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los planes de vacaciones',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          statsRef.current?.children || [],
          { y: 20, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: "power2.out" 
          }
        );

        gsap.fromTo(
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.4, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [loading]);

  const cargarDatos = async () => {
    if (!planId) return;

    try {
      setLoading(true);
      
      // Cargar plan y checklist en paralelo
      const [planData, checklistData] = await Promise.all([
        planesVacacionesService.obtenerPlanPorId(planId),
        checklistViajeService.obtenerChecklistPorPlan(planId)
      ]);

      setPlan(planData);
      setItems(checklistData || []);
      
      // Calcular estadísticas y categorías
      const stats = checklistViajeService.calcularEstadisticas(checklistData || []);
      setEstadisticas(stats);
      
      const cats = checklistViajeService.agruparPorCategoria(checklistData || []);
      setCategorias(cats);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos del checklist',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: ChecklistViaje) => {
    setEditingItem(item || null);
    showModal(
      <ChecklistViajeModal
        onClose={handleCloseModal}
        onSuccess={(action, itemName) => handleModalSuccess(action, itemName)}
        planId={planId!}
        editingItem={item || null}
      />
    );
  };

  const handleCloseModal = () => {
    hideModal();
    setEditingItem(null);
  };

  const handleModalSuccess = (action: 'created' | 'updated' = 'created', itemName?: string) => {
    cargarDatos();
    
    if (action === 'created') {
      Swal.fire({
        title: '¡Item creado!',
        text: itemName ? `"${itemName}" ha sido agregado al checklist` : 'Nuevo item agregado al checklist',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#10b981',
        color: '#ffffff',
        customClass: {
          popup: 'swal2-toast'
        }
      });
    } else if (action === 'updated') {
      Swal.fire({
        title: '¡Item actualizado!',
        text: itemName ? `"${itemName}" ha sido actualizado` : 'Item actualizado correctamente',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#3b82f6',
        color: '#ffffff',
        customClass: {
          popup: 'swal2-toast'
        }
      });
    }
  };

  const handleToggleCompletado = async (item: ChecklistViaje) => {
    try {
      await checklistViajeService.marcarComoCompletado(item.checklistId, !item.estaCompletado);
      cargarDatos();
      
      // Mostrar toast de SweetAlert2
      if (!item.estaCompletado) {
        // Item completado
        Swal.fire({
          title: '¡Completado!',
          text: `"${item.item}" marcado como completado`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#10b981',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });
      } else {
        // Item descompletado
        Swal.fire({
          title: 'Descompletado',
          text: `"${item.item}" marcado como pendiente`,
          icon: 'info',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#6b7280',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el estado del item',
        icon: 'error',
        timer: 4000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#ef4444',
        color: '#ffffff',
        customClass: {
          popup: 'swal2-toast'
        }
      });
    }
  };

  const handleEliminar = async (item: ChecklistViaje) => {
    const result = await Swal.fire({
      title: '¿Eliminar item?',
      text: `¿Estás seguro de eliminar "${item.item}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await checklistViajeService.eliminarItemChecklist(item.checklistId);
        Swal.fire({
          title: '¡Eliminado!',
          text: `"${item.item}" ha sido eliminado`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#10b981',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el item',
          icon: 'error',
          timer: 4000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#ef4444',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });
      }
    }
  };

  const toggleCategoria = (categoria: string) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const generarChecklistPredefinido = async () => {
    if (!planId || !plan) return;

    const result = await Swal.fire({
      title: 'Generar checklist predefinido',
      text: '¿Deseas generar un checklist con items básicos para tu viaje?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await checklistViajeService.generarChecklistBasico(planId, plan.esViajeInternacional);

        Swal.fire({
          title: '¡Checklist generado!',
          text: 'Se ha generado un checklist básico para tu viaje',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#3b82f6',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });

        cargarDatos();
      } catch (error) {
        console.error('Error al generar checklist:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo generar el checklist predefinido',
          icon: 'error',
          timer: 4000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#ef4444',
          color: '#ffffff',
          customClass: {
            popup: 'swal2-toast'
          }
        });
      }
    }
  };

  const itemsFiltrados = items.filter(item => {
    if (filtroCategoria && item.categoriaChecklist !== filtroCategoria) return false;
    if (filtroPrioridad && item.prioridad !== filtroPrioridad) return false;
    if (!mostrarCompletados && item.estaCompletado) return false;
    return true;
  });



  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">{planId ? 'Cargando checklist...' : 'Cargando planes...'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Vista de selección de planes cuando no hay planId
  if (!planId) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header Hero */}
          <div className="p-6">
            <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative px-6 py-8">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Checklist de Viajes</h1>
                    <p className="text-blue-100 text-lg">
                      Selecciona un plan de vacaciones para ver y gestionar su checklist
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {planes.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckSquare className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No hay planes de viaje
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Crea un plan de vacaciones primero para poder gestionar su checklist
                  </p>
                  <button
                    onClick={() => navigate('/planes-vacaciones')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Plan de Viaje</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planes.map((plan) => (
                  <div
                    key={plan.planId}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {plan.nombrePlan}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            📍 {plan.destino}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(plan.fechaInicio).toLocaleDateString('es-CO')} - {new Date(plan.fechaFin).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          plan.estadoPlan === 'completado' ? 'bg-green-100 text-green-800' :
                          plan.estadoPlan === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                          plan.estadoPlan === 'confirmado' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {plan.estadoPlan}
                        </span>
                      </div>
                      
                      {plan.descripcion && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {plan.descripcion}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/checklist-viaje/${plan.planId}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>Ver Checklist</span>
                        </button>
                        <button
                          onClick={() => navigate(`/planes-vacaciones/${plan.planId}`)}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalles del plan"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => navigate(`/planes-vacaciones/${planId}`)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                      <div>
                        <h1 className="text-4xl font-bold">Checklist de Viaje</h1>
                        <p className="text-blue-100 text-lg">{plan?.nombrePlan}</p>
                        <p className="text-blue-200 text-sm">{plan?.destino}</p>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-blue-100 text-sm">Total Items</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-green-300">{estadisticas.completados}</div>
                        <div className="text-blue-100 text-sm">Completados</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-yellow-300">{estadisticas.pendientes}</div>
                        <div className="text-blue-100 text-sm">Pendientes</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-orange-300">{estadisticas.porVencer}</div>
                        <div className="text-blue-100 text-sm">Por Vencer</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-red-300">{estadisticas.vencidos}</div>
                        <div className="text-blue-100 text-sm">Vencidos</div>
                      </div>
                    </div>

                    {/* Progreso General */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-100 text-sm font-medium">Progreso General</span>
                        <span className="text-white font-bold">
                          {estadisticas.total > 0 ? Math.round((estadisticas.completados / estadisticas.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${estadisticas.total > 0 ? (estadisticas.completados / estadisticas.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleOpenModal()}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Nuevo Item</span>
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={generarChecklistPredefinido}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span className="text-sm">Generar</span>
                      </button>
                      <button
                        onClick={cargarDatos}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Actualizar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  <option value="documentos">📄 Documentos</option>
                  <option value="equipaje">🧳 Equipaje</option>
                  <option value="salud">⚕️ Salud</option>
                  <option value="finanzas">💰 Finanzas</option>
                  <option value="general">📋 General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={filtroPrioridad}
                  onChange={(e) => setFiltroPrioridad(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las prioridades</option>
                  <option value="alta">🔴 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="baja">🟢 Baja</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarCompletados}
                    onChange={(e) => setMostrarCompletados(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar completados</span>
                </label>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div ref={contentRef}>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckSquare className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No hay items en el checklist
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza agregando items o genera un checklist predefinido para tu viaje
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => handleOpenModal()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Agregar Item</span>
                    </button>
                    <button
                      onClick={generarChecklistPredefinido}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                      <CheckSquare className="w-5 h-5" />
                      <span>Generar Checklist</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">

                {categorias.map((categoria) => {
                  const itemsCategoria = itemsFiltrados.filter(item => item.categoriaChecklist === categoria.categoria);
                  if (itemsCategoria.length === 0) return null;

                  const isExpanded = categoriasExpandidas[categoria.categoria];

                  return (
                    <div key={categoria.categoria} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                      {/* Header de Categoría */}
                      <div 
                        className={`p-6 cursor-pointer bg-gradient-to-r ${checklistViajeService.obtenerColorCategoria(categoria.categoria)}`}
                        onClick={() => toggleCategoria(categoria.categoria)}
                      >
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {checklistViajeService.obtenerIconoCategoria(categoria.categoria)}
                            </span>
                            <div>
                              <h3 className="text-xl font-bold capitalize">{categoria.categoria}</h3>
                              <p className="text-blue-100 text-sm">
                                {categoria.completados} de {categoria.total} completados
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{categoria.porcentaje}%</div>
                              <div className="w-20 bg-white/20 rounded-full h-2 mt-1">
                                <div
                                  className="bg-white h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${categoria.porcentaje}%` }}
                                />
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-6 h-6" />
                            ) : (
                              <ChevronRight className="w-6 h-6" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items de la Categoría */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-100">
                          {itemsCategoria.map((item) => {
                            const diasRestantes = checklistViajeService.obtenerDiasRestantes(item.fechaLimite || '');
                            const estadoFecha = checklistViajeService.obtenerEstadoFecha(item.fechaLimite || '');
                            
                            return (
                              <div 
                                key={item.checklistId} 
                                className={`p-6 transition-all duration-200 hover:bg-gray-50 ${
                                  item.estaCompletado ? 'opacity-75' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4 flex-1">
                                    <button
                                      onClick={() => handleToggleCompletado(item)}
                                      className={`mt-1 transition-colors ${
                                        item.estaCompletado 
                                          ? 'text-green-600 hover:text-green-700' 
                                          : 'text-gray-400 hover:text-green-600'
                                      }`}
                                    >
                                      {item.estaCompletado ? (
                                        <CheckCircle className="w-6 h-6" />
                                      ) : (
                                        <Circle className="w-6 h-6" />
                                      )}
                                    </button>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className={`text-lg font-semibold ${
                                          item.estaCompletado 
                                            ? 'text-gray-500 line-through' 
                                            : 'text-gray-900'
                                        }`}>
                                          {item.item}
                                        </h4>
                                        
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          checklistViajeService.obtenerColorPrioridad(item.prioridad)
                                        }`}>
                                          {checklistViajeService.obtenerIconoPrioridad(item.prioridad)} {item.prioridad}
                                        </span>
                                      </div>
                                      
                                      {item.descripcion && (
                                        <p className="text-gray-600 text-sm mb-2">{item.descripcion}</p>
                                      )}
                                      
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {item.fechaLimite && (
                                          <div className={`flex items-center gap-1 ${
                                            estadoFecha === 'vencido' ? 'text-red-600' :
                                            estadoFecha === 'por-vencer' ? 'text-yellow-600' : 'text-gray-500'
                                          }`}>
                                            <Calendar className="w-4 h-4" />
                                            <span>{checklistViajeService.formatearFecha(item.fechaLimite)}</span>
                                            {diasRestantes !== null && !item.estaCompletado && (
                                              <span className="ml-1">
                                                ({diasRestantes > 0 ? `${diasRestantes} días` : 
                                                  diasRestantes === 0 ? 'Hoy' : `${Math.abs(diasRestantes)} días atrás`})
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        
                                        {item.fechaCompletado && (
                                          <div className="flex items-center gap-1 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Completado: {checklistViajeService.formatearFecha(item.fechaCompletado)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenModal(item)}
                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Editar item"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEliminar(item)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Eliminar item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


      </div>
    </Layout>
  );
};

export default ChecklistViajeView;