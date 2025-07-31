import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, ArrowRight, Calendar, DollarSign, TrendingUp, RefreshCw, ArrowUpDown, Filter, Clock, CreditCard } from 'lucide-react';
import { gsap } from 'gsap';
import { transferenciaService } from '../services/transferenciaService';
import type { Transferencia } from '../types/transferencia';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import TransferenciaModalGlobal from '../components/TransferenciaModalGlobal';
import Swal from 'sweetalert2';

const Transferencias: React.FC = () => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('Sin filtro');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransferencia, setEditingTransferencia] = useState<Transferencia | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cargarTransferencias();
  }, [periodoFiltro]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && transferencias.length > 0) {
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
  }, [loading, transferencias]);

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

  const cargarTransferencias = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Debug: Verificar autenticación
      const token = authService.getToken();
      const userId = authService.getUserId();
      console.log('🔍 Debug - Token:', token ? 'Presente' : 'Ausente');
      console.log('🔍 Debug - UserId:', userId);
      
      if (!userId) {
        console.error('❌ No se encontró userId');
        setError('Usuario no autenticado');
        return;
      }

      let transferenciasData: Transferencia[] = [];

      try {
        console.log('🔍 Debug - Período filtro:', periodoFiltro);
        
        if (periodoFiltro === 'Personalizado') {
          // Para personalizado, usar el período por defecto (último mes)
          const { fechaInicio, fechaFin } = transferenciaService.obtenerFechasPorPeriodo('Último mes');
          console.log('🔍 Debug - Fechas personalizado:', { fechaInicio, fechaFin });
          transferenciasData = await transferenciaService.obtenerTransferenciasPorPeriodo(
            userId, 
            fechaInicio.toISOString(), 
            fechaFin.toISOString()
          );
        } else if (periodoFiltro === 'Sin filtro') {
          // Probar sin filtro de fechas - obtener todas las transferencias
          console.log('🔍 Debug - Obteniendo todas las transferencias sin filtro de fechas');
          transferenciasData = await transferenciaService.obtenerTransferenciasPorUsuario(userId);
        } else {
          const { fechaInicio, fechaFin } = transferenciaService.obtenerFechasPorPeriodo(periodoFiltro);
          console.log('🔍 Debug - Fechas período:', { fechaInicio, fechaFin });
          console.log('🔍 Debug - Fechas ISO:', { 
            fechaInicioISO: fechaInicio.toISOString(), 
            fechaFinISO: fechaFin.toISOString() 
          });
          console.log('🔍 Debug - Fechas locales:', { 
            fechaInicioLocal: fechaInicio.toLocaleString('es-CO'), 
            fechaFinLocal: fechaFin.toLocaleString('es-CO') 
          });
          transferenciasData = await transferenciaService.obtenerTransferenciasPorPeriodo(
            userId, 
            fechaInicio.toISOString(), 
            fechaFin.toISOString()
          );
        }
        
        console.log('📊 Transferencias obtenidas:', transferenciasData);
        console.log('📊 Tipo de datos:', typeof transferenciasData);
        console.log('📊 Es array:', Array.isArray(transferenciasData));
        
        if (Array.isArray(transferenciasData)) {
          setTransferencias(transferenciasData);
          console.log('✅ Transferencias establecidas en el estado');
        } else {
          console.warn('⚠️ Los datos no son un array:', transferenciasData);
          setTransferencias([]);
        }
      } catch (apiError) {
        console.error('❌ Error en la llamada a la API:', apiError);
        throw apiError;
      }
    } catch (err) {
      console.error('Error al cargar transferencias:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar las transferencias: ${errorMessage}`);
      setTransferencias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (transferencia?: Transferencia) => {
    setEditingTransferencia(transferencia || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransferencia(null);
  };

  const handleModalSuccess = () => {
    cargarTransferencias();
    setSuccess(`Transferencia ${editingTransferencia ? 'actualizada' : 'creada'} exitosamente`);
  };

  const handleDelete = async (transferenciaId: string, descripcion: string) => {
    const result = await Swal.fire({
      title: '⚠️ Eliminación de transferencia',
      text: `¿Estás seguro de que quieres eliminar la transferencia "${descripcion || 'sin descripción'}"? Esta acción revertirá los saldos de las cuentas.`,
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
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando transferencia...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await transferenciaService.eliminarTransferencia(transferenciaId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Eliminada!',
          text: 'La transferencia ha sido eliminada exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Transferencia eliminada exitosamente');
        cargarTransferencias();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la transferencia. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al eliminar la transferencia');
      }
    }
  };

  const getTipoCuentaIcon = (tipo: string) => {
    const iconClass = "w-4 h-4";
    switch (tipo) {
      case 'Cuenta Corriente':
        return <CreditCard className={iconClass} />;
      case 'Cuenta de Ahorros':
        return <DollarSign className={iconClass} />;
      case 'Cuenta de Inversión':
        return <TrendingUp className={iconClass} />;
      case 'Tarjeta de Crédito':
        return <CreditCard className={iconClass} />;
      case 'Efectivo':
        return <DollarSign className={iconClass} />;
      case 'Criptomonedas':
        return <TrendingUp className={iconClass} />;
      default:
        return <CreditCard className={iconClass} />;
    }
  };

  const getTipoCuentaColor = (tipo: string) => {
    switch (tipo) {
      case 'Cuenta Corriente':
        return 'bg-blue-100 text-blue-600';
      case 'Cuenta de Ahorros':
        return 'bg-green-100 text-green-600';
      case 'Cuenta de Inversión':
        return 'bg-purple-100 text-purple-600';
      case 'Tarjeta de Crédito':
        return 'bg-orange-100 text-orange-600';
      case 'Efectivo':
        return 'bg-gray-100 text-gray-600';
      case 'Criptomonedas':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-indigo-100 text-indigo-600';
    }
  };

  const totalTransferido = transferencias.reduce((total, transferencia) => total + (transferencia.monto || 0), 0);
  const totalComisiones = transferencias.reduce((total, transferencia) => total + (transferencia.comisionTransferencia || 0), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando transferencias...</p>
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
                      <ArrowUpDown className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Mis Transferencias</h1>
                      <p className="text-blue-50 text-lg">Gestiona todas tus transferencias entre cuentas</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{transferencias.length}</div>
                      <div className="text-blue-50 text-sm">Total de Transferencias</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">
                        {transferenciaService.formatearMonto(totalTransferido)}
                      </div>
                      <div className="text-blue-50 text-sm">Monto Total Transferido</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-yellow-300">
                        {transferenciaService.formatearMonto(totalComisiones)}
                      </div>
                      <div className="text-blue-50 text-sm">Total Comisiones</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Transferencia</span>
                  </button>
                  
                  <button
                    onClick={cargarTransferencias}
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
                <Filter className="w-5 h-5 text-blue-600" />
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
                  {transferenciaService.obtenerPeriodosTransferencia().map(periodo => (
                    <option key={periodo} value={periodo}>
                      {periodo}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setPeriodoFiltro('Sin filtro')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Sin Filtro
                </button>
                <button
                  onClick={() => setPeriodoFiltro('Último año')}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  Último Año
                </button>
                <button
                  onClick={() => setPeriodoFiltro('Último mes')}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                >
                  Último Mes
                </button>
              </div>
              
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Mostrando transferencias del período seleccionado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Transferencias */}
          <div ref={tableRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {transferencias.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ArrowUpDown className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes transferencias registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primera transferencia entre cuentas
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Mi Primera Transferencia</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transferencias.map((transferencia, index) => (
                  <div 
                    key={transferencia.transferenciaId} 
                    ref={el => {
                      if (el) cardsRef.current[index] = el;
                    }}
                    className="p-6 transition-all duration-200 hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {/* Cuenta Origen */}
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${getTipoCuentaColor(transferencia.tipoCuentaOrigen || '')}`}>
                              {getTipoCuentaIcon(transferencia.tipoCuentaOrigen || '')}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 max-w-20 truncate">
                              {transferencia.nombreCuentaOrigen}
                            </p>
                          </div>
                          
                          {/* Flecha */}
                          <div className="flex flex-col items-center">
                            <ArrowRight className="w-6 h-6 text-blue-600" />
                            <div className="text-xs text-gray-400 mt-1">
                              {transferenciaService.formatearFechaCorta(transferencia.fechaTransferencia)}
                            </div>
                          </div>
                          
                          {/* Cuenta Destino */}
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${getTipoCuentaColor(transferencia.tipoCuentaDestino || '')}`}>
                              {getTipoCuentaIcon(transferencia.tipoCuentaDestino || '')}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 max-w-20 truncate">
                              {transferencia.nombreCuentaDestino}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-1 ml-6">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {transferencia.descripcion || 'Transferencia sin descripción'}
                            </h4>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ✅ Completada
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {transferenciaService.formatearFecha(transferencia.fechaTransferencia)}
                            </span>
                            {transferencia.bancoCuentaOrigen && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {transferencia.bancoCuentaOrigen}
                              </span>
                            )}
                            {transferencia.bancoCuentaDestino && transferencia.bancoCuentaDestino !== transferencia.bancoCuentaOrigen && (
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-4 h-4" />
                                {transferencia.bancoCuentaDestino}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {transferenciaService.formatearMonto(transferencia.monto)}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">Monto transferido</p>
                          {transferencia.comisionTransferencia && transferencia.comisionTransferencia > 0 && (
                            <p className="text-xs text-orange-600 font-medium">
                              +{transferenciaService.formatearMonto(transferencia.comisionTransferencia)} comisión
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(transferencia)}
                            className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 
                                      rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Editar transferencia"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(transferencia.transferenciaId, transferencia.descripcion || '')}
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 
                                      rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Eliminar transferencia"
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

      {/* Modal de Transferencia */}
      <TransferenciaModalGlobal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingTransferencia={editingTransferencia}
      />
    </Layout>
  );
};

export default Transferencias; 