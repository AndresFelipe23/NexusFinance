import { useState, useEffect, useRef } from 'react';
import Layout from "../components/Layout";
import { gastosViajeService } from '../services/gastosViajeService';
import { categoriasGastosViajeService } from '../services/categoriasGastosViajeService';
import { authService } from '../services/authService';
import type { GastoViaje } from '../types/gastoViaje';
import type { CategoriaGastosViaje } from '../types/categoriaGastosViaje';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, DollarSign, RefreshCw, Filter, Calendar, MapPin, Users, Eye, Edit, Trash2, Grid, List } from 'lucide-react';
import GastoViajeModal from '../components/GastoViajeModal';

export default function GastosViaje() {
  const [gastos, setGastos] = useState<GastoViaje[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGastosViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoViaje | null>(null);

  // El planId debe obtenerse de la URL, localStorage, o un selector de plan
  // Por ahora, no se asigna un valor por defecto inválido
  const [planId, setPlanId] = useState<string | null>(null);

  // Estados para filtros y vista
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroMonto, setFiltroMonto] = useState<string>('');
  const [vistaTabla, setVistaTabla] = useState(true);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    const fetchGastos = async () => {
      if (!planId || !currentUser?.usuarioId || planId === '123e4567-e89b-12d3-a456-426614174000') {
        setLoading(false);
        return;
      }
      try {
        const data = await gastosViajeService.obtenerGastosPorPlan(planId);
        setGastos(data);
      } catch (err) {
        console.error('Error al obtener gastos de viaje:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar gastos.');
      }
      setLoading(false);
    };

    fetchGastos();
  }, [planId, currentUser?.usuarioId]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        console.log('Cargando categorías de gastos de viaje...');
        const data = await categoriasGastosViajeService.obtenerCategorias();
        console.log('Categorías cargadas:', data);
        setCategorias(data);
      } catch (err) {
        console.error('Error al obtener categorías:', err);
        setError(`Error al cargar categorías: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    };

    fetchCategorias();
  }, []);

  const getCategoryName = (id: string) => {
    const categoria = categorias.find(c => c.categoriaViajeId === id);
    return categoria ? categoria.nombreCategoria : 'Sin categoría';
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(gasto => {
    if (filtroCategoria && gasto.categoriaViajeId !== filtroCategoria) return false;
    if (filtroFecha) {
      const fechaGasto = new Date(gasto.fechaGasto).toLocaleDateString();
      if (!fechaGasto.includes(filtroFecha)) return false;
    }
    if (filtroMonto) {
      const monto = gasto.monto.toString();
      if (!monto.includes(filtroMonto)) return false;
    }
    return true;
  });

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && gastos.length > 0) {
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
  }, [loading, gastos]);

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
    if (planId && currentUser?.usuarioId) {
      gastosViajeService.obtenerGastosPorPlan(planId)
        .then(setGastos)
        .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar gastos.'))
        .finally(() => setLoading(false));
    }
  };

  const handleOpenModal = (gasto?: GastoViaje) => {
    // Si no hay planId, usar uno temporal para el modal
    if (!planId) {
      setPlanId('123e4567-e89b-12d3-a456-426614174000');
    }
    setEditingGasto(gasto || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGasto(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingGasto ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente');
    handleRefresh();
  };

  const handleDelete = async (gastoViajeId: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar Gasto',
      text: `¿Estás seguro de que quieres eliminar este gasto? Esta acción es irreversible.`, 
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
          title: 'Eliminando gasto...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await gastosViajeService.eliminarGasto(gastoViajeId);
        
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'El gasto ha sido eliminado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Gasto eliminado exitosamente');
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar el gasto: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar el gasto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };


  // Calcular estadísticas mejoradas
  const estadisticas = {
    total: gastos.length,
    montoTotal: gastos.reduce((sum, gasto) => sum + gasto.monto, 0),
    montoPromedio: gastos.length > 0 ? gastos.reduce((sum, gasto) => sum + gasto.monto, 0) / gastos.length : 0,
    gastoMasAlto: gastos.length > 0 ? Math.max(...gastos.map(g => g.monto)) : 0,
    gastoMasBajo: gastos.length > 0 ? Math.min(...gastos.map(g => g.monto)) : 0,
    totalPersonas: gastos.reduce((sum, gasto) => sum + gasto.numeroPersonas, 0),
    categoriasUnicas: new Set(gastos.map(g => g.categoriaViajeId)).size,
    gastosEsteMes: gastos.filter(g => {
      const fechaGasto = new Date(g.fechaGasto);
      const ahora = new Date();
      return fechaGasto.getMonth() === ahora.getMonth() && fechaGasto.getFullYear() === ahora.getFullYear();
    }).length
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold">Gastos de Viaje</h1>
                        <p className="text-red-50 text-lg">Registra y controla tus gastos durante el viaje</p>
                      </div>
                    </div>
                    
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-red-50 text-sm">Total Gastos</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.montoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-red-50 text-sm">Monto Total</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.montoPromedio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-red-50 text-sm">Promedio</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.gastoMasAlto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-red-50 text-sm">Más Alto</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.categoriasUnicas}</div>
                        <div className="text-red-50 text-sm">Categorías</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.gastosEsteMes}</div>
                        <div className="text-red-50 text-sm">Este Mes</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleOpenModal()}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Nuevo Gasto</span>
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVistaTabla(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          vistaTabla 
                            ? 'bg-white text-red-600 border-white' 
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">Tabla</span>
                      </button>
                      <button
                        onClick={() => setVistaTabla(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          !vistaTabla 
                            ? 'bg-white text-red-600 border-white' 
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                        <span className="text-sm">Tarjetas</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
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

        <div ref={contentRef} className="max-w-7xl mx-auto px-6 py-8">

          {/* Filtros */}
          {gastos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-red-600" />
                  Filtros
                </h3>
                <div className="text-sm text-gray-500">
                  {gastosFiltrados.length} de {gastos.length} gastos
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.length > 0 ? (
                      categorias.map((categoria) => (
                        <option key={categoria.categoriaViajeId} value={categoria.categoriaViajeId}>
                          {categoria.nombreCategoria}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Cargando categorías...</option>
                    )}
                  </select>
                  {categorias.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No hay categorías disponibles</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="text"
                    placeholder="Buscar por fecha..."
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    type="text"
                    placeholder="Buscar por monto..."
                    value={filtroMonto}
                    onChange={(e) => setFiltroMonto(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

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
                <p className="text-gray-600">Cargando gastos...</p>
              </div>
            </div>
          ) : !planId ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecciona un plan de vacaciones
                </h3>
                <p className="text-gray-600 mb-6">
                  Para ver y registrar gastos de viaje, primero debes seleccionar un plan.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => window.location.href = '/planes-vacaciones'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span>Ir a Planes de Vacaciones</span>
                  </button>
                </div>
              </div>
            </div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes gastos de viaje registrados
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza registrando tu primer gasto para este plan de vacaciones.
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Registrar Mi Primer Gasto</span>
                </button>
              </div>
            </div>
          ) : vistaTabla ? (
            // Vista de tabla
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-red-50 to-rose-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Descripción</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monto</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoría</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ubicación</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Personas</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {gastosFiltrados.map((gasto) => (
                      <tr key={gasto.gastoViajeId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{gasto.descripcion}</div>
                            {gasto.notas && (
                              <div className="text-xs text-gray-500 mt-1">{gasto.notas}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {gasto.monto.toLocaleString('es-CO', { style: 'currency', currency: gasto.monedaGasto })}
                          </div>
                          <div className="text-xs text-gray-500">{gasto.monedaGasto}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{new Date(gasto.fechaGasto).toLocaleDateString('es-CO')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {getCategoryName(gasto.categoriaViajeId)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {gasto.ubicacion ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{gasto.ubicacion}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No especificada</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{gasto.numeroPersonas}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(gasto)} 
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar gasto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(gasto.gastoViajeId)} 
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Vista de tarjetas
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gastosFiltrados.map((gasto) => (
                <div key={gasto.gastoViajeId} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{gasto.descripcion}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {getCategoryName(gasto.categoriaViajeId)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {gasto.monto.toLocaleString('es-CO', { style: 'currency', currency: gasto.monedaGasto })}
                        </div>
                        <div className="text-xs text-gray-500">{gasto.monedaGasto}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(gasto.fechaGasto).toLocaleDateString('es-CO')}</span>
                      </div>
                      
                      {gasto.ubicacion && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{gasto.ubicacion}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{gasto.numeroPersonas} persona{gasto.numeroPersonas !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {gasto.notas && (
                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">Notas:</span> {gasto.notas}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleOpenModal(gasto)} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar gasto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(gasto.gastoViajeId)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GastoViajeModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingGasto={editingGasto}
        planId={planId || '123e4567-e89b-12d3-a456-426614174000'}
      />
    </Layout>
  );
}