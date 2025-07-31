import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Filter, 
  Plus, 
  Repeat, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Search,
  SortDesc,
  Eye,
  Target,
  Zap,
  Settings
} from 'lucide-react';
import { gsap } from 'gsap';
import { transaccionRecurrenteService } from '../services/transaccionRecurrenteService';
import { categoriaService } from '../services/categoriaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import { mostrarAlerta } from '../utils/sweetalert2Config';
import Layout from '../components/Layout';
import TransaccionRecurrenteModal from '../components/TransaccionRecurrenteModal';
import type { 
  TransaccionRecurrente, 
  FiltrosTransaccionRecurrente 
} from '../types/transaccionRecurrente';
import type { Categoria } from '../types/categoria';
import type { Cuenta } from '../types/cuenta';

const TransaccionesRecurrentes: React.FC = () => {
  const [transaccionesRecurrentes, setTransaccionesRecurrentes] = useState<TransaccionRecurrente[]>([]);
  const [transaccionesFiltradas, setTransaccionesFiltradas] = useState<TransaccionRecurrente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'monto' | 'nombre' | 'frecuencia'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filtros, setFiltros] = useState<FiltrosTransaccionRecurrente>({
    soloActivas: true,
    soloPendientes: false
  });
  const [vistaActual, setVistaActual] = useState<'cards' | 'table'>('cards');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState<TransaccionRecurrente | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const usuario = authService.getUser();

  useEffect(() => {
    if (usuario?.usuarioId) {
      cargarDatos();
    }
  }, [usuario?.usuarioId, filtros]);

  useEffect(() => {
    filtrarYOrdenarTransacciones();
  }, [searchTerm, sortBy, sortOrder, transaccionesRecurrentes]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && transaccionesRecurrentes.length > 0) {
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
          cardsRef.current?.children || [],
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.05,
            delay: 0.4,
            ease: "power2.out"
          }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, transaccionesRecurrentes.length]);

  const cargarDatos = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      
      const [
        transaccionesData,
        categoriasData,
        cuentasData
      ] = await Promise.all([
        transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(usuario.usuarioId, filtros),
        categoriaService.obtenerCategoriasPorUsuario(usuario.usuarioId),
        cuentaService.obtenerCuentasPorUsuario(usuario.usuarioId)
      ]);

      setTransaccionesRecurrentes(transaccionesData);
      setCategorias(categoriasData);
      setCuentas(cuentasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta.error('Error', 'Error al cargar las transacciones recurrentes');
    } finally {
      setLoading(false);
    }
  };

  const filtrarYOrdenarTransacciones = () => {
    let resultado = [...transaccionesRecurrentes];

    // Filtrar por búsqueda
    if (searchTerm) {
      resultado = resultado.filter(t => 
        t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obtenerCategoria(t.categoriaId)?.nombreCategoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obtenerCuenta(t.cuentaId)?.nombreCuenta.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'fecha':
          valueA = new Date(a.proximaFechaEjecucion);
          valueB = new Date(b.proximaFechaEjecucion);
          break;
        case 'monto':
          valueA = a.monto;
          valueB = b.monto;
          break;
        case 'nombre':
          valueA = a.descripcion.toLowerCase();
          valueB = b.descripcion.toLowerCase();
          break;
        case 'frecuencia':
          valueA = a.frecuencia;
          valueB = b.frecuencia;
          break;
        default:
          valueA = a.fechaCreacion;
          valueB = b.fechaCreacion;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setTransaccionesFiltradas(resultado);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleOpenModal = (transaccion?: TransaccionRecurrente) => {
    setEditingTransaccion(transaccion || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaccion(null);
  };

  const handleModalSuccess = () => {
    cargarDatos();
  };

  const handleEliminar = async (recurrenteId: string, descripcion: string) => {
    try {
      const result = await mostrarAlerta.confirmacion(
        '¿Eliminar transacción recurrente?',
        `¿Estás seguro de que quieres eliminar "${descripcion}"? Esta acción no se puede deshacer.`,
        'Sí, eliminar',
        'Cancelar'
      );

      if (result.isConfirmed) {
        setLoading(true);
        await transaccionRecurrenteService.eliminarTransaccionRecurrente(recurrenteId);
        mostrarAlerta.exito('¡Eliminada!', 'Transacción recurrente eliminada exitosamente');
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      mostrarAlerta.error('Error', 'Error al eliminar la transacción recurrente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (transaccion: TransaccionRecurrente) => {
    try {
      const actionText = transaccion.estaActivo ? 'desactivar' : 'activar';
      const result = await mostrarAlerta.confirmacion(
        `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} transacción?`,
        `¿Estás seguro de que quieres ${actionText} "${transaccion.descripcion}"?`,
        `Sí, ${actionText}`,
        'Cancelar'
      );

      if (result.isConfirmed) {
        setLoading(true);
        await transaccionRecurrenteService.actualizarTransaccionRecurrente({
          recurrenteId: transaccion.recurrenteId,
          estaActivo: !transaccion.estaActivo
        });
        
        mostrarAlerta.exito(
          '¡Actualizada!', 
          `Transacción recurrente ${transaccion.estaActivo ? 'desactivada' : 'activada'}`
        );
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      mostrarAlerta.error('Error', 'Error al cambiar el estado de la transacción recurrente');
    } finally {
      setLoading(false);
    }
  };

  const obtenerCategoria = (categoriaId: string) => {
    return categorias.find(c => c.categoriaId === categoriaId);
  };

  const obtenerCuenta = (cuentaId: string) => {
    return cuentas.find(c => c.cuentaId === cuentaId);
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return <TrendingUp className="h-4 w-4" />;
      case 'gasto':
        return <TrendingDown className="h-4 w-4" />;
      case 'transferencia':
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Calcular estadísticas mejoradas
  const estadisticas = {
    total: transaccionesRecurrentes.length,
    activas: transaccionesRecurrentes.filter(t => t.estaActivo).length,
    inactivas: transaccionesRecurrentes.filter(t => !t.estaActivo).length,
    proximasEjecuciones: transaccionesRecurrentes.filter(t => {
      const dias = transaccionRecurrenteService.calcularDiasHastaProximaEjecucion(t.proximaFechaEjecucion);
      return dias <= 7 && t.estaActivo;
    }).length,
    montoMensualEstimado: transaccionesRecurrentes
      .filter(t => t.estaActivo)
      .reduce((total, t) => {
        const multiplicador = transaccionRecurrenteService.obtenerMultiplicadorMensual(t.frecuencia);
        return total + (t.monto * multiplicador);
      }, 0),
    ingresosMensuales: transaccionesRecurrentes
      .filter(t => t.estaActivo && t.tipoTransaccion === 'ingreso')
      .reduce((total, t) => {
        const multiplicador = transaccionRecurrenteService.obtenerMultiplicadorMensual(t.frecuencia);
        return total + (t.monto * multiplicador);
      }, 0),
    gastosMensuales: transaccionesRecurrentes
      .filter(t => t.estaActivo && t.tipoTransaccion === 'gasto')
      .reduce((total, t) => {
        const multiplicador = transaccionRecurrenteService.obtenerMultiplicadorMensual(t.frecuencia);
        return total + (t.monto * multiplicador);
      }, 0)
  };

  if (loading && transaccionesRecurrentes.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando transacciones recurrentes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header mejorado */}
        <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Repeat className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Transacciones Recurrentes</h1>
                      <p className="text-blue-50 text-lg">Automatiza tu gestión financiera</p>
                    </div>
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{estadisticas.total}</div>
                      <div className="text-blue-50 text-sm">Total</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">{estadisticas.activas}</div>
                      <div className="text-blue-50 text-sm">Activas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-orange-300">{estadisticas.proximasEjecuciones}</div>
                      <div className="text-blue-50 text-sm">Próximas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-lg font-bold text-green-300">
                        {transaccionRecurrenteService.formatearMonto(estadisticas.ingresosMensuales)}
                      </div>
                      <div className="text-blue-50 text-sm">Ingresos/mes</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-lg font-bold text-red-300">
                        {transaccionRecurrenteService.formatearMonto(estadisticas.gastosMensuales)}
                      </div>
                      <div className="text-blue-50 text-sm">Gastos/mes</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className={`text-lg font-bold ${
                        (estadisticas.ingresosMensuales - estadisticas.gastosMensuales) >= 0 
                          ? 'text-green-300' 
                          : 'text-red-300'
                      }`}>
                        {transaccionRecurrenteService.formatearMonto(estadisticas.ingresosMensuales - estadisticas.gastosMensuales)}
                      </div>
                      <div className="text-blue-50 text-sm">Balance/mes</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Recurrente</span>
                  </button>
                  
                  <div className="flex gap-2">
                    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                      <button
                        onClick={() => setVistaActual('cards')}
                        className={`px-3 py-2 text-sm transition-colors ${
                          vistaActual === 'cards' 
                            ? 'bg-white/20 text-white' 
                            : 'text-blue-100 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                          <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                          <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                          <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                          <div className="bg-current w-1.5 h-1.5 rounded-sm"></div>
                        </div>
                      </button>
                      <button
                        onClick={() => setVistaActual('table')}
                        className={`px-3 py-2 text-sm transition-colors ${
                          vistaActual === 'table' 
                            ? 'bg-white/20 text-white' 
                            : 'text-blue-100 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                      className={`px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors ${
                        mostrarFiltros ? 'bg-white/20' : ''
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cargarDatos}
                      disabled={loading}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Barra de búsqueda y controles */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Controles de ordenamiento */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <div className="flex items-center gap-1">
                  {[
                    { key: 'fecha' as const, label: 'Fecha' },
                    { key: 'monto' as const, label: 'Monto' },
                    { key: 'nombre' as const, label: 'Nombre' },
                    { key: 'frecuencia' as const, label: 'Frecuencia' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        sortBy === key
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {sortBy === key && (
                          <SortDesc className={`h-3 w-3 transition-transform ${
                            sortOrder === 'asc' ? 'rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {mostrarFiltros && (
          <div className="bg-white border-b border-gray-200 mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="soloActivas"
                    checked={filtros.soloActivas}
                    onChange={(e) => setFiltros({...filtros, soloActivas: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="soloActivas" className="ml-3 block text-sm text-gray-900">
                    Solo transacciones activas
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="soloPendientes"
                    checked={filtros.soloPendientes}
                    onChange={(e) => setFiltros({...filtros, soloPendientes: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="soloPendientes" className="ml-3 block text-sm text-gray-900">
                    Solo próximas a ejecutar
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {loading && transaccionesRecurrentes.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Actualizando...</p>
              </div>
            </div>
          )}
          
          {!loading && transaccionesFiltradas.length === 0 && transaccionesRecurrentes.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Repeat className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Automatiza tus finanzas!
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Las transacciones recurrentes te ayudan a mantener un control automático de tus ingresos y gastos regulares.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear primera transacción recurrente
              </button>
            </div>
          ) : !loading && transaccionesFiltradas.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin resultados
              </h3>
              <p className="text-gray-500 mb-6">
                No se encontraron transacciones que coincidan con "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {transaccionesFiltradas.map((transaccion) => {
                const categoria = obtenerCategoria(transaccion.categoriaId);
                const cuenta = obtenerCuenta(transaccion.cuentaId);
                const diasHastaEjecucion = transaccionRecurrenteService.calcularDiasHastaProximaEjecucion(transaccion.proximaFechaEjecucion);
                const esProxima = diasHastaEjecucion <= 7 && transaccion.estaActivo;
                const esUrgente = diasHastaEjecucion <= 3 && transaccion.estaActivo;
                
                return (
                  <div 
                    key={transaccion.recurrenteId} 
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${
                      esUrgente ? 'ring-2 ring-red-200' : esProxima ? 'ring-2 ring-orange-200' : ''
                    }`}
                  >
                    {/* Header mejorado */}
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2.5 rounded-xl ${
                            transaccion.tipoTransaccion === 'ingreso' 
                              ? 'bg-green-100 text-green-600' 
                              : transaccion.tipoTransaccion === 'gasto'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {obtenerIconoTipo(transaccion.tipoTransaccion)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate max-w-36">
                              {transaccion.descripcion}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Repeat className="h-3 w-3 mr-1" />
                                {transaccionRecurrenteService.obtenerLabelPorFrecuencia(transaccion.frecuencia)}
                              </span>
                              {esUrgente && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Urgente
                                </span>
                              )}
                              {esProxima && !esUrgente && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Próxima
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Acciones mejoradas */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleActivo(transaccion)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              transaccion.estaActivo 
                                ? 'text-green-600 hover:bg-green-50 hover:scale-110' 
                                : 'text-gray-400 hover:bg-gray-50 hover:scale-110'
                            }`}
                            title={transaccion.estaActivo ? 'Desactivar' : 'Activar'}
                          >
                            {transaccion.estaActivo ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(transaccion)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-110"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(transaccion.recurrenteId, transaccion.descripcion)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Contenido mejorado */}
                    <div className="px-6 py-5 space-y-4">
                      {/* Monto destacado */}
                      <div className="text-center py-3">
                        <p className="text-sm text-gray-500 mb-1">Monto por ejecución</p>
                        <p className={`text-2xl font-bold ${
                          transaccion.tipoTransaccion === 'ingreso' ? 'text-green-600' :
                          transaccion.tipoTransaccion === 'gasto' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {transaccionRecurrenteService.formatearMonto(transaccion.monto)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ~{transaccionRecurrenteService.formatearMonto(
                            transaccion.monto * transaccionRecurrenteService.obtenerMultiplicadorMensual(transaccion.frecuencia)
                          )} mensuales
                        </p>
                      </div>

                      {/* Información de categoría y cuenta */}
                      <div className="grid grid-cols-1 gap-3">
                        {categoria && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoria.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Categoría</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {categoria.nombreCategoria}
                              </p>
                            </div>
                          </div>
                        )}

                        {cuenta && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Cuenta</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {cuenta.nombreCuenta}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Información de ejecución mejorada */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-gray-500">Próxima ejecución</p>
                            <p className={`font-medium ${esProxima ? 'text-orange-600' : 'text-gray-900'}`}>
                              {transaccionRecurrenteService.formatearFechaCorta(transaccion.proximaFechaEjecucion)}
                            </p>
                          </div>
                          {transaccion.estaActivo && (
                            <div className="text-right">
                              <p className="text-gray-500">Faltan</p>
                              <p className={`font-bold ${
                                diasHastaEjecucion <= 3 ? 'text-red-600' :
                                diasHastaEjecucion <= 7 ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {diasHastaEjecucion} días
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estado mejorado */}
                      <div className="flex items-center justify-center pt-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          transaccion.estaActivo 
                            ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20' 
                            : 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20'
                        }`}>
                          {transaccion.estaActivo ? (
                            <>
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                              Activa
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5" />
                              Pausada
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <TransaccionRecurrenteModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingTransaccion={editingTransaccion}
      />
    </Layout>
  );
};

export default TransaccionesRecurrentes;