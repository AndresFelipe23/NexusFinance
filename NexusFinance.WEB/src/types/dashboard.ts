export interface DashboardStats {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  transaccionesCount: number;
  cuentasCount: number;
  metasCount: number;
  metasCompletadas: number;
  presupuestosCount: number;
}

export interface TransaccionPorCategoria {
  nombreCategoria: string;
  color: string;
  icono: string;
  monto: number;
  tipoCategoria: string;
  transaccionesCount: number;
}

export interface TendenciaMensual {
  mes: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

export interface MetaResumen {
  metaId: string;
  nombreMeta: string;
  montoObjetivo: number;
  montoActual: number;
  porcentajeProgreso: number;
  diasRestantes?: number;
  estaCompletada: boolean;
}

export interface CuentaResumen {
  cuentaId: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldo: number;
  nombreBanco?: string;
  moneda: string;
}

export interface DashboardData {
  stats: DashboardStats;
  transaccionesPorCategoria: TransaccionPorCategoria[];
  tendenciasMensuales: TendenciaMensual[];
  metasResumen: MetaResumen[];
  cuentasResumen: CuentaResumen[];
  transaccionesRecientes: any[]; // Usando el tipo existente de transacción
}