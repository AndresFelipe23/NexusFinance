import { API_BASE_URL } from '../utils/constants';
import { CategoriaGastosViaje } from '../types/categoriaGastosViaje';
import { authService } from './authService';

class CategoriasGastosViajeService {
  private convertFromPascalCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertFromPascalCase(item));
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        converted[camelKey] = this.convertFromPascalCase(value);
      }
      return converted;
    }
    return obj;
  }

  async obtenerCategorias(): Promise<CategoriaGastosViaje[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/CategoriasGastosViaje`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las categorías de gastos de viaje');
    }

    const result = await response.json();
    return this.convertFromPascalCase(result);
  }
}

export const categoriasGastosViajeService = new CategoriasGastosViajeService();