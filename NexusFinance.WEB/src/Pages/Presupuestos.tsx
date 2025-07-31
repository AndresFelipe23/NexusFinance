import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, PowerOff, RotateCcw, Calendar, DollarSign, TrendingUp, RefreshCw, PieChart, ClipboardList } from 'lucide-react';
import { gsap } from 'gsap';
import { presupuestoService } from '../services/presupuestoService';
import type { Presupuesto } from '../types/presupuesto';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import PresupuestoModalGlobal from '../components/PresupuestoModalGlobal';
import CategoriasPresupuestoModal from '../components/CategoriasPresupuestoModal';
import Swal from 'sweetalert2';

const Presupuestos: React.FC = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [showCategoriasModal, setShowCategoriasModal] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [soloActivos, setSoloActivos] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cargarPresupuestos();
  }, [soloActivos, periodoFiltro]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && presupuestos.length > 0) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          statsRef.current?.children || [],
          { y: 20, opacity: 0, scale: 0.95 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: "power2.out" 
          }
        );

        gsap.fromTo(
          tableRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.4, ease: "power2.out" }
        );

        gsap.fromTo(
          cardsRef.current,
          { x: -20, opacity: 0 },
          { 
            x: 0, 
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.6,
            ease: "power2.out" 
          }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, presupuestos]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const cargarPresupuestos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const usuarioId = authService.getUserId();
      
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      console.log('Cargando presupuestos para usuario:', usuarioId);
      console.log('Filtros - Periodo:', periodoFiltro, 'Solo activos:', soloActivos);

      const presupuestosData = await presupuestoService.obtenerPresupuestosPorUsuario(
        usuarioId, 
        periodoFiltro || undefined, 
        soloActivos
      );
      
      console.log('Presupuestos obtenidos:', presupuestosData);
      
      if (Array.isArray(presupuestosData)) {
        setPresupuestos(presupuestosData);
        console.log('Presupuestos cargados:', presupuestosData.length);
      } else {
        console.log('No se recibió un array de presupuestos:', presupuestosData);
        setPresupuestos([]);
      }
    } catch (err) {
      console.error('Error al cargar presupuestos:', err);
      setError(`Error al cargar los presupuestos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setPresupuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (presupuesto?: Presupuesto) => {
    setEditingPresupuesto(presupuesto || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPresupuesto(null);
  };

  const handleOpenCategoriasModal = (presupuesto: Presupuesto) => {
    setSelectedPresupuesto(presupuesto);
    setShowCategoriasModal(true);
  };

  const handleCloseCategoriasModal = () => {
    setShowCategoriasModal(false);
    setSelectedPresupuesto(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingPresupuesto ? 'Presupuesto actualizado exitosamente' : 'Presupuesto creado exitosamente');
    cargarPresupuestos();
  };

  const handleEdit = (presupuesto: Presupuesto) => {
    handleOpenModal(presupuesto);
  };

  const handleReactivar = async (presupuestoId: string, nombrePresupuesto: string) => {
    const result = await Swal.fire({
      title: '¿Reactivar presupuesto?',
      text: `¿Quieres reactivar el presupuesto "${nombrePresupuesto}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        // Mostrar loading
        Swal.fire({
          title: 'Reactivando presupuesto...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await presupuestoService.reactivarPresupuesto(presupuestoId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Reactivado!',
          text: 'El presupuesto ha sido reactivado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Presupuesto reactivado exitosamente');
        cargarPresupuestos();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo reactivar el presupuesto. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al reactivar el presupuesto');
      }
    }
  };

  const handleDelete = async (presupuestoId: string, nombrePresupuesto: string) => {
    const result = await Swal.fire({
      title: '⚠️ Eliminación permanente',
      text: `¿Estás completamente seguro? Esta acción NO se puede deshacer y eliminará permanentemente el presupuesto "${nombrePresupuesto}" y todos sus datos asociados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando presupuesto...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await presupuestoService.eliminarPresupuesto(presupuestoId, true); // eliminacionFisica = true
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Eliminado permanentemente!',
          text: 'El presupuesto ha sido eliminado de forma permanente',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Presupuesto eliminado permanentemente');
        cargarPresupuestos();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el presupuesto. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al eliminar el presupuesto');
      }
    }
  };

  const handleDesactivar = async (presupuestoId: string, nombrePresupuesto: string) => {
    const result = await Swal.fire({
      title: 'Desactivar presupuesto',
      text: `¿Quieres desactivar el presupuesto "${nombrePresupuesto}"? Podrás reactivarlo más tarde desde aquí mismo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        // Mostrar loading
        Swal.fire({
          title: 'Desactivando presupuesto...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await presupuestoService.desactivarPresupuesto(presupuestoId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Desactivado!',
          text: 'El presupuesto ha sido desactivado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Presupuesto desactivado exitosamente');
        cargarPresupuestos();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo desactivar el presupuesto. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al desactivar el presupuesto');
      }
    }
  };

  const getPeriodoIcon = (periodo: string) => {
    const iconClass = "w-5 h-5";
    switch (periodo) {
      case 'Mensual':
        return <Calendar className={iconClass} />;
      case 'Trimestral':
        return <TrendingUp className={iconClass} />;
      case 'Semestral':
        return <PieChart className={iconClass} />;
      case 'Anual':
        return <DollarSign className={iconClass} />;
      default:
        return <Calendar className={iconClass} />;
    }
  };

  const getPeriodoColor = (periodo: string) => {
    switch (periodo) {
      case 'Mensual':
        return 'bg-blue-100 text-blue-600';
      case 'Trimestral':
        return 'bg-green-100 text-green-600';
      case 'Semestral':
        return 'bg-purple-100 text-purple-600';
      case 'Anual':
        return 'bg-orange-100 text-orange-600';
      case 'Personalizado':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const totalPresupuesto = presupuestos.reduce((total, presupuesto) => total + (presupuesto.presupuestoTotal || 0), 0);
  const presupuestosActivos = presupuestos.filter(p => p.estaActivo !== false).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando presupuestos...</p>
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
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <PieChart className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Mis Presupuestos</h1>
                      <p className="text-blue-50 text-lg">Gestiona y controla tus presupuestos financieros</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{presupuestos.length}</div>
                      <div className="text-blue-50 text-sm">Total de Presupuestos</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">
                        {presupuestoService.formatearMonto(totalPresupuesto)}
                      </div>
                      <div className="text-blue-50 text-sm">Presupuesto Total</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-yellow-300">{presupuestosActivos}</div>
                      <div className="text-blue-50 text-sm">Presupuestos Activos</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Presupuesto</span>
                  </button>
                  
                  <button
                    onClick={cargarPresupuestos}
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

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Mensajes */}
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

          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Filtros y Búsqueda
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los períodos</option>
                  {presupuestoService.getPeriodosPresupuesto().map(periodo => (
                    <option key={periodo} value={periodo}>
                      {presupuestoService.formatearPeriodo(periodo)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloActivos}
                    onChange={(e) => setSoloActivos(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Solo presupuestos activos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Lista de Presupuestos */}
          <div ref={tableRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {presupuestos.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PieChart className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes presupuestos registrados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primer presupuesto para controlar tus gastos y alcanzar tus metas financieras
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Mi Primer Presupuesto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {presupuestos.map((presupuesto, index) => (
                  <div 
                    key={presupuesto.presupuestoId} 
                    ref={el => {
                      if (el) cardsRef.current[index] = el;
                    }}
                    className={`p-6 transition-all duration-200 hover:shadow-md ${
                      presupuesto.estaActivo === false 
                        ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 hover:from-red-100 hover:to-red-200' 
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${getPeriodoColor(presupuesto.periodoPresupuesto)}`}>
                          {getPeriodoIcon(presupuesto.periodoPresupuesto)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-lg font-semibold ${
                              presupuesto.estaActivo === false ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {presupuesto.nombrePresupuesto}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              presupuesto.estaActivo !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {presupuesto.estaActivo !== false ? '✅ Activo' : '❌ Inactivo'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {presupuestoService.formatearPeriodo(presupuesto.periodoPresupuesto)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {presupuestoService.formatearFecha(presupuesto.fechaInicio)}
                              {presupuesto.fechaFin && (
                                <> - {presupuestoService.formatearFecha(presupuesto.fechaFin)}</>
                              )}
                            </span>
                          </div>
                          
                          {presupuesto.estaActivo === false && (
                            <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                              <span>⚠️</span>
                              <span>Presupuesto desactivado - Puedes reactivarlo cuando lo necesites</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            presupuesto.estaActivo === false 
                              ? 'text-gray-400 line-through' 
                              : 'text-green-600'
                          }`}>
                            {presupuestoService.formatearMonto(presupuesto.presupuestoTotal)}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">Presupuesto total</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {presupuesto.estaActivo === false ? (
                            // Botón de reactivar para presupuestos inactivos
                            <button
                              onClick={() => handleReactivar(presupuesto.presupuestoId, presupuesto.nombrePresupuesto)}
                              className="p-3 text-green-600 hover:text-white hover:bg-green-600 
                                        rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Reactivar presupuesto"
                            >
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            // Botones para presupuestos activos
                            <>
                              <button
                                onClick={() => handleOpenCategoriasModal(presupuesto)}
                                className="p-3 text-purple-600 hover:text-white hover:bg-purple-600 
                                          rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Gestionar categorías"
                              >
                                <ClipboardList size={18} />
                              </button>
                              <button
                                onClick={() => handleEdit(presupuesto)}
                                className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 
                                          rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Editar presupuesto"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDesactivar(presupuesto.presupuestoId, presupuesto.nombrePresupuesto)}
                                className="p-3 text-orange-600 hover:text-white hover:bg-orange-600 
                                          rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Desactivar presupuesto"
                              >
                                <PowerOff size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(presupuesto.presupuestoId, presupuesto.nombrePresupuesto)}
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 
                                      rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 size={18} />
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
      </div>

      {/* Modal de Presupuesto */}
      <PresupuestoModalGlobal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingPresupuesto={editingPresupuesto}
      />

      {/* Modal de Categorías de Presupuesto */}
      <CategoriasPresupuestoModal
        isOpen={showCategoriasModal}
        onClose={handleCloseCategoriasModal}
        presupuesto={selectedPresupuesto}
      />
    </Layout>
  );
};

export default Presupuestos; 