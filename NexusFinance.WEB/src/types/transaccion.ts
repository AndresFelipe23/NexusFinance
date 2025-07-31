export interface Transaccion {
  transaccionId: string;
  usuarioId: string;
  cuentaId: string;
  nombreCuenta?: string;
  tipoCuenta?: string;
  nombreBanco?: string;
  categoriaId: string;
  nombreCategoria?: string;
  tipoCategoria?: string;
  iconoCategoria?: string;
  color?: string;
  icono?: string;
  monto: number;
  tipoTransaccion: string;
  descripcion?: string;
  notas?: string;
  fechaTransaccion: string;
  transaccionRecurrenteId?: string;
  descripcionRecurrente?: string;
  urlRecibo?: string;
  estaConciliado?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  saldoActualCuenta?: number;
  moneda?: string;
}

export interface CrearTransaccionDTO {
  usuarioId: string;
  cuentaId: string;
  categoriaId: string;
  monto: number;
  tipoTransaccion: string;
  descripcion?: string;
  notas?: string;
  fechaTransaccion: string;
  transaccionRecurrenteId?: string;
  urlRecibo?: string;
  estaConciliado: boolean;
}

export interface ActualizarTransaccionDTO {
  transaccionId: string;
  cuentaId?: string;
  categoriaId?: string;
  monto?: number;
  descripcion?: string;
  notas?: string;
  fechaTransaccion?: string;
  urlRecibo?: string;
  estaConciliado?: boolean;
}

export interface FiltrosTransaccion {
  cuentaId?: string;
  categoriaId?: string;
  tipoTransaccion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  montoMinimo?: number;
  montoMaximo?: number;
  busquedaTexto?: string;
  soloConciliadas?: boolean;
  pagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
}

export interface EstadisticasTransacciones {
  totalTransacciones: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  promedioIngresos: number;
  promedioGastos: number;
  transaccionMasAlta: number;
  transaccionMasBaja: number;
  primeraTransaccion?: string;
  ultimaTransaccion?: string;
} 