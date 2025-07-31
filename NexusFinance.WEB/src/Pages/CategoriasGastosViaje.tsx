import { useState, useEffect, useRef } from 'react';
import Layout from "../components/Layout";
import { categoriasGastosViajeService } from '../services/categoriasGastosViajeService';
import type { CategoriaGastoViaje } from '../types/categoriaGastoViaje';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, Tag, RefreshCw, Edit, Trash2, Power, PowerOff } from 'lucide-react';

export default function CategoriasGastosViaje() {
  const [categorias, setCategorias] = useState<CategoriaGastoViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await categoriasGastosViajeService.obtenerTodasCategorias();
        setCategorias(data);
      } catch (err) {
        console.error('Error al obtener categorías de gastos de viaje:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar categorías.');
      }
      setLoading(false);
    };

    fetchCategorias();
  }, []);

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
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, categorias]);

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
    categoriasGastosViajeService.obtenerTodasCategorias()
      .then(setCategorias)
      .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar categorías.'))
      .finally(() => setLoading(false));
  };

  const handleToggleEstado = async (categoria: CategoriaGastoViaje) => {
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
        Swal.fire({
          title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría...`,
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await categoriasGastosViajeService.actualizarCategoria({
          categoriaViajeId: categoria.categoriaViajeId,
          estaActivo: nuevoEstado
        });
        
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
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
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
      text: `¿Estás seguro de que quieres eliminar la categoría "${nombreCategoria}"? Esta acción es irreversible.`, 
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
          title: 'Eliminando categoría...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await categoriasGastosViajeService.eliminarCategoria(categoriaId, true); // Eliminación física
        
        await Swal.fire({
          title: '¡Eliminada!',
          text: 'La categoría ha sido eliminada exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Categoría eliminada exitosamente');
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar la categoría: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar la categoría: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    total: categorias.length,
    activas: categorias.filter(c => c.estaActivo).length,
    inactivas: categorias.filter(c => !c.estaActivo).length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-2xl">
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
                        <h1 className="text-4xl font-bold">Categorías de Gastos de Viaje</h1>
                        <p className="text-green-50 text-lg">Organiza tus gastos específicos de cada viaje</p>
                      </div>
                    </div>
                    
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-green-50 text-sm">Total Categorías</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-green-300">{estadisticas.activas}</div>
                        <div className="text-green-50 text-sm">Activas</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-gray-300">{estadisticas.inactivas}</div>
                        <div className="text-green-50 text-sm">Inactivas</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      // onClick={() => handleOpenModal()} // Implementar modal de creación
                      className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Nueva Categoría</span>
                    </button>
                    
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
                <p className="text-gray-600">Cargando categorías...</p>
              </div>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Tag className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes categorías de gastos de viaje registradas
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primera categoría para organizar tus gastos de viaje
                </p>
                <button
                  // onClick={() => handleOpenModal()} // Implementar modal de creación
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Mi Primera Categoría</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icono</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obligatoria</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activa</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categorias.map((categoria) => (
                      <tr key={categoria.categoriaViajeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{categoria.nombreCategoria}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.descripcion || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.icono}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ backgroundColor: categoria.color }}>{categoria.color}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.esObligatoria ? 'Sí' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.ordenVisualizacion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.estaActivo ? 'Sí' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                          <button 
                            onClick={() => handleToggleEstado(categoria)}
                            className={`mr-3 ${
                              categoria.estaActivo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {categoria.estaActivo ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                          <button onClick={() => handleDelete(categoria.categoriaViajeId, categoria.nombreCategoria)} className="text-red-600 hover:text-red-900">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}