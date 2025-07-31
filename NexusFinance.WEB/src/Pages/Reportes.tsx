import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon, 
  CurrencyDollarIcon, 
  TrophyIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import reportesService, { ReportesService } from '../services/reportesService';
import pdfService, { PDFService } from '../services/pdfService';
import '../styles/pdf-print.css';
import { 
  DashboardFinancieroResponse, 
  GastosPorCategoriaResponse, 
  ProgresoMetasResponse, 
  BalanceCuentasResponse,
  FiltrosReporte 
} from '../types/reportes.types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, PieChart, Pie } from 'recharts';
import Swal from 'sweetalert2';

interface TabReporte {
  id: string;
  nombre: string;
  icono: React.ElementType;
  descripcion: string;
}

const Reportes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [filtros, setFiltros] = useState<FiltrosReporte>({});
  
  // Estados para los datos de reportes
  const [dashboardData, setDashboardData] = useState<DashboardFinancieroResponse | null>(null);
  const [gastosData, setGastosData] = useState<GastosPorCategoriaResponse | null>(null);
  const [metasData, setMetasData] = useState<ProgresoMetasResponse | null>(null);
  const [cuentasData, setCuentasData] = useState<BalanceCuentasResponse | null>(null);

  // Referencias para capturar elementos para PDF
  const dashboardRef = useRef<HTMLDivElement>(null);
  const gastosRef = useRef<HTMLDivElement>(null);
  const metasRef = useRef<HTMLDivElement>(null);
  const cuentasRef = useRef<HTMLDivElement>(null);

  const tabs: TabReporte[] = [
    {
      id: 'dashboard',
      nombre: 'Dashboard Financiero',
      icono: ChartBarIcon,
      descripcion: 'Vista general de KPIs y métricas principales'
    },
    {
      id: 'gastos',
      nombre: 'Gastos por Categoría',
      icono: DocumentChartBarIcon,
      descripcion: 'Análisis detallado de gastos por categorías'
    },
    {
      id: 'metas',
      nombre: 'Progreso de Metas',
      icono: TrophyIcon,
      descripcion: 'Estado y progreso de metas financieras'
    },
    {
      id: 'cuentas',
      nombre: 'Balance de Cuentas',
      icono: CurrencyDollarIcon,
      descripcion: 'Resumen de saldos y movimientos por cuenta'
    }
  ];

  const periodos = [
    { value: 'mes', label: 'Este mes' },
    { value: 'trimestre', label: 'Este trimestre' },
    { value: 'año', label: 'Este año' },
    { value: 'últimos30días', label: 'Últimos 30 días' },
    { value: 'personalizado', label: 'Período personalizado' }
  ];

  useEffect(() => {
    // Cargar datos iniciales al montar el componente
    cargarDatos();
  }, []);

  useEffect(() => {
    // Recargar datos cuando cambie el filtro o la pestaña activa
    if (Object.keys(filtros).length > 0) {
      cargarDatos();
    }
  }, [filtros, activeTab]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          await cargarDashboard();
          break;
        case 'gastos':
          await cargarGastos();
          break;
        case 'metas':
          await cargarMetas();
          break;
        case 'cuentas':
          await cargarCuentas();
          break;
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudieron cargar los datos del reporte',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarDashboard = async () => {
    const data = await reportesService.obtenerDashboardFinanciero(filtros);
    setDashboardData(data);
    return data;
  };

  const cargarGastos = async () => {
    const data = await reportesService.obtenerGastosPorCategoria(filtros);
    setGastosData(data);
    return data;
  };

  const cargarMetas = async () => {
    const data = await reportesService.obtenerProgresoMetas(filtros.estadoMeta);
    setMetasData(data);
    return data;
  };

  const cargarCuentas = async () => {
    const data = await reportesService.obtenerBalanceCuentas(filtros);
    setCuentasData(data);
    return data;
  };

  const aplicarFiltroRapido = (periodo: string) => {
    if (periodo === 'personalizado') {
      // Mostrar selector de fechas personalizado
      return;
    }
    
    const nuevosFiltros = ReportesService.generarFiltrosPeriodo(
      periodo as 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año'
    );
    setFiltros(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  // Funciones para generar PDFs
  const generarPDFActual = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      let tableData;
      const config = PDFService.obtenerConfiguracionPorTipo(activeTab);
      const header = {
        title: tabs.find(tab => tab.id === activeTab)?.nombre || 'Reporte Financiero',
        subtitle: 'NexusFinance - Sistema de Gestión Financiera',
        date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        user: JSON.parse(localStorage.getItem('nexus_user') || '{}').nombre || 'Usuario'
      };

      switch (activeTab) {
        case 'dashboard':
          tableData = { head: [['KPI', 'Valor']], body: [ ['Balance Total', dashboardData?.kpIs.balanceTotal], ['Ingresos del Período', dashboardData?.kpIs.ingresosPeriodo], ['Gastos del Período', dashboardData?.kpIs.gastosPeriodo], ['Metas Activas', dashboardData?.kpIs.metasActivas] ] };
          break;
        case 'gastos':
          tableData = { head: [['Categoría', 'Total Gastado', 'Transacciones']], body: gastosData?.resumenCategorias.map((c: any) => [c.categoria, c.totalGastado, c.numeroTransacciones]) || [] };
          break;
        case 'metas':
          tableData = { head: [['Meta', 'Progreso', 'Monto Acumulado']], body: metasData?.resumenMetas.map((m: any) => [m.nombreMeta, `${m.porcentajeProgreso}%`, m.montoAcumulado]) || [] };
          break;
        case 'cuentas':
          tableData = { head: [['Cuenta', 'Saldo Actual', 'Tipo']], body: cuentasData?.resumenCuentas.map((c: any) => [c.nombreCuenta, c.saldoActual, c.tipoCuenta]) || [] };
          break;
      }

      if (!tableData) {
        throw new Error('No hay datos para generar el reporte.');
      }

      await pdfService.generarPDFDeElemento(document.createElement('div'), config, header, tableData);

      Swal.fire({
        title: '¡PDF Generado!',
        text: 'El reporte ha sido descargado exitosamente',
        icon: 'success',
        confirmButtonText: 'Entendido'
      });

    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo generar el PDF',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generarPDFCompleto = async () => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      const [dashboard, gastos, metas, cuentas] = await Promise.all([
        cargarDashboard(),
        cargarGastos(),
        cargarMetas(),
        cargarCuentas(),
      ]);

      await pdfService.generarReporteCompleto(
        dashboard,
        gastos,
        metas,
        cuentas,
        { filename: `reporte-completo-nexusfinance-${new Date().getTime()}.pdf` }
      );

      Swal.fire({
        title: '¡Reporte Completo Generado!',
        text: 'El reporte completo con todas las secciones ha sido descargado exitosamente',
        icon: 'success',
        confirmButtonText: 'Entendido'
      });

    } catch (error: any) {
      console.error('Error al generar PDF completo:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo generar el reporte completo',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return <div>Cargando dashboard...</div>;

    const { kpIs, topCategorias, evolucionBalance } = dashboardData;

    return (
      <div ref={dashboardRef} className="space-y-6">
        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {ReportesService.formatearMonto(kpIs.balanceTotal)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos del Período</p>
                <p className="text-2xl font-bold text-green-600">
                  {ReportesService.formatearMonto(kpIs.ingresosPeriodo)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos del Período</p>
                <p className="text-2xl font-bold text-red-600">
                  {ReportesService.formatearMonto(kpIs.gastosPeriodo)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DocumentChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Metas Activas</p>
                <p className="text-2xl font-bold text-purple-600">{kpIs.metasActivas}</p>
                <p className="text-sm text-gray-500">
                  {ReportesService.formatearPorcentaje(kpIs.progresoPromedioMetas)} promedio
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Categorías y Evolución de Balance en un grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categorías */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Categorías de Gastos</h3>
            <div className="space-y-4">
              {topCategorias.slice(0, 5).map((categoria, index) => {
                const porcentaje = (categoria.totalGastado / kpIs.gastosPeriodo) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{categoria.categoria}</span>
                      <span className="text-sm font-medium text-gray-700">{ReportesService.formatearMonto(categoria.totalGastado)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evolución de Balance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Balance (Últimos 6 meses)</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={evolucionBalance.slice(-6)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="nombreMes" stroke="gray" fontSize={12} />
                  <YAxis stroke="gray" fontSize={12} tickFormatter={(value) => `${Number(value).toLocaleString()}`} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => [ReportesService.formatearMonto(Number(value)), "Balance"]} />
                  <Area type="monotone" dataKey="balanceMes" stroke="#8884d8" fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGastos = () => {
    if (!gastosData) return <div>Cargando gastos por categoría...</div>;

    const { resumenCategorias, detalleTransacciones, evolucionDiaria } = gastosData;
    const totalGastos = resumenCategorias.reduce((sum, cat) => sum + cat.totalGastado, 0);

    return (
      <div ref={gastosRef} className="space-y-6">
        {/* Resumen General */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Gastos por Categoría</h3>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total de Gastos</p>
              <p className="text-2xl font-bold text-gray-900">
                {ReportesService.formatearMonto(totalGastos)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Categorías Activas</p>
              <p className="text-xl font-bold text-blue-700">{resumenCategorias.length}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Transacciones</p>
              <p className="text-xl font-bold text-green-700">
                {resumenCategorias.reduce((sum, cat) => sum + cat.numeroTransacciones, 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Promedio por Transacción</p>
              <p className="text-xl font-bold text-purple-700">
                {ReportesService.formatearMonto(
                  totalGastos / Math.max(1, resumenCategorias.reduce((sum, cat) => sum + cat.numeroTransacciones, 0))
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Categorías y Evolución Diaria en un grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Categorías */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categorías</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={resumenCategorias} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="gray" fontSize={12} tickFormatter={(value) => `${Number(value).toLocaleString()}`} />
                  <YAxis type="category" dataKey="categoria" stroke="gray" fontSize={12} width={80} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => [ReportesService.formatearMonto(Number(value)), "Total Gastado"]} />
                  <Legend />
                  <Bar dataKey="totalGastado" fill="#8884d8" name="Total Gastado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evolución Diaria */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución Diaria de Gastos</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={evolucionDiaria} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="fecha" stroke="gray" fontSize={12} tickFormatter={(date) => new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} />
                  <YAxis stroke="gray" fontSize={12} tickFormatter={(value) => `${Number(value).toLocaleString()}`} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => [ReportesService.formatearMonto(Number(value)), "Total Día"]} />
                  <Legend />
                  <Line type="monotone" dataKey="totalDia" stroke="#82ca9d" name="Total Gastado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetas = () => {
    if (!metasData) return <div>Cargando progreso de metas...</div>;

    const { resumenMetas, contribucionesRecientes, estadisticasGenerales } = metasData;

    return (
      <div ref={metasRef} className="space-y-6">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Metas</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticasGenerales.totalMetas}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrophyIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Metas Activas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticasGenerales.metasActivas}</p>
                <p className="text-xs text-gray-500">
                  {ReportesService.formatearPorcentaje(estadisticasGenerales.porcentajeCompletadas)} completadas
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {ReportesService.formatearPorcentaje(estadisticasGenerales.progresoPromedio)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DocumentChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Objetivos</p>
                <p className="text-lg font-bold text-gray-900">
                  {ReportesService.formatearMonto(estadisticasGenerales.totalObjetivos)}
                </p>
                <p className="text-xs text-gray-500">
                  {ReportesService.formatearMonto(estadisticasGenerales.totalAcumulado)} acumulado
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Metas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Estado de Metas Financieras</h3>
            {estadisticasGenerales.metasProximasVencer > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <CalendarIcon className="h-4 w-4" />
                {estadisticasGenerales.metasProximasVencer} metas próximas a vencer
              </div>
            )}
          </div>

          <div className="space-y-4">
            {resumenMetas.map((meta) => {
              const porcentaje = meta.porcentajeProgreso;
              const estaVencida = meta.estaVencida;
              const estaProxima = meta.estaProximaAVencer;
              
              // Determinar color de la barra de progreso
              let colorBarra = 'bg-blue-500';
              let colorFondo = 'bg-blue-100';
              if (estaVencida) {
                colorBarra = 'bg-red-500';
                colorFondo = 'bg-red-100';
              } else if (estaProxima) {
                colorBarra = 'bg-yellow-500';
                colorFondo = 'bg-yellow-100';
              } else if (porcentaje >= 100) {
                colorBarra = 'bg-green-500';
                colorFondo = 'bg-green-100';
              }

              return (
                <div key={meta.metaId} className={`p-4 border-l-4 rounded-lg ${
                  estaVencida ? 'border-red-500 bg-red-50' : 
                  estaProxima ? 'border-yellow-500 bg-yellow-50' : 
                  porcentaje >= 100 ? 'border-green-500 bg-green-50' : 
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{meta.nombreMeta}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          meta.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          meta.estado === 'activa' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {meta.estado}
                        </span>
                      </div>
                      {meta.descripcion && (
                        <p className="text-sm text-gray-600 mb-2">{meta.descripcion}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Objetivo:</span>
                          <div className="font-medium">{ReportesService.formatearMonto(meta.montoObjetivo)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Acumulado:</span>
                          <div className="font-medium text-green-600">{ReportesService.formatearMonto(meta.montoAcumulado)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Faltante:</span>
                          <div className="font-medium text-orange-600">{ReportesService.formatearMonto(meta.montoFaltante)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Días restantes:</span>
                          <div className={`font-medium ${
                            meta.diasRestantes <= 30 ? 'text-red-600' : 
                            meta.diasRestantes <= 90 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {meta.diasRestantes > 0 ? `${meta.diasRestantes} días` : 'Vencida'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {ReportesService.formatearPorcentaje(porcentaje)}
                      </div>
                      {meta.ahorroRequeridoDiario > 0 && (
                        <div className="text-sm text-gray-600">
                          {ReportesService.formatearMonto(meta.ahorroRequeridoDiario)}/día
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${colorBarra}`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    ></div>
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{meta.numeroContribuciones} contribuciones</span>
                      {meta.promedioContribuciones > 0 && (
                        <span>Promedio: {ReportesService.formatearMonto(meta.promedioContribuciones)}</span>
                      )}
                      {meta.fechaLimite && (
                        <span>
                          Límite: {new Date(meta.fechaLimite).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>
                    {meta.ultimaContribucion && (
                      <span>
                        Última contribución: {new Date(meta.ultimaContribucion).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contribuciones Recientes */}
        {contribucionesRecientes.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contribuciones Recientes ({contribucionesRecientes.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contribucionesRecientes.slice(0, 12).map((contribucion) => (
                <div key={contribucion.contribucionId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{contribucion.nombreMeta}</h4>
                      {contribucion.descripcion && (
                        <p className="text-xs text-gray-600 mt-1">{contribucion.descripcion}</p>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-bold text-green-600">
                        {ReportesService.formatearMonto(contribucion.monto)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(contribucion.fecha).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {contribucionesRecientes.length > 12 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Mostrando las 12 contribuciones más recientes de {contribucionesRecientes.length}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Resumen Estadístico */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Estadístico</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {ReportesService.formatearPorcentaje(estadisticasGenerales.porcentajeAcumuladoTotal)}
              </div>
              <div className="text-sm text-gray-600">del total de objetivos alcanzado</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {estadisticasGenerales.metasCompletadas}
              </div>
              <div className="text-sm text-gray-600">
                metas completadas de {estadisticasGenerales.totalMetas}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {ReportesService.formatearMonto(estadisticasGenerales.totalFaltante)}
              </div>
              <div className="text-sm text-gray-600">total faltante para completar metas</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCuentas = () => {
    if (!cuentasData) return <div>Cargando balance de cuentas...</div>;

    const { resumenCuentas, totalPatrimonio, totalMovimientoPeriodo } = cuentasData;
    
    // Calcular estadísticas
    const totalIngresosPeriodo = resumenCuentas.reduce((sum, cuenta) => sum + cuenta.ingresosPeriodo, 0);
    const totalGastosPeriodo = resumenCuentas.reduce((sum, cuenta) => sum + cuenta.gastosPeriodo, 0);
    const totalTransacciones = resumenCuentas.reduce((sum, cuenta) => sum + cuenta.numeroTransacciones, 0);

    // Ordenar cuentas por saldo actual (mayor a menor)
    const cuentasOrdenadas = [...resumenCuentas].sort((a, b) => b.saldoActual - a.saldoActual);

    return (
      <div ref={cuentasRef} className="space-y-6">
        {/* Resumen General del Patrimonio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patrimonio Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {ReportesService.formatearMonto(totalPatrimonio)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos del Período</p>
                <p className="text-2xl font-bold text-green-600">
                  {ReportesService.formatearMonto(totalIngresosPeriodo)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos del Período</p>
                <p className="text-2xl font-bold text-red-600">
                  {ReportesService.formatearMonto(totalGastosPeriodo)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <DocumentChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cuentas</p>
                <p className="text-2xl font-bold text-purple-600">{resumenCuentas.length}</p>
                <p className="text-xs text-gray-500">{totalTransacciones} transacciones</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Neto del Período */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Balance Neto del Período</h3>
            <div className="text-right">
              <p className="text-sm text-gray-600">Movimiento Total</p>
              <p className={`text-2xl font-bold ${
                totalMovimientoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalMovimientoPeriodo >= 0 ? '+' : ''}
                {ReportesService.formatearMonto(totalMovimientoPeriodo)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Ingresos Totales</p>
              <p className="text-xl font-bold text-green-700">
                {ReportesService.formatearMonto(totalIngresosPeriodo)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Gastos Totales</p>
              <p className="text-xl font-bold text-red-700">
                {ReportesService.formatearMonto(totalGastosPeriodo)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Balance Neto</p>
              <p className={`text-xl font-bold ${
                (totalIngresosPeriodo - totalGastosPeriodo) >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {ReportesService.formatearMonto(totalIngresosPeriodo - totalGastosPeriodo)}
              </p>
            </div>
          </div>
        </div>

        {/* Detalle por Cuentas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detalle por Cuentas</h3>
          <div className="space-y-4">
            {cuentasOrdenadas.map((cuenta) => {
              const porcentajePatrimonio = totalPatrimonio > 0 ? (cuenta.saldoActual / totalPatrimonio) * 100 : 0;
              const tendenciaColor = ReportesService.obtenerColorTendencia(cuenta.tendencia);
              
              return (
                <div key={cuenta.cuentaId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Header de la cuenta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{cuenta.nombreCuenta}</h4>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700">
                          {cuenta.tipoCuenta}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          cuenta.tendencia === 'positiva' ? 'bg-green-100 text-green-800' :
                          cuenta.tendencia === 'negativa' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cuenta.tendencia === 'positiva' ? '↗ Creciendo' :
                           cuenta.tendencia === 'negativa' ? '↘ Decreciendo' :
                           '→ Estable'}
                        </span>
                      </div>
                      
                      {/* Información financiera principal */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Saldo Actual:</span>
                          <div className="font-bold text-lg text-gray-900">
                            {ReportesService.formatearMonto(cuenta.saldoActual)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Saldo Inicial:</span>
                          <div className="font-medium text-gray-700">
                            {ReportesService.formatearMonto(cuenta.saldoInicioPeriodo)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Variación:</span>
                          <div className={`font-bold ${cuenta.variacionPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cuenta.variacionPeriodo >= 0 ? '+' : ''}
                            {ReportesService.formatearMonto(cuenta.variacionPeriodo)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">% Patrimonio:</span>
                          <div className="font-medium text-blue-600">
                            {ReportesService.formatearPorcentaje(porcentajePatrimonio)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${cuenta.porcentajeVariacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cuenta.porcentajeVariacion >= 0 ? '+' : ''}
                        {ReportesService.formatearPorcentaje(cuenta.porcentajeVariacion)}
                      </div>
                      <div className="text-sm text-gray-600">variación</div>
                    </div>
                  </div>

                  {/* Barra de proporción del patrimonio */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                      style={{ width: `${Math.min(porcentajePatrimonio, 100)}%` }}
                    ></div>
                  </div>

                  {/* Movimientos del período */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                    <div className="text-center">
                      <span className="text-gray-500 block">Ingresos</span>
                      <div className="font-bold text-green-600">
                        {ReportesService.formatearMonto(cuenta.ingresosPeriodo)}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">Gastos</span>
                      <div className="font-bold text-red-600">
                        {ReportesService.formatearMonto(cuenta.gastosPeriodo)}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">Mov. Neto</span>
                      <div className={`font-bold ${cuenta.movimientoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cuenta.movimientoPeriodo >= 0 ? '+' : ''}
                        {ReportesService.formatearMonto(cuenta.movimientoPeriodo)}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-gray-500 block">Transacciones</span>
                      <div className="font-bold text-gray-700">
                        {cuenta.numeroTransacciones}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Análisis de Diversificación */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Diversificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Por Tipo de Cuenta */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Distribución por Tipo de Cuenta</h4>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        resumenCuentas.reduce((acc, cuenta) => {
                          if (!acc[cuenta.tipoCuenta]) {
                            acc[cuenta.tipoCuenta] = 0;
                          }
                          acc[cuenta.tipoCuenta] += cuenta.saldoActual;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {/* Aquí puedes agregar <Cell /> para colores personalizados */}
                    </Pie>
                    <Tooltip formatter={(value) => [ReportesService.formatearMonto(Number(value)), "Saldo"]}/>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Métricas de Actividad */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Métricas de Actividad</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Cuenta más activa</div>
                  <div className="font-bold text-blue-800">
                    {cuentasOrdenadas.reduce((max, cuenta) => 
                      cuenta.numeroTransacciones > max.numeroTransacciones ? cuenta : max
                    ).nombreCuenta}
                  </div>
                  <div className="text-xs text-blue-600">
                    {Math.max(...cuentasOrdenadas.map(c => c.numeroTransacciones))} transacciones
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Mayor crecimiento</div>
                  <div className="font-bold text-green-800">
                    {cuentasOrdenadas.reduce((max, cuenta) => 
                      cuenta.porcentajeVariacion > max.porcentajeVariacion ? cuenta : max
                    ).nombreCuenta}
                  </div>
                  <div className="text-xs text-green-600">
                    +{ReportesService.formatearPorcentaje(Math.max(...cuentasOrdenadas.map(c => c.porcentajeVariacion)))}
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Promedio por cuenta</div>
                  <div className="font-bold text-purple-800">
                    {ReportesService.formatearMonto(totalPatrimonio / resumenCuentas.length)}
                  </div>
                  <div className="text-xs text-purple-600">
                    {Math.round(totalTransacciones / resumenCuentas.length)} transacciones promedio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContenido = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'gastos':
        return renderGastos();
      case 'metas':
        return renderMetas();
      case 'cuentas':
        return renderCuentas();
      default:
        return <div>Selecciona una pestaña para ver el reporte</div>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes Financieros</h1>
          <p className="mt-2 text-gray-600">
            Análisis detallado de tu situación financiera
          </p>
        </div>

        {/* Filtros Rápidos */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            
            {periodos.map((periodo) => (
              <button
                key={periodo.value}
                onClick={() => aplicarFiltroRapido(periodo.value)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {periodo.label}
              </button>
            ))}
            
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FunnelIcon className="h-4 w-4" />
                Limpiar filtros
              </button>
              
              <button
                onClick={cargarDatos}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              <div className="h-4 w-px bg-gray-300"></div>

              <button
                onClick={generarPDFActual}
                disabled={isLoading || isGeneratingPDF}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {isGeneratingPDF ? 'Generando...' : 'Exportar PDF'}
              </button>

              <button
                onClick={generarPDFCompleto}
                disabled={isLoading || isGeneratingPDF}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <PrinterIcon className="h-4 w-4" />
                {isGeneratingPDF ? 'Generando...' : 'Reporte Completo'}
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Reportes */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icono;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.nombre}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {renderContenido()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reportes;