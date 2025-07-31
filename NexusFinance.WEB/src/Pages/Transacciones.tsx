import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import Layout from '../components/Layout';
import TransaccionModalGlobal from '../components/TransaccionModal';
import { transaccionService } from '../services/transaccionService';
import { authService } from '../services/authService';
import type { Transaccion, FiltrosTransaccion } from '../types/transaccion';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Edit, Trash2, Calendar, CreditCard, Tag, RefreshCw, BarChart3 } from 'lucide-react';
import Swal from 'sweetalert2';

const Transacciones: React.FC = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState('Último mes');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [estadisticas, setEstadisticas] = useState({
    totalTransacciones: 0,
    totalIngresos: 0,
    totalGastos: 0,
    balance: 0
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  const userId = authService.getUserId();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      cargarTransacciones();
    }
  }, [userId, periodoFiltro, busquedaTexto, tipoFiltro]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && transacciones.length > 0) {
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
          filtersRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.4, ease: "power2.out" }
        );

        gsap.fromTo(
          tableRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          cardsRef.current,
          { x: -20, opacity: 0 },
          { 
            x: 0, 
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.8,
            ease: "power2.out" 
          }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, transacciones]);

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

  const cargarTransacciones = async () => {
    if (!userId) {
      console.error('❌ No hay userId disponible');
      setError('Usuario no autenticado');
      return;
    }

    // Verificar token
    const token = authService.getToken();
    if (!token) {
      console.error('❌ No hay token de autenticación');
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        authService.logout();
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filtros: FiltrosTransaccion = {
        busquedaTexto: busquedaTexto || undefined,
        tipoTransaccion: tipoFiltro || undefined,
        pagina: 1,
        tamanoPagina: 100,
        ordenarPor: 'fecha_desc'
      };

      // Aplicar filtro de período si no es "Sin filtro"
      if (periodoFiltro !== 'Sin filtro') {
        const { fechaInicio, fechaFin } = transaccionService.obtenerFechasPorPeriodo(periodoFiltro);
        filtros.fechaInicio = fechaInicio.toISOString();
        filtros.fechaFin = fechaFin.toISOString();
      }

      console.log('🔍 Debug - Cargando transacciones con filtros:', filtros);
      
      const transaccionesData = await transaccionService.obtenerTransaccionesPorUsuario(userId, filtros);
      console.log('🔍 Debug - Transacciones obtenidas:', transaccionesData.length);
      console.log('🔍 Debug - Primera transacción:', transaccionesData[0]);
      
      setTransacciones(transaccionesData);
      
      // Calcular estadísticas
      const stats = transaccionService.calcularEstadisticas(transaccionesData);
      setEstadisticas({
        totalTransacciones: stats.totalTransacciones,
        totalIngresos: stats.totalIngresos,
        totalGastos: stats.totalGastos,
        balance: stats.balance
      });

    } catch (err) {
      console.error('Error al cargar transacciones:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTransaccion = () => {
    setTransaccionEditando(null);
    setModalAbierto(true);
  };

  const handleEditarTransaccion = (transaccion: Transaccion) => {
    setTransaccionEditando(transaccion);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setTransaccionEditando(null);
  };

  const handleTransaccionGuardada = () => {
    setSuccess(transaccionEditando ? 'Transacción actualizada exitosamente' : 'Transacción creada exitosamente');
    cargarTransacciones();
  };

  const handleEliminarTransaccion = async (transaccion: Transaccion) => {
    const result = await Swal.fire({
      title: '¿Eliminar transacción?',
      text: `¿Estás seguro de que quieres eliminar la transacción "${transaccion.descripcion || 'Sin descripción'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
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
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando transacción...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await transaccionService.eliminarTransaccion(transaccion.transaccionId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Eliminada!',
          text: 'La transacción ha sido eliminada exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Transacción eliminada exitosamente');
        await cargarTransacciones();
      } catch (err) {
        console.error('Error al eliminar transacción:', err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la transacción. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al eliminar la transacción');
      }
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return <TrendingUp className="w-3 h-3" />;
      case 'gasto':
        return <TrendingDown className="w-3 h-3" />;
      case 'transferencia':
        return <CreditCard className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return 'bg-green-100 text-green-800';
      case 'gasto':
        return 'bg-red-100 text-red-800';
      case 'transferencia':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return 'Ingreso';
      case 'gasto':
        return 'Gasto';
      case 'transferencia':
        return 'Transferencia';
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando transacciones...</p>
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
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Mis Transacciones</h1>
                      <p className="text-blue-50 text-lg">Gestiona tus ingresos, gastos y transferencias</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{estadisticas.totalTransacciones}</div>
                      <div className="text-blue-50 text-sm">Total Transacciones</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">
                        {transaccionService.formatearMonto(estadisticas.totalIngresos)}
                      </div>
                      <div className="text-blue-50 text-sm">Total Ingresos</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-red-300">
                        {transaccionService.formatearMonto(estadisticas.totalGastos)}
                      </div>
                      <div className="text-blue-50 text-sm">Total Gastos</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className={`text-2xl font-bold ${estadisticas.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {transaccionService.formatearMonto(estadisticas.balance)}
                      </div>
                      <div className="text-blue-50 text-sm">Balance</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCrearTransaccion}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Transacción</span>
                  </button>
                  
                  <button
                    onClick={cargarTransacciones}
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
          <div ref={filtersRef} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros y Búsqueda
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={periodoFiltro}
                  onChange={(e) => setPeriodoFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {transaccionService.obtenerPeriodosTransaccion().map(periodo => (
                    <option key={periodo} value={periodo}>
                      {periodo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="gasto">Gastos</option>
                  <option value="transferencia">Transferencias</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={busquedaTexto}
                    onChange={(e) => setBusquedaTexto(e.target.value)}
                    placeholder="Buscar transacciones..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={cargarTransacciones}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Filter className="h-4 w-4 inline mr-2" />
                  Filtrar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Transacciones */}
          <div ref={tableRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {transacciones.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes transacciones registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {periodoFiltro === 'Sin filtro' 
                      ? 'Comienza creando tu primera transacción para gestionar tus finanzas'
                      : 'No hay transacciones en el período seleccionado'
                    }
                  </p>
                  <button
                    onClick={handleCrearTransaccion}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Mi Primera Transacción</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transacciones.map((transaccion, index) => (
                  <div 
                    key={transaccion.transaccionId} 
                    ref={el => {
                      if (el) cardsRef.current[index] = el;
                    }}
                    className="p-6 transition-all duration-200 hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ 
                            backgroundColor: transaccion.color || 
                              (transaccion.tipoTransaccion === 'ingreso' ? '#10b981' : 
                               transaccion.tipoTransaccion === 'gasto' ? '#ef4444' : '#3b82f6') 
                          }}
                        >
                          <span className="text-2xl text-white">
                            {transaccion.iconoCategoria || transaccionService.obtenerIconoPorTipo(transaccion.tipoTransaccion)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {transaccion.descripcion || 'Sin descripción'}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(transaccion.tipoTransaccion)}`}>
                              {getTipoIcon(transaccion.tipoTransaccion)}
                              <span className="ml-1">{getTipoLabel(transaccion.tipoTransaccion)}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {transaccion.nombreCategoria}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {transaccion.nombreCuenta}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {transaccionService.formatearFechaCorta(transaccion.fechaTransaccion)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${transaccionService.obtenerColorPorTipo(transaccion.tipoTransaccion)}`}>
                            {transaccionService.formatearMonto(transaccion.monto)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaccion.moneda || 'COP'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditarTransaccion(transaccion)}
                            className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 
                                      rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Editar transacción"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminarTransaccion(transaccion)}
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 
                                      rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Eliminar transacción"
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

      {/* Modal de Transacción */}
      <TransaccionModalGlobal
        isOpen={modalAbierto}
        onClose={handleCerrarModal}
        onSuccess={handleTransaccionGuardada}
        editingTransaccion={transaccionEditando}
      />
    </Layout>
  );
};

export default Transacciones; 