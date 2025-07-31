import { authService } from './authService';
import type { 
  TransaccionRecurrente, 
  CrearTransaccionRecurrenteDTO, 
  ActualizarTransaccionRecurrenteDTO,
  FiltrosTransaccionRecurrente 
} from '../types/transaccionRecurrente';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

// Interfaz para los datos que llegan del backend (PascalCase)
interface TransaccionRecurrenteBackend {
  RecurrenteId: string;
  UsuarioId: string;
  CuentaId: string;
  NombreCuenta?: string;
  CategoriaId: string;
  NombreCategoria?: string;
  TipoCategoria?: string;
  IconoCategoria?: string;
  Color?: string;
  Monto: number;
  TipoTransaccion: string;
  Descripcion?: string;
  Frecuencia: string;
  FechaInicio: string;
  FechaFin?: string;
  ProximaFechaEjecucion: string;
  DiasParaProximaEjecucion?: number;
  EstaActivo?: boolean;
  FechaCreacion?: string;
  FechaActualizacion?: string;
  TotalTransaccionesGeneradas?: number;
  EstadoTransaccion?: string;
}

class TransaccionRecurrenteService {
  private getHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async obtenerTransaccionesRecurrentesPorUsuario(
    usuarioId: string, 
    filtros: FiltrosTransaccionRecurrente = {}
  ): Promise<TransaccionRecurrente[]> {
    const params = new URLSearchParams();
    
    if (filtros.tipoTransaccion) params.append('tipoTransaccion', filtros.tipoTransaccion);
    if (filtros.frecuencia) params.append('frecuencia', filtros.frecuencia);
    if (filtros.soloActivas !== undefined) params.append('soloActivas', filtros.soloActivas.toString());
    if (filtros.soloPendientes !== undefined) params.append('soloPendientes', filtros.soloPendientes.toString());

    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente/usuario/${usuarioId}?${params.toString()}`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        authService.handleUnauthorized();
        return [];
      }
      throw new Error('Error al obtener transacciones recurrentes');
    }

    const data = await response.json();
    console.log('🔍 Debug - Datos recibidos del backend:', JSON.stringify(data, null, 2));
    
    // Mapear propiedades de PascalCase a camelCase
    const transaccionesMapeadas = data.map((item: TransaccionRecurrenteBackend) => ({
      recurrenteId: item.RecurrenteId,
      usuarioId: item.UsuarioId,
      cuentaId: item.CuentaId,
      nombreCuenta: item.NombreCuenta,
      categoriaId: item.CategoriaId,
      nombreCategoria: item.NombreCategoria,
      tipoCategoria: item.TipoCategoria,
      iconoCategoria: item.IconoCategoria,
      color: item.Color,
      monto: item.Monto,
      tipoTransaccion: item.TipoTransaccion,
      descripcion: item.Descripcion,
      frecuencia: item.Frecuencia,
      fechaInicio: item.FechaInicio,
      fechaFin: item.FechaFin,
      proximaFechaEjecucion: item.ProximaFechaEjecucion,
      diasParaProximaEjecucion: item.DiasParaProximaEjecucion,
      estaActivo: item.EstaActivo,
      fechaCreacion: item.FechaCreacion,
      fechaActualizacion: item.FechaActualizacion,
      totalTransaccionesGeneradas: item.TotalTransaccionesGeneradas,
      estadoTransaccion: item.EstadoTransaccion
    }));
    
    console.log('🔍 Debug - Datos mapeados:', JSON.stringify(transaccionesMapeadas, null, 2));
    return transaccionesMapeadas;
  }

  async obtenerTransaccionRecurrentePorId(recurrenteId: string): Promise<TransaccionRecurrente> {
    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente/${recurrenteId}`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        authService.handleUnauthorized();
        throw new Error('Sesión expirada');
      }
      throw new Error('Error al obtener transacción recurrente');
    }

    const data: TransaccionRecurrenteBackend = await response.json();
    
    // Mapear propiedades de PascalCase a camelCase
    return {
      recurrenteId: data.RecurrenteId,
      usuarioId: data.UsuarioId,
      cuentaId: data.CuentaId,
      nombreCuenta: data.NombreCuenta,
      categoriaId: data.CategoriaId,
      nombreCategoria: data.NombreCategoria,
      tipoCategoria: data.TipoCategoria,
      iconoCategoria: data.IconoCategoria,
      color: data.Color,
      monto: data.Monto,
      tipoTransaccion: data.TipoTransaccion,
      descripcion: data.Descripcion,
      frecuencia: data.Frecuencia,
      fechaInicio: data.FechaInicio,
      fechaFin: data.FechaFin,
      proximaFechaEjecucion: data.ProximaFechaEjecucion,
      diasParaProximaEjecucion: data.DiasParaProximaEjecucion,
      estaActivo: data.EstaActivo,
      fechaCreacion: data.FechaCreacion,
      fechaActualizacion: data.FechaActualizacion,
      totalTransaccionesGeneradas: data.TotalTransaccionesGeneradas,
      estadoTransaccion: data.EstadoTransaccion
    };
  }

  async crearTransaccionRecurrente(dto: CrearTransaccionRecurrenteDTO): Promise<TransaccionRecurrente> {
    // Preparar datos para el backend - convertir fechas a formato ISO
    const datosParaEnviar = {
      ...dto,
      fechaInicio: typeof dto.fechaInicio === 'string' ? dto.fechaInicio : dto.fechaInicio.toISOString(),
      fechaFin: dto.fechaFin ? (typeof dto.fechaFin === 'string' ? dto.fechaFin : dto.fechaFin.toISOString()) : undefined
    };

    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(datosParaEnviar)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('Request data:', JSON.stringify(datosParaEnviar, null, 2));
      
      try {
        const error = JSON.parse(errorText);
        if (error.errors) {
          // Es un ValidationProblemDetails
          const validationErrors = Object.entries(error.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          throw new Error(`Errores de validación: ${validationErrors}`);
        }
        throw new Error(error.message || error.title || 'Error al crear transacción recurrente');
      } catch {
        throw new Error(`Error al crear transacción recurrente: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  async actualizarTransaccionRecurrente(dto: ActualizarTransaccionRecurrenteDTO): Promise<TransaccionRecurrente> {
    // Preparar datos para el backend - convertir fechas a formato ISO
    const datosParaEnviar = {
      ...dto,
      fechaFin: dto.fechaFin ? (typeof dto.fechaFin === 'string' ? dto.fechaFin : dto.fechaFin.toISOString()) : undefined
    };

    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(datosParaEnviar)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('Request data:', JSON.stringify(datosParaEnviar, null, 2));
      
      try {
        const error = JSON.parse(errorText);
        if (error.errors) {
          // Es un ValidationProblemDetails
          const validationErrors = Object.entries(error.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          throw new Error(`Errores de validación: ${validationErrors}`);
        }
        throw new Error(error.message || error.title || 'Error al actualizar transacción recurrente');
      } catch {
        throw new Error(`Error al actualizar transacción recurrente: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  async eliminarTransaccionRecurrente(recurrenteId: string, eliminacionFisica: boolean = false): Promise<void> {
    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente/${recurrenteId}?eliminacionFisica=${eliminacionFisica}`,
      {
        method: 'DELETE',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar transacción recurrente');
    }
  }

  async obtenerFrecuencias(): Promise<string[]> {
    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente/frecuencias`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        authService.handleUnauthorized();
        return [];
      }
      throw new Error('Error al obtener frecuencias');
    }

    return response.json();
  }

  async obtenerTiposTransaccion(): Promise<string[]> {
    const response = await fetch(
      `${API_URL}/TransaccionesRecurrente/tipos-transaccion`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        authService.handleUnauthorized();
        return [];
      }
      throw new Error('Error al obtener tipos de transacción');
    }

    return response.json();
  }

  // Funciones de utilidad
  obtenerColorPorTipo(tipo: string): string {
    switch (tipo) {
      case 'ingreso':
        return 'text-green-600';
      case 'gasto':
        return 'text-red-600';
      case 'transferencia':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  obtenerIconoPorTipo(tipo: string): string {
    switch (tipo) {
      case 'ingreso':
        return '📈';
      case 'gasto':
        return '📉';
      case 'transferencia':
        return '🔄';
      default:
        return '💰';
    }
  }

  obtenerIconoPorFrecuencia(frecuencia: string): string {
    switch (frecuencia) {
      case 'diario':
        return '📅';
      case 'semanal':
        return '📆';
      case 'mensual':
        return '🗓️';
      case 'anual':
        return '📊';
      default:
        return '⏰';
    }
  }

  obtenerLabelPorFrecuencia(frecuencia: string): string {
    switch (frecuencia) {
      case 'diario':
        return 'Diario';
      case 'semanal':
        return 'Semanal';
      case 'quincenal':
        return 'Quincenal';
      case 'mensual':
        return 'Mensual';
      case 'bimestral':
        return 'Bimestral';
      case 'trimestral':
        return 'Trimestral';
      case 'anual':
        return 'Anual';
      default:
        return frecuencia;
    }
  }

  obtenerMultiplicadorMensual(frecuencia: string): number {
    switch (frecuencia) {
      case 'diario':
        return 30;
      case 'semanal':
        return 4.33;
      case 'quincenal':
        return 2;
      case 'mensual':
        return 1;
      case 'bimestral':
        return 0.5;
      case 'trimestral':
        return 0.33;
      case 'anual':
        return 0.083;
      default:
        return 1;
    }
  }

  obtenerEstadoColor(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Programada':
        return 'bg-blue-100 text-blue-800';
      case 'Finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatearMonto(monto: number): string {
    if (!monto || isNaN(monto)) {
      return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    if (!fecha || fecha === 'Invalid Date') {
      return 'Fecha no válida';
    }
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return 'Fecha no válida';
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no válida';
    }
  }

  formatearFechaCorta(fecha: string): string {
    if (!fecha || fecha === 'Invalid Date') {
      return 'Fecha no válida';
    }
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return 'Fecha no válida';
      }
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no válida';
    }
  }

  calcularDiasRestantes(fecha: string): number {
    if (!fecha || fecha === 'Invalid Date') {
      return 0;
    }
    try {
      const hoy = new Date();
      const fechaProxima = new Date(fecha);
      if (isNaN(fechaProxima.getTime())) {
        return 0;
      }
      const diffTime = fechaProxima.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  }

  calcularDiasHastaProximaEjecucion(fecha: string): number {
    if (!fecha || fecha === 'Invalid Date') {
      return 0;
    }
    try {
      const hoy = new Date();
      const fechaProxima = new Date(fecha);
      if (isNaN(fechaProxima.getTime())) {
        return 0;
      }
      const diffTime = fechaProxima.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  }
}

export const transaccionRecurrenteService = new TransaccionRecurrenteService(); 