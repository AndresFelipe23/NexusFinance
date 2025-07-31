import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import Layout from "../components/Layout";
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import type { DashboardData } from '../types/dashboard';
import { useModal } from '../contexts/ModalContext';

// Importar componentes del dashboard
import StatsCard from '../components/dashboard/StatsCard';
import CategoryChart from '../components/dashboard/CategoryChart';
import TrendChart from '../components/dashboard/TrendChart';
import GoalsWidget from '../components/dashboard/GoalsWidget';
import AccountsWidget from '../components/dashboard/AccountsWidget';
import RecentTransactions from '../components/dashboard/RecentTransactions';

// Iconos de Lucide React
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Target,
  CreditCard,
  DollarSign,
  BarChart3,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { openModal } = useModal();
  
  // Referencias para animaciones GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const widgetsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const user = authService.getUser();
        if (!user) {
          throw new Error('Usuario no autenticado');
        }
        
        setCurrentUser(user);
        const data = await dashboardService.obtenerDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Animaciones GSAP cuando se cargan los datos
  useEffect(() => {
    if (dashboardData && !loading) {
      const ctx = gsap.context(() => {
        // Animación de entrada escalonada
        const tl = gsap.timeline();
        
        tl.fromTo(headerRef.current, 
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
        )
        .fromTo(statsRef.current?.children || [], 
          { opacity: 0, y: 40, scale: 0.9 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.5, 
            stagger: 0.1,
            ease: "back.out(1.7)" 
          }, "-=0.3"
        )
        .fromTo(chartsRef.current?.children || [], 
          { opacity: 0, x: -50 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.6, 
            stagger: 0.15,
            ease: "power2.out" 
          }, "-=0.4"
        )
        .fromTo(widgetsRef.current?.children || [], 
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.1,
            ease: "power2.out" 
          }, "-=0.5"
        )
        .fromTo(actionsRef.current, 
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, "-=0.3"
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [dashboardData, loading]);

  // Función para refrescar datos con animación
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Animación de refresh
    gsap.to(statsRef.current?.children || [], {
      scale: 0.98,
      opacity: 0.7,
      duration: 0.2,
      stagger: 0.05,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    });

    try {
      const user = authService.getUser();
      if (user) {
        const data = await dashboardService.obtenerDashboardData();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100">
          <div className="p-6">
            {/* Header Skeleton con gradiente */}
            <div className="mb-8">
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/2 mb-3 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-1/3 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-2/3 mb-3 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-1/2 animate-pulse"></div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mb-6 animate-pulse"></div>
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
              </div>
              
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2 mb-6 animate-pulse"></div>
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Widgets Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-2/3 mb-6 animate-pulse"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error al cargar el dashboard</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="p-6">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </Layout>
    );
  }

  const { stats, transaccionesPorCategoria, tendenciasMensuales, metasResumen, cuentasResumen, transaccionesRecientes } = dashboardData;

  // Separar transacciones por tipo para el gráfico de categorías
  const ingresosPorCategoria = transaccionesPorCategoria.filter(t => t.tipoCategoria === 'ingreso');
  const gastosPorCategoria = transaccionesPorCategoria.filter(t => t.tipoCategoria === 'gasto');

  return (
    <Layout>
      <div ref={containerRef} className="min-h-screen bg-gray-100 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header mejorado */}
          <div ref={headerRef} className="mb-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                  <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-600 flex-shrink-0" />
                  <h1 className="text-2xl lg:text-4xl font-bold text-slate-800 break-words">
                    ¡Hola, {currentUser?.nombre || 'Usuario'}!
                  </h1>
                  <span className="text-2xl lg:text-4xl">👋</span>
                </div>
                <p className="text-slate-600 text-base lg:text-lg">
                  Aquí tienes un resumen completo de tus finanzas personales
                </p>
              </div>
              
              {/* Botón de refresh con animación */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group relative px-4 lg:px-6 py-3 bg-white hover:bg-gray-50 
                         border border-gray-200 rounded-2xl shadow-sm hover:shadow-md 
                         transition-all duration-300 transform hover:scale-105 flex-shrink-0"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className={`w-5 h-5 text-indigo-600 transition-transform duration-500 ${
                    refreshing ? 'animate-spin' : 'group-hover:rotate-180'
                  }`} />
                  <span className="font-medium text-slate-700 hidden sm:inline">
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Cards de estadísticas principales con diseño mejorado */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <StatsCard
                title="Balance Total"
                value={dashboardService.formatearMontoCompacto(stats.balance)}
                icon={<Wallet className="w-7 h-7" />}
                color={dashboardService.obtenerColorBalance(stats.balance)}
                subtitle={`${stats.transaccionesCount} transacciones`}
              />
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <StatsCard
                title="Ingresos del Mes"
                value={dashboardService.formatearMontoCompacto(stats.totalIngresos)}
                icon={<TrendingUp className="w-7 h-7" />}
                color="text-green-600"
                subtitle="Este mes"
              />
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <StatsCard
                title="Gastos del Mes"
                value={dashboardService.formatearMontoCompacto(stats.totalGastos)}
                icon={<TrendingDown className="w-7 h-7" />}
                color="text-red-600"
                subtitle="Este mes"
              />
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <StatsCard
                title="Cuentas Activas"
                value={stats.cuentasCount}
                icon={<CreditCard className="w-7 h-7" />}
                color="text-blue-600"
                subtitle={`${stats.metasCompletadas}/${stats.metasCount} metas logradas`}
              />
            </div>
          </div>

          {/* Gráficos principales con diseño mejorado */}
          <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendencias mensuales */}
            <div className="lg:col-span-2 group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <TrendChart 
                  data={tendenciasMensuales} 
                  title="📈 Tendencia Financiera (6 meses)" 
                />
              </div>
            </div>

            {/* Gastos por categoría */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CategoryChart 
                  data={gastosPorCategoria} 
                  title="💸 Gastos por Categoría" 
                />
              </div>
            </div>

            {/* Ingresos por categoría */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CategoryChart 
                  data={ingresosPorCategoria} 
                  title="💰 Ingresos por Categoría" 
                />
              </div>
            </div>
          </div>

          {/* Widgets secundarios con diseño mejorado */}
          <div ref={widgetsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metas financieras */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <GoalsWidget 
                  metas={metasResumen} 
                  title="🎯 Metas Financieras" 
                />
              </div>
            </div>

            {/* Cuentas principales */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <AccountsWidget 
                  cuentas={cuentasResumen} 
                  title="💳 Mis Cuentas" 
                />
              </div>
            </div>

            {/* Transacciones recientes */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                <RecentTransactions 
                  transacciones={transaccionesRecientes} 
                  title="⚡ Actividad Reciente" 
                />
              </div>
            </div>
          </div>

          {/* Footer con acciones rápidas mejorado */}
          <div ref={actionsRef} className="relative mt-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>
            <div className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Acciones Rápidas
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => openModal('transaccion')}
                  className="group relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-700 group-hover:text-green-800 text-center">
                      Nueva Transacción
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => openModal('meta')}
                  className="group relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-purple-700 group-hover:text-purple-800 text-center">
                      Nueva Meta
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/transacciones')}
                  className="group relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800 text-center">
                      Ver Reportes
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/presupuestos')}
                  className="group relative overflow-hidden p-6 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-2xl border border-orange-200 hover:border-orange-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-orange-700 group-hover:text-orange-800 text-center">
                      Presupuestos
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 