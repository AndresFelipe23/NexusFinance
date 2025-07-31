// ===============================
// Interfaces para Reportes - NexusFinance
// ===============================

// DTOs para Dashboard Financiero
export interface DashboardFinancieroResponse {
  kpIs: KPIsPrincipales;
  topCategorias: CategoriaGasto[];
  evolucionBalance: EvolucionBalance[];
}

export interface KPIsPrincipales {
  balanceTotal: number;
  ingresosPeriodo: number;
  gastosPeriodo: number;
  balancePeriodo: number;
  metasActivas: number;
  progresoPromedioMetas: number;
  presupuestoTotal: number;
  presupuestoEjecutado: number;
  porcentajePresupuestoEjecutado: number;
  numeroTransacciones: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface CategoriaGasto {
  categoria: string;
  totalGastado: number;
  numeroTransacciones: number;
  promedioTransaccion: number;
}

export interface EvolucionBalance {
  anio: number;
  mes: number;
  nombreMes: string;
  balanceMes: number;
  balanceAcumulado: number;
}

// DTOs para Gastos por Categoría
export interface GastosPorCategoriaResponse {
  resumenCategorias: ResumenCategoria[];
  detalleTransacciones: DetalleTransaccion[];
  evolucionDiaria: EvolucionDiaria[];
}

export interface ResumenCategoria {
  categoriaId: string;
  categoria: string;
  color: string;
  totalGastado: number;
  numeroTransacciones: number;
  promedioTransaccion: number;
  montoMinimo: number;
  montoMaximo: number;
  porcentajeDelTotal: number;
  totalMesAnterior: number;
  variacionMesAnterior: number;
}

export interface DetalleTransaccion {
  transaccionId: string;
  descripcion: string;
  monto: number;
  fecha: string;
  cuenta: string;
  categoria: string;
}

export interface EvolucionDiaria {
  fecha: string;
  totalDia: number;
  transaccionesDia: number;
}

// DTOs para Progreso de Metas
export interface ProgresoMetasResponse {
  resumenMetas: ResumenMeta[];
  contribucionesRecientes: ContribucionReciente[];
  estadisticasGenerales: EstadisticasMetas;
}

export interface ResumenMeta {
  metaId: string;
  nombreMeta: string;
  descripcion: string;
  montoObjetivo: number;
  montoAcumulado: number;
  fechaLimite?: string;
  estado: string;
  fechaCreacion: string;
  porcentajeProgreso: number;
  montoFaltante: number;
  diasRestantes: number;
  ahorroRequeridoDiario: number;
  numeroContribuciones: number;
  promedioContribuciones: number;
  ultimaContribucion?: string;
  estaVencida: boolean;
  estaProximaAVencer: boolean;
  estadoVisual: string;
}

export interface ContribucionReciente {
  contribucionId: string;
  metaId: string;
  nombreMeta: string;
  monto: number;
  fecha: string;
  descripcion: string;
}

export interface EstadisticasMetas {
  totalMetas: number;
  metasActivas: number;
  metasCompletadas: number;
  metasPausadas: number;
  totalObjetivos: number;
  totalAcumulado: number;
  totalFaltante: number;
  progresoPromedio: number;
  metasProximasVencer: number;
  porcentajeCompletadas: number;
  porcentajeAcumuladoTotal: number;
}

// DTOs para Balance de Cuentas
export interface BalanceCuentasResponse {
  resumenCuentas: ResumenCuenta[];
  totalPatrimonio: number;
  totalMovimientoPeriodo: number;
}

export interface ResumenCuenta {
  cuentaId: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldoActual: number;
  movimientoPeriodo: number;
  ingresosPeriodo: number;
  gastosPeriodo: number;
  numeroTransacciones: number;
  saldoInicioPeriodo: number;
  variacionPeriodo: number;
  porcentajeVariacion: number;
  tendencia: string;
}

// DTOs para Filtros
export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  categoriaId?: string;
  cuentaId?: string;
  estadoMeta?: string;
  tipoReporte?: string;
}

// DTOs para Errores
export interface ReporteError {
  error: string;
  codigo: string;
  timestamp: string;
}

// Tipos auxiliares para componentes
export interface FiltrosPeriodo {
  periodo: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año' | 'personalizado';
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface ConfiguracionGrafico {
  tipo: 'linea' | 'barra' | 'torta' | 'area';
  colores: string[];
  mostrarLeyenda: boolean;
  altura: number;
}

export interface ResumenEjecutivo {
  dashboardFinanciero: DashboardFinancieroResponse;
  gastosPorCategoria: {
    resumenCategorias: ResumenCategoria[];
    totalCategorias: number;
  };
  progresoMetas: {
    estadisticasGenerales: EstadisticasMetas;
    metasUrgentes: ResumenMeta[];
  };
  balanceCuentas: {
    totalPatrimonio: number;
    totalCuentas: number;
    cuentasPrincipales: ResumenCuenta[];
  };
  fecha: string;
}