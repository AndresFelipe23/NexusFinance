import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Target,
  DollarSign,
  Search,
  MoreVertical,
  Play,
  Pause,
  Archive,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Trophy,
  Star,
  Clock,
  BarChart3,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { 
  confirmarEliminacion, 
  confirmarEliminacionPermanente, 
  confirmarCambioEstado, 
  mostrarExito, 
  mostrarError 
} from '../utils/sweetAlert';
import { metaFinancieraService } from '../services/metaFinancieraService';
import { authService } from '../services/authService';
import MetaFinancieraModalGlobal from '../components/MetaFinancieraModalGlobal';
import Layout from '../components/Layout';
import type { MetaFinanciera } from '../types/metaFinanciera';

interface FiltrosState {
  tipo: string;
  soloActivas: boolean;
  ordenarPor: string;
  ordenAscendente: boolean;
  busqueda: string;
  vista: 'grid' | 'list' | 'kanban';
}

const MetasFinancieras: React.FC = () => {
  const [metas, setMetas] = useState<MetaFinanciera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaFinanciera | null>(null);
  const [deletingMeta, setDeletingMeta] = useState<string | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showEstadisticas, setShowEstadisticas] = useState(true);

  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo: '',
    soloActivas: true,
    ordenarPor: 'fecha_objetivo',
    ordenAscendente: true,
    busqueda: '',
    vista: 'grid'
  });

  const cargarMetas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      const metasData = await metaFinancieraService.obtenerMetasPorUsuario(
        usuarioId,
        filtros.tipo || undefined,
        filtros.soloActivas,
        filtros.ordenarPor
      );
      setMetas(metasData);
    } catch (err) {
      setError(`Error al cargar metas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [filtros.tipo, filtros.soloActivas, filtros.ordenarPor]);

  useEffect(() => {
    cargarMetas();
  }, [cargarMetas]);

  const metasFiltradas = useMemo(() => {
    let filtradas = metas;

    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      filtradas = filtradas.filter(meta =>
        meta.nombreMeta.toLowerCase().includes(busqueda) ||
        meta.descripcion?.toLowerCase().includes(busqueda) ||
        meta.tipoMeta.toLowerCase().includes(busqueda)
      );
    }

    // Ordenamiento
    filtradas.sort((a, b) => {
      let valorA: string | number, valorB: string | number;

      switch (filtros.ordenarPor) {
        case 'nombre':
          valorA = a.nombreMeta.toLowerCase();
          valorB = b.nombreMeta.toLowerCase();
          break;
        case 'monto_objetivo':
          valorA = a.montoObjetivo || 0;
          valorB = b.montoObjetivo || 0;
          break;
        case 'monto_actual':
          valorA = a.montoActual || 0;
          valorB = b.montoActual || 0;
          break;
        case 'fecha_objetivo':
          valorA = a.fechaObjetivo ? new Date(a.fechaObjetivo).getTime() : 0;
          valorB = b.fechaObjetivo ? new Date(b.fechaObjetivo).getTime() : 0;
          break;
        case 'progreso':
          valorA = getProgreso(a);
          valorB = getProgreso(b);
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return filtros.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return filtros.ordenAscendente ? 1 : -1;
      return 0;
    });

    return filtradas;
  }, [metas, filtros.busqueda, filtros.ordenarPor, filtros.ordenAscendente]);

  const handleOpenModal = useCallback((meta?: MetaFinanciera) => {
    setEditingMeta(meta || null);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingMeta(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    cargarMetas();
    handleCloseModal();
  }, [cargarMetas, handleCloseModal]);

  const handleEliminarMeta = useCallback(async (metaId: string) => {
    const meta = metas.find(m => m.metaId === metaId);
    
    const confirmed = await confirmarEliminacion(
      '¿Eliminar meta?',
      `¿Estás seguro de que quieres eliminar la meta "${meta?.nombreMeta}"?`
    );

    if (confirmed) {
      try {
        setDeletingMeta(metaId);
        await metaFinancieraService.eliminarMeta(metaId, false);
        await cargarMetas();
        
        mostrarExito('¡Eliminada!', 'La meta ha sido eliminada exitosamente.');
      } catch (err) {
        setError(`Error al eliminar la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        mostrarError('Error', 'No se pudo eliminar la meta. Inténtalo de nuevo.');
      } finally {
        setDeletingMeta(null);
      }
    }
  }, [metas, cargarMetas]);

  const handleEliminarPermanente = useCallback(async (metaId: string) => {
    const meta = metas.find(m => m.metaId === metaId);
    
    const confirmed = await confirmarEliminacionPermanente(
      '⚠️ Eliminación Permanente',
      meta?.nombreMeta || ''
    );

    if (confirmed) {
      try {
        setDeletingMeta(metaId);
        await metaFinancieraService.eliminarMeta(metaId, true);
        await cargarMetas();
        
        mostrarExito('¡Eliminada permanentemente!', 'La meta ha sido eliminada de forma permanente.');
      } catch (err) {
        setError(`Error al eliminar la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        mostrarError('Error', 'No se pudo eliminar la meta. Inténtalo de nuevo.');
      } finally {
        setDeletingMeta(null);
      }
    }
  }, [metas, cargarMetas]);

  const handleActivarInactivar = useCallback(async (metaId: string, estaCompletada: boolean) => {
    const meta = metas.find(m => m.metaId === metaId);
    const actionText = estaCompletada ? 'activar' : 'pausar';
    
    const confirmed = await confirmarCambioEstado(
      meta?.nombreMeta || '',
      !estaCompletada
    );

    if (confirmed) {
      try {
        setDeletingMeta(metaId);
        await metaFinancieraService.actualizarEstadoMeta(metaId, !estaCompletada);
        await cargarMetas();
        
        mostrarExito(
          '¡Actualizada!',
          `La meta ha sido ${actionText === 'activar' ? 'activada' : 'pausada'} exitosamente.`
        );
      } catch (err) {
        setError(`Error al ${actionText} la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        mostrarError('Error', `No se pudo ${actionText} la meta. Inténtalo de nuevo.`);
      } finally {
        setDeletingMeta(null);
      }
    }
  }, [metas, cargarMetas]);

  const getProgreso = useCallback((meta: MetaFinanciera) => {
    if (!meta.montoObjetivo || meta.montoObjetivo <= 0 || !meta.montoActual || meta.montoActual < 0) return 0;
    return Math.min(100, Math.round((meta.montoActual / meta.montoObjetivo) * 100));
  }, []);

  const getDiasRestantes = useCallback((fechaObjetivo: string) => {
    if (!fechaObjetivo) return null;
    const hoy = new Date();
    const objetivo = new Date(fechaObjetivo);
    const diff = objetivo.getTime() - hoy.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias;
  }, []);

  const getTipoMetaInfo = useCallback((tipo: string) => {
    const tipos = {
      'ahorro': { 
        label: 'Ahorro', 
        color: 'bg-gradient-to-r from-green-500 to-emerald-500', 
        icon: '💰',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'pago_deuda': { 
        label: 'Pago de Deuda', 
        color: 'bg-gradient-to-r from-red-500 to-pink-500', 
        icon: '💳',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      'inversion': { 
        label: 'Inversión', 
        color: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
        icon: '📈',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    };
    return tipos[tipo as keyof typeof tipos] || { 
      label: tipo, 
      color: 'bg-gradient-to-r from-gray-500 to-slate-500', 
      icon: '🎯',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  }, []);

  const getEstadoInfo = useCallback((meta: MetaFinanciera) => {
    const diasRestantes = getDiasRestantes(meta.fechaObjetivo || '');
    const progreso = getProgreso(meta);
    
    if (meta.estaCompletada) {
      return {
        label: 'Completada',
        icon: <Trophy className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        badge: 'success'
      };
    }
    
    if (diasRestantes !== null && diasRestantes < 0) {
      return {
        label: 'Vencida',
        icon: <XCircle className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        badge: 'danger'
      };
    }
    
    if (diasRestantes !== null && diasRestantes <= 7) {
      return {
        label: 'Próxima a vencer',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-300',
        badge: 'warning'
      };
    }
    
    if (progreso >= 75) {
      return {
        label: 'Excelente progreso',
        icon: <Star className="w-4 h-4" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
        badge: 'excellent'
      };
    }
    
    return {
      label: 'En progreso',
      icon: <Clock className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      badge: 'progress'
    };
  }, [getDiasRestantes, getProgreso]);

  const estadisticas = useMemo(() => {
    const total = metasFiltradas.length;
    const completadas = metasFiltradas.filter(m => m.estaCompletada).length;
    const enProgreso = total - completadas;
    const vencidas = metasFiltradas.filter(m => {
      const dias = getDiasRestantes(m.fechaObjetivo || '');
      return dias !== null && dias < 0 && !m.estaCompletada;
    }).length;
    const montoTotalObjetivo = metasFiltradas.reduce((sum, m) => sum + (m.montoObjetivo || 0), 0);
    const montoTotalActual = metasFiltradas.reduce((sum, m) => sum + (m.montoActual || 0), 0);
    const progresoGeneral = montoTotalObjetivo > 0 ? Math.round((montoTotalActual / montoTotalObjetivo) * 100) : 0;

    return { 
      total, 
      completadas, 
      enProgreso, 
      vencidas,
      montoTotalObjetivo, 
      montoTotalActual, 
      progresoGeneral 
    };
  }, [metasFiltradas, getDiasRestantes]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      tipo: '',
      soloActivas: true,
      ordenarPor: 'fecha_objetivo',
      ordenAscendente: true,
      busqueda: '',
      vista: 'grid'
    });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 mt-4 text-lg">Cargando tus metas financieras...</p>
            <p className="text-gray-400 text-sm">Preparando tu dashboard personal</p>
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
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Target className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Metas Financieras</h1>
                      <p className="text-blue-100 text-lg">Transforma tus sueños en realidad</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{estadisticas.total}</div>
                      <div className="text-blue-100 text-sm">Total Metas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">{estadisticas.completadas}</div>
                      <div className="text-blue-100 text-sm">Completadas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-yellow-300">{estadisticas.enProgreso}</div>
                      <div className="text-blue-100 text-sm">En Progreso</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{estadisticas.progresoGeneral}%</div>
                      <div className="text-blue-100 text-sm">Progreso General</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Meta</span>
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEstadisticas(!showEstadisticas)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Estadísticas</span>
                    </button>
                    <button
                      onClick={() => setShowFiltros(!showFiltros)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      <FilterIcon className="w-4 h-4" />
                      <span className="text-sm">Filtros</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Mostrar error si existe */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Filtros Avanzados */}
          {showFiltros && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FilterIcon className="w-5 h-5 text-blue-600" />
                  Filtros y Ordenamiento
                </h3>
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpiar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar metas..."
                      value={filtros.busqueda}
                      onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tipo de meta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="ahorro">Ahorro</option>
                    <option value="pago_deuda">Pago de Deuda</option>
                    <option value="inversion">Inversión</option>
                  </select>
                </div>

                {/* Ordenar por */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                  <select
                    value={filtros.ordenarPor}
                    onChange={(e) => setFiltros(prev => ({ ...prev, ordenarPor: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fecha_objetivo">Fecha objetivo</option>
                    <option value="nombre">Nombre</option>
                    <option value="monto_objetivo">Monto objetivo</option>
                    <option value="monto_actual">Monto actual</option>
                    <option value="progreso">Progreso</option>
                  </select>
                </div>

                {/* Dirección del orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orden</label>
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, ordenAscendente: !prev.ordenAscendente }))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {filtros.ordenAscendente ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    <span>{filtros.ordenAscendente ? 'Ascendente' : 'Descendente'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vista de Metas */}
          {metasFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {metas.length === 0 ? 'No tienes metas financieras' : 'No se encontraron metas'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {metas.length === 0 
                    ? 'Comienza creando tu primera meta para alcanzar tus objetivos financieros' 
                    : 'Intenta ajustar los filtros o crear una nueva meta'
                  }
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Mi Primera Meta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {metasFiltradas.map(meta => {
                if (!meta || !meta.metaId || !meta.nombreMeta) return null;
                
                const progreso = getProgreso(meta);
                const isDeleting = deletingMeta === meta.metaId;
                const diasRestantes = getDiasRestantes(meta.fechaObjetivo || '');
                const tipoInfo = getTipoMetaInfo(meta.tipoMeta || '');
                const estadoInfo = getEstadoInfo(meta);
                
                return (
                  <div 
                    key={meta.metaId} 
                    className="group bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${tipoInfo.bgColor}`}>
                              <span className="text-xl">{tipoInfo.icon}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {meta.nombreMeta}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.bgColor} ${estadoInfo.color}`}>
                                  {estadoInfo.icon}
                                  {estadoInfo.label}
                                </span>
                                {meta.fechaObjetivo && (
                                  <span className="text-xs text-gray-500">
                                    🎯 {new Date(meta.fechaObjetivo).toLocaleDateString()}
                                    {diasRestantes !== null && !meta.estaCompletada && (
                                      <span className={`ml-1 ${diasRestantes < 0 ? 'text-red-500' : diasRestantes <= 7 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        ({diasRestantes > 0 ? `${diasRestantes} días` : diasRestantes === 0 ? 'Hoy' : `${Math.abs(diasRestantes)} días atrás`})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {meta.descripcion && (
                            <p className="text-gray-600 text-sm line-clamp-2">{meta.descripcion}</p>
                          )}
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(meta)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar meta"
                            disabled={isDeleting}
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <div className="relative group/actions">
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Más opciones"
                              disabled={isDeleting}
                            >
                              <MoreVertical size={16} />
                            </button>
                            
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all duration-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleActivarInactivar(meta.metaId, meta.estaCompletada || false)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  disabled={isDeleting}
                                >
                                  {meta.estaCompletada ? (
                                    <>
                                      <Play size={16} className="mr-2 text-green-600" />
                                      Reactivar meta
                                    </>
                                  ) : (
                                    <>
                                      <Pause size={16} className="mr-2 text-yellow-600" />
                                      Pausar meta
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleEliminarMeta(meta.metaId)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  disabled={isDeleting}
                                >
                                  <Archive size={16} className="mr-2 text-orange-600" />
                                  Marcar como completada
                                </button>
                                
                                <div className="border-t border-gray-200 my-1"></div>
                                
                                <button
                                  onClick={() => handleEliminarPermanente(meta.metaId)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  disabled={isDeleting}
                                >
                                  <AlertTriangle size={16} className="mr-2" />
                                  Eliminar permanentemente
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progreso */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progreso</span>
                          <span className="text-sm font-bold text-gray-900">{progreso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              progreso === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                              progreso >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                              progreso >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>

                      {/* Montos */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Objetivo</span>
                          </div>
                          <div className="text-xl font-bold text-green-800">
                            ${meta.montoObjetivo?.toLocaleString() ?? 0}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Actual</span>
                          </div>
                          <div className="text-xl font-bold text-blue-800">
                            ${meta.montoActual?.toLocaleString() ?? 0}
                          </div>
                        </div>
                      </div>

                      {/* Faltante */}
                      {progreso < 100 && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-700">Te faltan</span>
                            <span className="text-lg font-bold text-purple-800">
                              ${(meta.montoObjetivo - (meta.montoActual || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <MetaFinancieraModalGlobal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editingMeta={editingMeta}
        />
      </div>
    </Layout>
  );
};

export default MetasFinancieras; 