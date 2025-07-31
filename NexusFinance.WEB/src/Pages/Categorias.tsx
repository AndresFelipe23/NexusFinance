import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Tag, Filter, TrendingUp, TrendingDown, Folder, FolderOpen, Eye, EyeOff, MoreVertical, Power, PowerOff, Minus } from 'lucide-react';
import { gsap } from 'gsap';
import { categoriaService } from '../services/categoriaService';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import CategoriaModalGlobal from '../components/CategoriaModalGlobal';
import type { Categoria } from '../types/categoria';
import Swal from 'sweetalert2';

const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas'); // todas, activas, inactivas
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cargarCategorias();
  }, [filtroTipo, filtroEstado]);

  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && categorias.length > 0) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          tableRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
        );

        gsap.fromTo(
          cardsRef.current,
          { x: -20, opacity: 0 },
          { 
            x: 0, 
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.4,
            ease: "power2.out" 
          }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, categorias]);

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

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError('');
      
      const usuarioId = authService.getUserId();
      
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      // Determinar si mostrar solo activas basado en el filtro
      const soloActivas = filtroEstado === 'activas' ? true : 
                         filtroEstado === 'inactivas' ? false : 
                         undefined; // undefined = todas

      const categoriasData = await categoriaService.obtenerCategoriasPorUsuario(usuarioId, {
        tipoCategoria: filtroTipo as 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda' | undefined,
        soloActivas: soloActivas,
        incluirJerarquia: true
      });
      
      if (Array.isArray(categoriasData)) {
        setCategorias(categoriasData);
      } else {
        setCategorias([]);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError(`Error al cargar las categorías: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (categoria?: Categoria) => {
    setEditingCategoria(categoria || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
  };

  const handleModalSuccess = () => {
    setSuccess(editingCategoria ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
    cargarCategorias();
  };

  const handleEdit = (categoria: Categoria) => {
    handleOpenModal(categoria);
  };

  const handleToggleEstado = async (categoria: Categoria) => {
    const nuevoEstado = !categoria.estaActivo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría?`,
      text: `¿Estás seguro de que quieres ${accion} la categoría "${categoria.nombreCategoria}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${accion}`,
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
          title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría...`,
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Actualizar el estado de la categoría
        await categoriaService.actualizarCategoria(categoria.categoriaId, {
          nombreCategoria: categoria.nombreCategoria,
          categoriaIdPadre: categoria.categoriaIdPadre,
          color: categoria.color,
          icono: categoria.icono,
          estaActivo: nuevoEstado
        });
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Actualizada!',
          text: `La categoría ha sido ${accion}da exitosamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess(`Categoría ${accion}da exitosamente`);
        cargarCategorias();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: `No se pudo ${accion} la categoría. Inténtalo de nuevo.`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError(`Error al ${accion} la categoría`);
      }
    }
  };

  const handleDelete = async (categoriaId: string, nombreCategoria: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar categoría',
      text: `¿Estás seguro de que quieres eliminar la categoría "${nombreCategoria}"?`,
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#dc2626',
      denyButtonColor: '#7c3aed',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar permanentemente',
      denyButtonText: 'Desactivar (reversible)',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed || result.isDenied) {
      try {
        const eliminacionFisica = result.isConfirmed;
        const accion = eliminacionFisica ? 'eliminar permanentemente' : 'desactivar';
        
        // Mostrar loading
        Swal.fire({
          title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría...`,
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        if (eliminacionFisica) {
          // Eliminación física
          await categoriaService.eliminarCategoria(categoriaId, true);
        } else {
          // Desactivar (eliminación lógica)
          const categoria = categorias.find(c => c.categoriaId === categoriaId);
          if (categoria) {
            await categoriaService.actualizarCategoria(categoriaId, {
              nombreCategoria: categoria.nombreCategoria,
              categoriaIdPadre: categoria.categoriaIdPadre,
              color: categoria.color,
              icono: categoria.icono,
              estaActivo: false
            });
          }
        }
        
        // Mostrar éxito
        await Swal.fire({
          title: '¡Completado!',
          text: eliminacionFisica 
            ? 'La categoría ha sido eliminada permanentemente'
            : 'La categoría ha sido desactivada (puedes reactivarla más tarde)',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess(eliminacionFisica ? 'Categoría eliminada permanentemente' : 'Categoría desactivada exitosamente');
        cargarCategorias();
      } catch (err) {
        console.error(err);
        
        // Mostrar error
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo completar la acción. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        
        setError('Error al procesar la categoría');
      }
    }
  };

  const getIconoSeleccionado = (icono: string) => {
    const iconosDisponibles = [
      { value: 'categoria', icon: '📁' },
      { value: 'comida', icon: '🍽️' },
      { value: 'transporte', icon: '🚗' },
      { value: 'entretenimiento', icon: '🎮' },
      { value: 'salud', icon: '🏥' },
      { value: 'educacion', icon: '📚' },
      { value: 'ropa', icon: '👕' },
      { value: 'hogar', icon: '🏠' },
      { value: 'servicios', icon: '⚡' },
      { value: 'viajes', icon: '✈️' },
      { value: 'deportes', icon: '⚽' },
      { value: 'tecnologia', icon: '💻' },
      { value: 'salario', icon: '💰' },
      { value: 'inversion', icon: '📈' },
      { value: 'regalo', icon: '🎁' },
      { value: 'otros', icon: '📦' }
    ];
    
    const iconoEncontrado = iconosDisponibles.find(i => i.value === icono);
    return iconoEncontrado ? iconoEncontrado.icon : '📁';
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'gasto') return <TrendingDown className="w-4 h-4" />;
    if (tipo === 'ingreso') return <TrendingUp className="w-4 h-4" />;
    if (tipo === 'transferencia') return <Folder className="w-4 h-4 text-blue-600" />;
    if (tipo === 'inversion') return <TrendingUp className="w-4 h-4 text-purple-600" />;
    if (tipo === 'ahorro') return <Folder className="w-4 h-4 text-cyan-600" />;
    if (tipo === 'credito') return <Plus className="w-4 h-4 text-lime-600" />;
    if (tipo === 'deuda') return <Minus className="w-4 h-4 text-orange-600" />;
    return null;
  };

  const getTipoColor = (tipo: string) => {
    if (tipo === 'gasto') return 'text-red-600 bg-red-100';
    if (tipo === 'ingreso') return 'text-green-600 bg-green-100';
    if (tipo === 'transferencia') return 'text-blue-600 bg-blue-100';
    if (tipo === 'inversion') return 'text-purple-600 bg-purple-100';
    if (tipo === 'ahorro') return 'text-cyan-600 bg-cyan-100';
    if (tipo === 'credito') return 'text-lime-600 bg-lime-100';
    if (tipo === 'deuda') return 'text-orange-600 bg-orange-100';
    return '';
  };

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'gasto') return 'Gasto';
    if (tipo === 'ingreso') return 'Ingreso';
    if (tipo === 'transferencia') return 'Transferencia';
    if (tipo === 'inversion') return 'Inversión';
    if (tipo === 'ahorro') return 'Ahorro';
    if (tipo === 'credito') return 'Crédito';
    if (tipo === 'deuda') return 'Deuda';
    return tipo;
  };

  const getEstadoColor = (estaActivo: boolean) => {
    return estaActivo ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getEstadoLabel = (estaActivo: boolean) => {
    return estaActivo ? 'Activa' : 'Inactiva';
  };

  const getEstadoIcon = (estaActivo: boolean) => {
    return estaActivo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />;
  };

  // Calcular estadísticas
  const estadisticas = {
    total: categorias.length,
    activas: categorias.filter(c => c.estaActivo).length,
    inactivas: categorias.filter(c => !c.estaActivo).length,
    gastos: categorias.filter(c => c.tipoCategoria === 'gasto').length,
    ingresos: categorias.filter(c => c.tipoCategoria === 'ingreso').length,
    subcategorias: categorias.filter(c => c.categoriaIdPadre).length
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Tag className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Categorías</h1>
                      <p className="text-blue-50 text-lg">Organiza y gestiona tus categorías financieras</p>
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
                      <div className="text-2xl font-bold text-gray-300">{estadisticas.inactivas}</div>
                      <div className="text-blue-50 text-sm">Inactivas</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-lg font-bold text-red-300">{estadisticas.gastos}</div>
                      <div className="text-blue-50 text-sm">Gastos</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-lg font-bold text-green-300">{estadisticas.ingresos}</div>
                      <div className="text-blue-50 text-sm">Ingresos</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="text-lg font-bold text-purple-300">{estadisticas.subcategorias}</div>
                      <div className="text-blue-50 text-sm">Subcategorías</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nueva Categoría</span>
                  </button>
                  
                  <button
                    onClick={cargarCategorias}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">

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

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Mostrando {categorias.length} categorías</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Categoría</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Todos los tipos</option>
                  <option value="gasto">Gastos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="transferencia">Transferencias</option>
                  <option value="inversion">Inversiones</option>
                  <option value="ahorro">Ahorros</option>
                  <option value="credito">Créditos</option>
                  <option value="deuda">Deudas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="activas">Solo activas</option>
                  <option value="inactivas">Solo inactivas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Categorías */}
          <div ref={tableRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Cargando categorías...</p>
                </div>
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Tag className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes categorías registradas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza creando tu primera categoría para organizar tus transacciones
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Mi Primera Categoría</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {categorias.map((categoria, index) => (
                  <div 
                    key={categoria.categoriaId} 
                    ref={el => {
                      if (el) cardsRef.current[index] = el;
                    }}
                    className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      categoria.estaActivo 
                        ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg' 
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                            !categoria.estaActivo ? 'opacity-50' : ''
                          }`}
                          style={{ backgroundColor: categoria.color || '#3B82F6' }}
                        >
                          <span className="text-xl text-white">
                            {getIconoSeleccionado(categoria.icono || 'categoria')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold mb-1 ${
                            categoria.estaActivo ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {categoria.nombreCategoria}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(categoria.tipoCategoria)}`}>
                              {getTipoIcon(categoria.tipoCategoria)}
                              <span className="ml-1">{getTipoLabel(categoria.tipoCategoria)}</span>
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(categoria.estaActivo || false)}`}>
                              {getEstadoIcon(categoria.estaActivo || false)}
                              <span className="ml-1">{getEstadoLabel(categoria.estaActivo || false)}</span>
                            </span>
                            {categoria.categoriaIdPadre && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <Folder className="w-3 h-3 mr-1" />
                                Subcategoría
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(categoria)}
                          className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200"
                          title="Editar categoría"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleEstado(categoria)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            categoria.estaActivo
                              ? 'text-orange-600 hover:text-white hover:bg-orange-600'
                              : 'text-green-600 hover:text-white hover:bg-green-600'
                          }`}
                          title={categoria.estaActivo ? 'Desactivar categoría' : 'Activar categoría'}
                        >
                          {categoria.estaActivo ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(categoria.categoriaId, categoria.nombreCategoria)}
                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200"
                          title="Eliminar categoría"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Información adicional */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {categoria.nombreCategoriaPadre && (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-4 h-4" />
                          <span>Padre: {categoria.nombreCategoriaPadre}</span>
                        </div>
                      )}
                      {categoria.cantidadSubcategorias && categoria.cantidadSubcategorias > 0 && (
                        <div className="flex items-center gap-1">
                          <Folder className="w-4 h-4" />
                          <span>{categoria.cantidadSubcategorias} subcategorías</span>
                        </div>
                      )}
                      {categoria.fechaCreacion && (
                        <div className="text-gray-500 text-xs">
                          Creada: {new Date(categoria.fechaCreacion).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Categoría */}
      <CategoriaModalGlobal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingCategoria={editingCategoria}
      />
    </Layout>
  );
};

export default Categorias; 