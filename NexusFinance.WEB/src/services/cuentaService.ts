import { authService } from './authService';
import type { Cuenta, CrearCuentaDTO, ActualizarCuentaDTO } from '../types/cuenta';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class CuentaService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async crearCuenta(cuenta: CrearCuentaDTO): Promise<Cuenta> {
    const response = await fetch(`${API_BASE_URL}/Cuenta`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(cuenta)
    });

    if (!response.ok) {
      throw new Error('Error al crear la cuenta');
    }

    return response.json();
  }

  async actualizarCuenta(cuentaId: string, cuenta: ActualizarCuentaDTO): Promise<Cuenta> {
    const response = await fetch(`${API_BASE_URL}/Cuenta/${cuentaId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(cuenta)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la cuenta');
    }

    return response.json();
  }

  async eliminarCuenta(cuentaId: string, eliminacionFisica: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Cuenta/${cuentaId}?eliminacionFisica=${eliminacionFisica}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al eliminar la cuenta: ${response.status} ${response.statusText}`);
    }
  }

  async desactivarCuenta(cuentaId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Cuenta/${cuentaId}?eliminacionFisica=false`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al desactivar la cuenta: ${response.status} ${response.statusText}`);
    }
  }

  async reactivarCuenta(cuentaId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/Cuenta/${cuentaId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        cuentaId: cuentaId,
        estaActivo: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al reactivar la cuenta: ${response.status} ${response.statusText}`);
    }
  }

  async obtenerCuentaPorId(cuentaId: string): Promise<Cuenta> {
    const response = await fetch(`${API_BASE_URL}/Cuenta/${cuentaId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener la cuenta');
    }

    return response.json();
  }

  async obtenerCuentasPorUsuario(usuarioId: string, soloActivas: boolean = true): Promise<Cuenta[]> {
    try {
      console.log('Obteniendo cuentas para usuario:', usuarioId);
      const response = await fetch(`${API_BASE_URL}/Cuenta/usuario/${usuarioId}?soloActivas=${soloActivas}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          authService.handleUnauthorized();
          return [];
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al obtener las cuentas del usuario: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cuentas obtenidas:', data);
      
      // Asegurarse de que siempre devuelva un array
      if (Array.isArray(data)) {
        // Mapear los datos para asegurar que los nombres de campos coincidan
        return data.map((item: any) => ({
          cuentaId: item.CuentaId || item.cuentaId,
          usuarioId: item.UsuarioId || item.usuarioId,
          nombreCuenta: item.NombreCuenta || item.nombreCuenta,
          tipoCuenta: item.TipoCuenta || item.tipoCuenta,
          saldo: item.Saldo || item.saldo,
          moneda: item.Moneda || item.moneda,
          nombreBanco: item.NombreBanco || item.nombreBanco,
          numeroCuenta: item.NumeroCuenta || item.numeroCuenta,
          estaActivo: item.EstaActivo || item.estaActivo,
          fechaCreacion: item.FechaCreacion || item.fechaCreacion,
          fechaActualizacion: item.FechaActualizacion || item.fechaActualizacion
        }));
      } else if (data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          cuentaId: item.CuentaId || item.cuentaId,
          usuarioId: item.UsuarioId || item.usuarioId,
          nombreCuenta: item.NombreCuenta || item.nombreCuenta,
          tipoCuenta: item.TipoCuenta || item.tipoCuenta,
          saldo: item.Saldo || item.saldo,
          moneda: item.Moneda || item.moneda,
          nombreBanco: item.NombreBanco || item.nombreBanco,
          numeroCuenta: item.NumeroCuenta || item.numeroCuenta,
          estaActivo: item.EstaActivo || item.estaActivo,
          fechaCreacion: item.FechaCreacion || item.fechaCreacion,
          fechaActualizacion: item.FechaActualizacion || item.fechaActualizacion
        }));
      } else {
        console.warn('Respuesta inesperada del servidor:', data);
        return [];
      }
    } catch (error) {
      console.error('Error en obtenerCuentasPorUsuario:', error);
      throw error;
    }
  }

  // Tipos de cuenta disponibles
  getTiposCuenta(): string[] {
    return [
      'Cuenta Corriente',
      'Cuenta de Ahorros',
      'Cuenta de Inversión',
      'Tarjeta de Crédito',
      'Efectivo',
      'Criptomonedas',
      'Otros'
    ];
  }

  // Monedas disponibles
  getMonedas(): string[] {
    return [
      'COP', // Peso Colombiano
      'USD', // Dólar Estadounidense
      'EUR', // Euro
      'GBP', // Libra Esterlina
      'MXN', // Peso Mexicano
      'ARS', // Peso Argentino
      'CLP', // Peso Chileno
      'PEN', // Sol Peruano
      'BRL', // Real Brasileño
      'BTC', // Bitcoin
      'ETH'  // Ethereum
    ];
  }
}

export const cuentaService = new CuentaService(); 