import { useState, useEffect, useRef } from 'react';
import Layout from "../components/Layout";
import { presupuestoViajeService } from '../services/presupuestoViajeService';
import { authService } from '../services/authService';
import type { PresupuestoViaje } from '../types/presupuestoViaje';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, DollarSign, RefreshCw } from 'lucide-react';

export default function PresupuestoViaje() {
  const [presupuestos, setPresupuestos] = useState<PresupuestoViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());

  // Asumiendo que el planId se obtendría de la URL o de un selector de plan
  const [planId, setPlanId] = useState<string | null>(null);

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // En una aplicación real, el planId se obtendría de la URL (ej. useParams) o de un selector de plan.
    // Por ahora, se asume que el planId se establecerá externamente o se seleccionará.
    // Si no hay un planId válido, la carga de datos no se intentará.
    if (currentUser?.usuarioId) {
      // Placeholder: Aquí podrías cargar el planId de alguna manera, por ejemplo, desde la URL
      // setPlanId(somehowGetPlanIdFromUrl());
      // Para demostración, si no hay un planId, no se cargará nada.
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchPresupuestos = async () => {
      if (!planId || !currentUser?.usuarioId) {
        setLoading(false);
        return;
      }
      try {
        const data = await presupuestoViajeService.obtenerPresupuestosPorPlan(planId);
        setPresupuestos(data);
      } catch (err) {
        console.error('Error al obtener presupuestos de viaje:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar presupuestos.');
      }
      setLoading(false);
    };

    fetchPresupuestos();
  }, [planId, currentUser?.usuarioId]);

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
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, presupuestos]);

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
      presupuestoViajeService.obtenerPresupuestosPorPlan(planId)
        .then(setPresupuestos)
        .catch(err => setError(err instanceof Error ? err.message : 'Error al refrescar presupuestos.'))
        .finally(() => setLoading(false));
    }
  };

  const handleDelete = async (presupuestoViajeId: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar Presupuesto',
      text: `¿Estás seguro de que quieres eliminar este presupuesto? Esta acción es irreversible.`, 
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
          title: 'Eliminando presupuesto...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await presupuestoViajeService.eliminarPresupuesto(presupuestoViajeId);
        
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'El presupuesto ha sido eliminado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Presupuesto eliminado exitosamente');
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar el presupuesto: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar el presupuesto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };

  // Calcular estadísticas (ejemplo)
  const estadisticas = {
    total: presupuestos.length,
    estimadoTotal: presupuestos.reduce((sum, p) => sum + p.presupuestoEstimado, 0),
    gastadoTotal: presupuestos.reduce((sum, p) => sum + p.gastoReal, 0),
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white rounded-2xl">
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
                        <h1 className="text-4xl font-bold">Presupuestos de Viaje</h1>
                        <p className="text-orange-50 text-lg">Controla tus gastos por categoría en cada viaje</p>
                      </div>
                    </div>
                    
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-orange-50 text-sm">Total Presupuestos</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.estimadoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-orange-50 text-sm">Estimado Total</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.gastadoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-orange-50 text-sm">Gastado Total</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-yellow-300">{(estadisticas.estimadoTotal - estadisticas.gastadoTotal).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                        <div className="text-orange-50 text-sm">Restante</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      // onClick={() => handleOpenModal()} // Implementar modal de creación
                      className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Nuevo Presupuesto</span>
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
                <p className="text-gray-600">Cargando presupuestos...</p>
              </div>
            </div>
          ) : !planId ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecciona un plan de vacaciones
                </h3>
                <p className="text-gray-600 mb-6">
                  Para ver y gestionar los presupuestos de viaje, primero debes seleccionar un plan.
                </p>
                {/* Botón para ir a planes de vacaciones o seleccionar uno */}
                <button
                  // onClick={() => navigate('/planes-vacaciones')} // Asumiendo que tienes un navigate
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span>Ir a Planes de Vacaciones</span>
                </button>
              </div>
            </div>
          ) : presupuestos.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes presupuestos de viaje registrados
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primer presupuesto para este plan de vacaciones.
                </p>
                <button
                  // onClick={() => handleOpenModal()} // Implementar modal de creación
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Mi Primer Presupuesto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presupuesto Estimado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto Real</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {presupuestos.map((presupuesto) => (
                      <tr key={presupuesto.presupuestoViajeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{presupuesto.categoriaViajeId}</td> { /* Esto debería ser el nombre de la categoría */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{presupuesto.presupuestoEstimado.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{presupuesto.gastoReal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{presupuesto.notas || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                          <button onClick={() => handleDelete(presupuesto.presupuestoViajeId)} className="text-red-600 hover:text-red-900">Eliminar</button>
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