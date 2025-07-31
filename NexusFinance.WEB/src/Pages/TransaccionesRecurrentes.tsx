import React, { useState, useEffect, useCallback } from 'react';
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
  BarChart3
} from 'lucide-react';
import { transaccionRecurrenteService } from '../services/transaccionRecurrenteService';
import { categoriaService } from '../services/categoriaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import { sweetAlert } from '../utils/sweetAlert';
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosTransaccionRecurrente>({
    soloActivas: true,
    soloPendientes: false
  });
  const [tiposTransaccion, setTiposTransaccion] = useState<string[]>([]);
  const [frecuencias, setFrecuencias] = useState<string[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [datosInicialesCargados, setDatosInicialesCargados] = useState(false);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [editingTransaccion, setEditingTransaccion] = useState<TransaccionRecurrente | null>(null);

  const usuario = authService.getUser();

  // Cargar datos iniciales (solo una vez al montar el componente)
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      if (!usuario) return;

      try {
        setLoading(true);
        
        const [
          categoriasData,
          cuentasData,
          tiposData,
          frecuenciasData
        ] = await Promise.all([
          categoriaService.obtenerCategoriasPorUsuario(usuario.usuarioId),
          cuentaService.obtenerCuentasPorUsuario(usuario.usuarioId),
          transaccionRecurrenteService.obtenerTiposTransaccion(),
          transaccionRecurrenteService.obtenerFrecuencias()
        ]);

        setCategorias(categoriasData);
        setCuentas(cuentasData);
        setTiposTransaccion(tiposData);
        setFrecuencias(frecuenciasData);
        setDatosInicialesCargados(true);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        sweetAlert.mostrarError('Error', 'Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    if (usuario?.usuarioId && !datosInicialesCargados) {
      cargarDatosIniciales();
    }
  }, [usuario?.usuarioId, datosInicialesCargados]);

  // Cargar transacciones cuando cambien los filtros o después de cargar datos iniciales
  useEffect(() => {
    const cargarTransacciones = async () => {
      if (!usuario) return;

      try {
        setLoading(true);
        const transaccionesData = await transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(usuario.usuarioId, filtros);
        setTransaccionesRecurrentes(transaccionesData);
      } catch (error) {
        console.error('Error al cargar transacciones:', error);
        sweetAlert.mostrarError('Error', 'Error al cargar las transacciones recurrentes');
      } finally {
        setLoading(false);
      }
    };

    if (datosInicialesCargados && usuario?.usuarioId) {
      cargarTransacciones();
    }
  }, [filtros, datosInicialesCargados, usuario?.usuarioId]);

  const cargarTransacciones = async () => {
    try {
      setLoading(true);
      const usuario = authService.getUser();
      if (!usuario?.usuarioId) {
        console.error('No se pudo obtener el usuario');
        return;
      }

      console.log('🔍 Debug - Cargando transacciones para usuario:', usuario.usuarioId);
      const data = await transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(
        usuario.usuarioId,
        filtros
      );
      
      console.log('🔍 Debug - Transacciones cargadas:', data);
      setTransaccionesRecurrentes(data);
    } catch (error) {
      console.error('Error al cargar transacciones recurrentes:', error);
      sweetAlert.mostrarError('Error', 'Error al cargar las transacciones recurrentes');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      
      const [
        transaccionesData,
        categoriasData,
        cuentasData,
        tiposData,
        frecuenciasData
      ] = await Promise.all([
        transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(usuario.usuarioId, filtros),
        categoriaService.obtenerCategoriasPorUsuario(usuario.usuarioId),
        cuentaService.obtenerCuentasPorUsuario(usuario.usuarioId),
        transaccionRecurrenteService.obtenerTiposTransaccion(),
        transaccionRecurrenteService.obtenerFrecuencias()
      ]);

      setTransaccionesRecurrentes(transaccionesData);
      setCategorias(categoriasData);
      setCuentas(cuentasData);
      setTiposTransaccion(tiposData);
      setFrecuencias(frecuenciasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      sweetAlert.mostrarError('Error', 'Error al cargar las transacciones recurrentes');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para el modal
  const handleOpenModal = (transaccion?: TransaccionRecurrente) => {
    setEditingTransaccion(transaccion || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaccion(null);
  };

  const handleModalSuccess = () => {
    cargarTransacciones();
  };

  const handleEliminar = async (recurrenteId: string) => {
    try {
      const confirmed = await sweetAlert.confirmarAccion(
        '¿Eliminar transacción recurrente?',
        'Esta acción eliminará la transacción recurrente. ¿Deseas continuar?',
        'Sí, eliminar',
        'Cancelar'
      );

      if (confirmed) {
        setLoading(true);
        await transaccionRecurrenteService.eliminarTransaccionRecurrente(recurrenteId);
        sweetAlert.mostrarExito('¡Éxito!', 'Transacción recurrente eliminada exitosamente');
        await cargarTransacciones();
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      sweetAlert.mostrarError('Error', 'Error al eliminar la transacción recurrente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (transaccion: TransaccionRecurrente) => {
    try {
      const actionText = transaccion.estaActivo ? 'desactivar' : 'activar';
      const confirmed = await sweetAlert.confirmarAccion(
        `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} transacción?`,
        `¿Estás seguro de que quieres ${actionText} la transacción recurrente "${transaccion.descripcion}"?`,
        `Sí, ${actionText}`,
        'Cancelar'
      );

      if (confirmed) {
        setLoading(true);
        await transaccionRecurrenteService.actualizarTransaccionRecurrente({
          recurrenteId: transaccion.recurrenteId,
          estaActivo: !transaccion.estaActivo
        });
        
        sweetAlert.mostrarExito(
          '¡Éxito!', 
          transaccion.estaActivo 
            ? 'Transacción recurrente desactivada' 
            : 'Transacción recurrente activada'
        );
        await cargarTransacciones();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      sweetAlert.mostrarError('Error', 'Error al cambiar el estado de la transacción recurrente');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = async (nuevosFiltros: Partial<FiltrosTransaccionRecurrente>) => {
    const filtrosActualizados = { ...filtros, ...nuevosFiltros };
    setFiltros(filtrosActualizados);
    
    // Cargar transacciones con los nuevos filtros
    if (usuario) {
      try {
        setLoading(true);
        const transaccionesData = await transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(usuario.usuarioId, filtrosActualizados);
        setTransaccionesRecurrentes(transaccionesData);
      } catch (error) {
        console.error('Error al aplicar filtros:', error);
        sweetAlert.mostrarError('Error', 'Error al aplicar los filtros');
      } finally {
        setLoading(false);
      }
    }
  };

  const limpiarFiltros = async () => {
    const filtrosLimpios = {
      soloActivas: true,
      soloPendientes: false
    };
    setFiltros(filtrosLimpios);
    
    // Cargar transacciones con filtros limpios
    if (usuario) {
      try {
        setLoading(true);
        const transaccionesData = await transaccionRecurrenteService.obtenerTransaccionesRecurrentesPorUsuario(usuario.usuarioId, filtrosLimpios);
        setTransaccionesRecurrentes(transaccionesData);
      } catch (error) {
        console.error('Error al limpiar filtros:', error);
        sweetAlert.mostrarError('Error', 'Error al limpiar los filtros');
      } finally {
        setLoading(false);
      }
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

  // Calcular estadísticas
  const estadisticas = {
    total: transaccionesRecurrentes.length,
    activas: transaccionesRecurrentes.filter(t => t.estaActivo).length,
    inactivas: transaccionesRecurrentes.filter(t => !t.estaActivo).length,
    proximasEjecuciones: transaccionesRecurrentes.filter(t => {
      const dias = transaccionRecurrenteService.calcularDiasHastaProximaEjecucion(t.proximaFechaEjecucion);
      return dias <= 7 && t.estaActivo;
    }).length
  };

  if (loading && !datosInicialesCargados) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando transacciones recurrentes...</p>
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
                        <Repeat className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold">Transacciones Recurrentes</h1>
                        <p className="text-blue-50 text-lg">Gestiona tus transacciones automáticas</p>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-blue-50 text-sm">Total</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-green-300">{estadisticas.activas}</div>
                        <div className="text-blue-50 text-sm">Activas</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-gray-300">{estadisticas.inactivas}</div>
                        <div className="text-blue-50 text-sm">Inactivas</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-orange-300">{estadisticas.proximasEjecuciones}</div>
                        <div className="text-blue-50 text-sm">Próximas (7 días)</div>
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
                      <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                      >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm">Filtros</span>
                      </button>
                      <button
                        onClick={cargarDatos}
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
        </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Filtros */}
          {mostrarFiltros && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Filtros y Búsqueda
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tipo de transacción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de transacción
                  </label>
                  <select
                    value={filtros.tipoTransaccion || ''}
                    onChange={(e) => aplicarFiltros({ tipoTransaccion: e.target.value || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Todos los tipos</option>
                    {tiposTransaccion.map(tipo => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frecuencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <select
                    value={filtros.frecuencia || ''}
                    onChange={(e) => aplicarFiltros({ frecuencia: e.target.value || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Todas las frecuencias</option>
                    {frecuencias.map(frecuencia => (
                      <option key={frecuencia} value={frecuencia}>
                        {transaccionRecurrenteService.obtenerLabelPorFrecuencia(frecuencia)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Solo activas */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="soloActivas"
                    checked={filtros.soloActivas}
                    onChange={(e) => aplicarFiltros({ soloActivas: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="soloActivas" className="ml-3 block text-sm text-gray-900">
                    Solo activas
                  </label>
                </div>

                {/* Solo pendientes */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="soloPendientes"
                    checked={filtros.soloPendientes}
                    onChange={(e) => aplicarFiltros({ soloPendientes: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="soloPendientes" className="ml-3 block text-sm text-gray-900">
                    Solo pendientes
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
          {loading && datosInicialesCargados && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Actualizando transacciones...</p>
              </div>
            </div>
          )}
          
          {!loading && transaccionesRecurrentes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Repeat className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No hay transacciones recurrentes
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primera transacción recurrente para automatizar tus finanzas.
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear primera transacción recurrente</span>
                  </button>
                </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {transaccionesRecurrentes.map((transaccion) => {
                const categoria = obtenerCategoria(transaccion.categoriaId);
                const cuenta = obtenerCuenta(transaccion.cuentaId);
                const diasHastaEjecucion = transaccionRecurrenteService.calcularDiasHastaProximaEjecucion(transaccion.proximaFechaEjecucion);
                const esProxima = diasHastaEjecucion <= 7 && transaccion.estaActivo;
                
                return (
                  <div key={transaccion.recurrenteId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header de la tarjeta */}
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${transaccionRecurrenteService.obtenerColorPorTipo(transaccion.tipoTransaccion).replace('text-', 'bg-').replace('-600', '-100')}`}>
                            {obtenerIconoTipo(transaccion.tipoTransaccion)}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 truncate max-w-32">
                              {transaccion.descripcion}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {transaccionRecurrenteService.obtenerLabelPorFrecuencia(transaccion.frecuencia)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleActivo(transaccion)}
                            className={`p-2 rounded-lg transition-colors ${
                              transaccion.estaActivo 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={transaccion.estaActivo ? 'Desactivar' : 'Activar'}
                          >
                            {transaccion.estaActivo ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenModal(transaccion)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(transaccion.recurrenteId)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Estado y alerta */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaccion.estaActivo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaccion.estaActivo ? 'Activa' : 'Inactiva'}
                        </span>
                        {esProxima && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Próxima
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido de la tarjeta */}
                    <div className="px-6 py-4 space-y-4">
                      {/* Monto */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Monto:</span>
                        <span className={`text-lg font-bold ${transaccionRecurrenteService.obtenerColorPorTipo(transaccion.tipoTransaccion)}`}>
                          {transaccionRecurrenteService.formatearMonto(transaccion.monto)}
                        </span>
                      </div>

                      {/* Categoría y Cuenta */}
                      <div className="grid grid-cols-2 gap-4">
                        {categoria && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Categoría</span>
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categoria.color }}
                              />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {categoria.nombreCategoria}
                              </span>
                            </div>
                          </div>
                        )}

                        {cuenta && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Cuenta</span>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {cuenta.nombreCuenta}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Próxima ejecución */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Próxima ejecución:</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className={`text-sm font-medium ${
                            esProxima ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {transaccionRecurrenteService.formatearFechaCorta(transaccion.proximaFechaEjecucion)}
                          </span>
                        </div>
                      </div>

                      {/* Días restantes */}
                      {transaccion.estaActivo && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Días restantes:</span>
                          <span className={`text-sm font-medium ${
                            diasHastaEjecucion <= 3 ? 'text-red-600' :
                            diasHastaEjecucion <= 7 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {diasHastaEjecucion} días
                          </span>
                        </div>
                      )}
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