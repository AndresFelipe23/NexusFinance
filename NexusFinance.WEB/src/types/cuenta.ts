export interface Cuenta {
  cuentaId: string;
  usuarioId: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldo?: number;
  moneda?: string;
  nombreBanco?: string;
  numeroCuenta?: string;
  estaActivo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CrearCuentaDTO {
  usuarioId: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldo?: number;
  moneda?: string;
  nombreBanco?: string;
  numeroCuenta?: string;
}

export interface ActualizarCuentaDTO {
  cuentaId: string;
  nombreCuenta?: string;
  tipoCuenta?: string;
  moneda?: string;
  nombreBanco?: string;
  numeroCuenta?: string;
  estaActivo?: boolean;
}

export interface CuentaFormData {
  nombreCuenta: string;
  tipoCuenta: string;
  saldo: number;
  moneda: string;
  nombreBanco: string;
  numeroCuenta: string;
} 