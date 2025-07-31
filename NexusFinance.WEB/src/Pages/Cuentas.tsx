import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Wallet, CreditCard, TrendingUp, DollarSign, Coins, PiggyBank, Zap, RefreshCw, RotateCcw, PowerOff } from 'lucide-react';
import { gsap } from 'gsap';
import { cuentaService } from '../services/cuentaService';
import type { Cuenta } from '../types/cuenta';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import CuentaModalGlobal from '../components/CuentaModalGlobal';
import Swal from 'sweetalert2';

const Cuentas: React.FC = () => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  const [soloActivas, setSoloActivas] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cargarCuentas();
  }, [soloActivas]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && cuentas.length > 0) {
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
  }, [loading, cuentas]);

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

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const usuarioId = authService.getUserId();
      
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId, soloActivas);
      
      if (Array.isArray(cuentasData)) {
        setCuentas(cuentasData);
      } else {
        setCuentas([]);
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setError(`Error al cargar las cuentas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setCuentas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cuenta?: Cuenta) => {
    setEditingCuenta(cuenta || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCuenta(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingCuenta ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente');
    cargarCuentas();
  };

  const handleEdit = (cuenta: Cuenta) => {
    handleOpenModal(cuenta);
  };

  const handleReactivar = async (cuentaId: string, nombreCuenta: string) => {
    const result = await Swal.fire({
      title: '¿Reactivar cuenta?',
      text: `¿Quieres reactivar la cuenta "${nombreCuenta}"?`,
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
          title: 'Reactivando cuenta...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await cuentaService.reactivarCuenta(cuentaId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Reactivada!',
          text: 'La cuenta ha sido reactivada exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Cuenta reactivada exitosamente');
        cargarCuentas();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo reactivar la cuenta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al reactivar la cuenta');
      }
    }
  };

  const handleDelete = async (cuentaId: string, nombreCuenta: string) => {
    const result = await Swal.fire({
      title: '⚠️ Eliminación permanente',
      text: `¿Estás completamente seguro? Esta acción NO se puede deshacer y eliminará permanentemente la cuenta "${nombreCuenta}" y todos sus datos asociados.`,
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
          title: 'Eliminando cuenta...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await cuentaService.eliminarCuenta(cuentaId, true); // eliminacionFisica = true
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Eliminada permanentemente!',
          text: 'La cuenta ha sido eliminada de forma permanente',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Cuenta eliminada permanentemente');
        cargarCuentas();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al eliminar la cuenta');
      }
    }
  };

  const handleDesactivar = async (cuentaId: string, nombreCuenta: string) => {
    const result = await Swal.fire({
      title: 'Desactivar cuenta',
      text: `¿Quieres desactivar la cuenta "${nombreCuenta}"? Podrás reactivarla más tarde desde aquí mismo.`,
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
          title: 'Desactivando cuenta...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await cuentaService.desactivarCuenta(cuentaId);
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Desactivada!',
          text: 'La cuenta ha sido desactivada exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Cuenta desactivada exitosamente');
        cargarCuentas();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo desactivar la cuenta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al desactivar la cuenta');
      }
    }
  };

  const getTipoCuentaIcon = (tipo: string) => {
    const iconClass = "w-5 h-5";
    switch (tipo) {
      case 'Cuenta Corriente':
        return <CreditCard className={iconClass} />;
      case 'Cuenta de Ahorros':
        return <PiggyBank className={iconClass} />;
      case 'Cuenta de Inversión':
        return <TrendingUp className={iconClass} />;
      case 'Tarjeta de Crédito':
        return <CreditCard className={iconClass} />;
      case 'Efectivo':
        return <DollarSign className={iconClass} />;
      case 'Criptomonedas':
        return <Coins className={iconClass} />;
      default:
        return <Wallet className={iconClass} />;
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

  const formatSaldo = (saldo: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(saldo);
  };

  const totalSaldo = cuentas.reduce((total, cuenta) => total + (cuenta.saldo || 0), 0);
  const cuentasActivas = cuentas.filter(c => c.estaActivo !== false).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando cuentas...</p>
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
                      <Wallet className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Mis Cuentas</h1>
                      <p className="text-blue-50 text-lg">Gestiona todas tus cuentas bancarias y financieras</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold">{cuentas.length}</div>
                      <div className="text-blue-50 text-sm">Total de Cuentas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-green-300">
                        {formatSaldo(totalSaldo, 'COP')}
                      </div>
                      <div className="text-blue-50 text-sm">Saldo Total</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-2xl font-bold text-yellow-300">{cuentasActivas}</div>
                      <div className="text-blue-50 text-sm">Cuentas Activas</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Cuenta</span>
                  </button>
                  
                  <button
                    onClick={cargarCuentas}
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
                <Wallet className="w-5 h-5 text-blue-600" />
                Filtros y Búsqueda
              </h3>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloActivas}
                  onChange={(e) => setSoloActivas(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Solo cuentas activas</span>
              </label>
            </div>
          </div>

          {/* Lista de Cuentas */}
          <div ref={tableRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {cuentas.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes cuentas registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza agregando tu primera cuenta para gestionar tus finanzas
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Mi Primera Cuenta</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cuentas.map((cuenta, index) => (
                  <div 
                    key={cuenta.cuentaId} 
                    ref={el => {
                      if (el) cardsRef.current[index] = el;
                    }}
                    className={`p-6 transition-all duration-200 hover:shadow-md ${
                      cuenta.estaActivo === false 
                        ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 hover:from-red-100 hover:to-red-200' 
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${getTipoCuentaColor(cuenta.tipoCuenta)}`}>
                          {getTipoCuentaIcon(cuenta.tipoCuenta)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-lg font-semibold ${
                              cuenta.estaActivo === false ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {cuenta.nombreCuenta}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              cuenta.estaActivo !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {cuenta.estaActivo !== false ? '✅ Activa' : '❌ Inactiva'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Wallet className="w-4 h-4" />
                              {cuenta.tipoCuenta}
                            </span>
                            {cuenta.nombreBanco && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                {cuenta.nombreBanco}
                              </span>
                            )}
                            {cuenta.numeroCuenta && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {cuenta.numeroCuenta}
                              </span>
                            )}
                          </div>
                          
                          {cuenta.estaActivo === false && (
                            <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                              <span>⚠️</span>
                              <span>Cuenta desactivada - Puedes reactivarla cuando lo necesites</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            cuenta.estaActivo === false 
                              ? 'text-gray-400 line-through' 
                              : 'text-green-600'
                          }`}>
                            {formatSaldo(cuenta.saldo || 0, cuenta.moneda || 'COP')}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">{cuenta.moneda || 'COP'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {cuenta.estaActivo === false ? (
                            // Botón de reactivar para cuentas inactivas
                            <button
                              onClick={() => handleReactivar(cuenta.cuentaId, cuenta.nombreCuenta)}
                              className="p-3 text-green-600 hover:text-white hover:bg-green-600 
                                        rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Reactivar cuenta"
                            >
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            // Botones para cuentas activas
                            <>
                              <button
                                onClick={() => handleEdit(cuenta)}
                                className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 
                                          rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Editar cuenta"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDesactivar(cuenta.cuentaId, cuenta.nombreCuenta)}
                                className="p-3 text-orange-600 hover:text-white hover:bg-orange-600 
                                          rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Desactivar cuenta"
                              >
                                <PowerOff size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(cuenta.cuentaId, cuenta.nombreCuenta)}
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

      {/* Modal de Cuenta */}
      <CuentaModalGlobal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingCuenta={editingCuenta}
      />
    </Layout>
  );
};

export default Cuentas;