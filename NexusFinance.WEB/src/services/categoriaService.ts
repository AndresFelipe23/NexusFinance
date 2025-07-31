import { authService } from './authService';
import type { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO, FiltrosCategoria } from '../types/categoria';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232/api';

class CategoriaService {
  public async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  // Función para mapear datos del backend (PascalCase) al frontend (camelCase)
  private mapBackendToFrontend(backendData: Record<string, unknown>): Categoria {
    return {
      categoriaId: String(backendData.CategoriaId || backendData.categoriaId || ''),
      usuarioId: String(backendData.UsuarioId || backendData.usuarioId || ''),
      nombreCategoria: String(backendData.NombreCategoria || backendData.nombreCategoria || ''),
      tipoCategoria: String(backendData.TipoCategoria || backendData.tipoCategoria || '') as 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda',
      categoriaIdPadre: backendData.CategoriaIdPadre || backendData.categoriaIdPadre ? String(backendData.CategoriaIdPadre || backendData.categoriaIdPadre) : undefined,
      nombreCategoriaPadre: backendData.NombreCategoriaPadre || backendData.nombreCategoriaPadre ? String(backendData.NombreCategoriaPadre || backendData.nombreCategoriaPadre) : undefined,
      color: backendData.Color || backendData.color ? String(backendData.Color || backendData.color) : undefined,
      icono: backendData.Icono || backendData.icono ? String(backendData.Icono || backendData.icono) : undefined,
      estaActivo: Boolean(backendData.EstaActivo || backendData.estaActivo || false),
      fechaCreacion: backendData.FechaCreacion || backendData.fechaCreacion ? String(backendData.FechaCreacion || backendData.fechaCreacion) : undefined,
      cantidadSubcategorias: backendData.CantidadSubcategorias || backendData.cantidadSubcategorias ? Number(backendData.CantidadSubcategorias || backendData.cantidadSubcategorias) : undefined
    };
  }

  // Función para mapear datos del frontend (camelCase) al backend (PascalCase)
  private mapFrontendToBackend(frontendData: CrearCategoriaDTO | ActualizarCategoriaDTO): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    Object.entries(frontendData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convertir camelCase a PascalCase
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        result[pascalKey] = value;
      }
    });
    
    return result;
  }

  async obtenerCategoriasPorUsuario(
    usuarioId: string, 
    filtros: FiltrosCategoria = {}
  ): Promise<Categoria[]> {
    try {
      console.log(`[categoriaService] Obteniendo categorías para usuario ${usuarioId}`, filtros);
      
      const params = new URLSearchParams();
      if (filtros.tipoCategoria) params.append('tipoCategoria', filtros.tipoCategoria);
      if (filtros.soloActivas !== undefined) params.append('soloActivas', filtros.soloActivas.toString());
      if (filtros.incluirJerarquia !== undefined) params.append('incluirJerarquia', filtros.incluirJerarquia.toString());

      const url = `${API_BASE_URL}/Categoria/usuario/${usuarioId}?${params.toString()}`;
      console.log('URL de la petición:', url);

      const response = await fetch(url, { 
        headers: await this.getAuthHeaders() 
      });

      console.log('Status de la respuesta:', response.status);

          if (!response.ok) {
      if (response.status === 401) {
        authService.handleUnauthorized();
        return [];
      }
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener las categorías: ${response.status} ${response.statusText} - ${errorText}`);
    }

      const data = await response.json();
      console.log('Respuesta JSON del backend:', data);
      
      // Mapear de PascalCase a camelCase
      const categoriasMapeadas = Array.isArray(data) ? data.map(this.mapBackendToFrontend) : [];
      console.log('Categorías mapeadas:', categoriasMapeadas);
      console.log('Categorías con iconos y colores (después del mapeo):', categoriasMapeadas.map(c => ({
        id: c.categoriaId,
        nombre: c.nombreCategoria,
        icono: c.icono,
        color: c.color,
        iconoBackend: data.find((d: Record<string, unknown>) => d.CategoriaId === c.categoriaId)?.Icono,
        colorBackend: data.find((d: Record<string, unknown>) => d.CategoriaId === c.categoriaId)?.Color
      })));
      
      return categoriasMapeadas;
    } catch (error) {
      console.error('[categoriaService] Error en obtenerCategoriasPorUsuario:', error);
      throw error;
    }
  }

  async obtenerCategoriaPorId(categoriaId: string): Promise<Categoria> {
    try {
      console.log(`[categoriaService] Obteniendo categoría ${categoriaId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/Categoria/${categoriaId}`,
        { headers: await this.getAuthHeaders() }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener la categoría: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Categoría obtenida:', data);
      
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('[categoriaService] Error en obtenerCategoriaPorId:', error);
      throw error;
    }
  }

  async crearCategoria(dto: CrearCategoriaDTO): Promise<Categoria> {
    try {
      console.log('[categoriaService] Creando categoría:', dto);
      
      const dtoToSend = this.mapFrontendToBackend(dto);
      console.log('Datos enviados al backend:', dtoToSend);

      const response = await fetch(`${API_BASE_URL}/Categoria`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(dtoToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear la categoría: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Categoría creada:', data);
      
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('[categoriaService] Error en crearCategoria:', error);
      throw error;
    }
  }

  async actualizarCategoria(categoriaId: string, dto: ActualizarCategoriaDTO): Promise<Categoria> {
    try {
      console.log(`[categoriaService] Actualizando categoría ${categoriaId}:`, dto);
      
      // Validar que el categoriaId sea un GUID válido
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(categoriaId)) {
        throw new Error(`ID de categoría inválido: ${categoriaId}`);
      }
      
      // Asegurar que el categoriaId esté en el DTO
      const dtoWithId = {
        ...dto,
        categoriaId: categoriaId
      };
      
      const dtoToSend = this.mapFrontendToBackend(dtoWithId);
      console.log('Datos enviados al backend:', dtoToSend);
      console.log('JSON que se enviará:', JSON.stringify(dtoToSend));
      console.log('DTO original:', dto);
      console.log('DTO con ID:', dtoWithId);

      const response = await fetch(`${API_BASE_URL}/Categoria`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(dtoToSend)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar la categoría: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Categoría actualizada:', data);
      
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('[categoriaService] Error en actualizarCategoria:', error);
      throw error;
    }
  }

  async eliminarCategoria(categoriaId: string, eliminacionFisica: boolean = false): Promise<void> {
    try {
      console.log(`[categoriaService] Eliminando categoría ${categoriaId}, eliminación física: ${eliminacionFisica}`);
      
      const response = await fetch(`${API_BASE_URL}/Categoria/${categoriaId}?eliminacionFisica=${eliminacionFisica}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar la categoría: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('[categoriaService] Error en eliminarCategoria:', error);
      throw error;
    }
  }

  // Método para obtener categorías organizadas en jerarquía
  async obtenerCategoriasJerarquia(
    usuarioId: string, 
    tipoCategoria?: 'ingreso' | 'gasto'
  ): Promise<Categoria[]> {
    try {
      console.log(`[categoriaService] Obteniendo categorías en jerarquía para usuario ${usuarioId}, tipo: ${tipoCategoria}`);
      
      const categorias = await this.obtenerCategoriasPorUsuario(usuarioId, {
        tipoCategoria,
        soloActivas: true,
        incluirJerarquia: true
      });

      // Organizar en jerarquía (padres primero, luego hijos)
      const categoriasPadre = categorias.filter(cat => !cat.categoriaIdPadre);
      const categoriasHijo = categorias.filter(cat => cat.categoriaIdPadre);
      
      const resultado: Categoria[] = [];
      
      // Agregar categorías padre
      categoriasPadre.forEach(padre => {
        resultado.push(padre);
        // Agregar sus hijos
        const hijos = categoriasHijo.filter(hijo => hijo.categoriaIdPadre === padre.categoriaId);
        resultado.push(...hijos);
      });
      
      console.log('Categorías organizadas en jerarquía:', resultado);
      return resultado;
    } catch (error) {
      console.error('[categoriaService] Error en obtenerCategoriasJerarquia:', error);
      throw error;
    }
  }

  // Método para obtener solo categorías padre
  async obtenerCategoriasPadre(
    usuarioId: string, 
    tipoCategoria?: 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda'
  ): Promise<Categoria[]> {
    try {
      console.log(`[categoriaService] Obteniendo categorías padre para usuario ${usuarioId}, tipo: ${tipoCategoria}`);
      
      const categorias = await this.obtenerCategoriasPorUsuario(usuarioId, {
        tipoCategoria,
        soloActivas: true,
        incluirJerarquia: true
      });

      const categoriasPadre = categorias.filter(cat => !cat.categoriaIdPadre);
      console.log('Categorías padre:', categoriasPadre);
      
      return categoriasPadre;
    } catch (error) {
      console.error('[categoriaService] Error en obtenerCategoriasPadre:', error);
      throw error;
    }
  }

  // Método para obtener subcategorías de una categoría padre
  async obtenerSubcategorias(categoriaIdPadre: string): Promise<Categoria[]> {
    try {
      console.log(`[categoriaService] Obteniendo subcategorías de ${categoriaIdPadre}`);
      
      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        throw new Error('Usuario no autenticado');
      }

      const categorias = await this.obtenerCategoriasPorUsuario(usuarioId, {
        soloActivas: true,
        incluirJerarquia: true
      });

      const subcategorias = categorias.filter(cat => cat.categoriaIdPadre === categoriaIdPadre);
      console.log('Subcategorías:', subcategorias);
      
      return subcategorias;
    } catch (error) {
      console.error('[categoriaService] Error en obtenerSubcategorias:', error);
      throw error;
    }
  }

  // Método para obtener tipos de categoría disponibles
  async obtenerTiposCategoria(): Promise<Array<{
    valor: string;
    nombre: string;
    descripcion: string;
    color: string;
    icono: string;
  }>> {
    try {
      console.log('[categoriaService] Obteniendo tipos de categoría');
      
      const response = await fetch(`${API_BASE_URL}/Categoria/tipos`, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener tipos de categoría: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Tipos de categoría obtenidos:', data);
      
      return data;
    } catch (error) {
      console.error('[categoriaService] Error en obtenerTiposCategoria:', error);
      throw error;
    }
  }
}

export const categoriaService = new CategoriaService(); 