import type { MetaFinanciera } from '../types/metaFinanciera';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Funciones de utilidad para manejo de fechas DateTime
export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Convertir a formato YYYY-MM-DD para input type="date"
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const formatDateForDisplay = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

export const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Convertir a DateTime completo para el backend
    return date.toISOString();
  } catch {
    return '';
  }
};

class MetaFinancieraService {
  public async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  async obtenerMetasPorUsuario(usuarioId: string, tipoMeta?: string, soloActivas: boolean = true, ordenarPor: string = 'fecha_objetivo'): Promise<MetaFinanciera[]> {
    const params = new URLSearchParams();
    if (tipoMeta) params.append('tipoMeta', tipoMeta);
    params.append('soloActivas', soloActivas ? 'true' : 'false');
    params.append('ordenarPor', ordenarPor);

    const url = `${API_BASE_URL}/MetasFinanciera/usuario/${usuarioId}?${params.toString()}`;
    console.log('URL de la petición:', url);
    console.log('Headers:', await this.getAuthHeaders());

    const response = await fetch(url, { headers: await this.getAuthHeaders() });

    console.log('Status de la respuesta:', response.status);
    console.log('Status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener las metas: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Respuesta JSON del backend:', data);
    
    // Mapear de PascalCase a camelCase
    const metasMapeadas = Array.isArray(data) ? data.map(this.mapBackendToFrontend) : [];
    console.log('Metas mapeadas:', metasMapeadas);
    
    return metasMapeadas;
  }

  // Función para mapear datos del backend (PascalCase) al frontend (camelCase)
  private mapBackendToFrontend(backendData: Record<string, unknown>): MetaFinanciera {
    return {
      metaId: String(backendData.MetaId || backendData.metaId || ''),
      usuarioId: String(backendData.UsuarioId || backendData.usuarioId || ''),
      nombreMeta: String(backendData.NombreMeta || backendData.nombreMeta || ''),
      descripcion: backendData.Descripcion || backendData.descripcion ? String(backendData.Descripcion || backendData.descripcion) : undefined,
      montoObjetivo: Number(backendData.MontoObjetivo || backendData.montoObjetivo || 0),
      montoActual: Number(backendData.MontoActual || backendData.montoActual || 0),
      fechaObjetivo: backendData.FechaObjetivo || backendData.fechaObjetivo ? String(backendData.FechaObjetivo || backendData.fechaObjetivo) : undefined,
      tipoMeta: String(backendData.TipoMeta || backendData.tipoMeta || ''),
      cuentaId: backendData.CuentaId || backendData.cuentaId ? String(backendData.CuentaId || backendData.cuentaId) : undefined,
      estaCompletada: Boolean(backendData.EstaCompletada || backendData.estaCompletada || false),
      fechaComplecion: backendData.FechaComplecion || backendData.fechaComplecion ? String(backendData.FechaComplecion || backendData.fechaComplecion) : undefined,
      fechaCreacion: backendData.FechaCreacion || backendData.fechaCreacion ? String(backendData.FechaCreacion || backendData.fechaCreacion) : undefined,
      fechaActualizacion: backendData.FechaActualizacion || backendData.fechaActualizacion ? String(backendData.FechaActualizacion || backendData.fechaActualizacion) : undefined
    };
  }

  async obtenerMetaPorId(metaId: string): Promise<MetaFinanciera> {
    const response = await fetch(
      `${API_BASE_URL}/MetasFinanciera/${metaId}`,
      { headers: await this.getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Error al obtener la meta');
    }

    const data = await response.json();
    return this.mapBackendToFrontend(data);
  }

  async crearMeta(dto: Omit<MetaFinanciera, 'metaId' | 'fechaComplecion' | 'fechaCreacion' | 'fechaActualizacion' | 'estaCompletada'>): Promise<MetaFinanciera> {
    function toBackendMetaDTO(dto: Omit<MetaFinanciera, 'metaId' | 'fechaComplecion' | 'fechaCreacion' | 'fechaActualizacion' | 'estaCompletada'>) {
      return {
        UsuarioId: dto.usuarioId,
        NombreMeta: dto.nombreMeta,
        Descripcion: dto.descripcion || null,
        MontoObjetivo: dto.montoObjetivo,
        MontoActual: dto.montoActual || 0,
        FechaObjetivo: dto.fechaObjetivo ? formatDateForAPI(dto.fechaObjetivo) : null,
        TipoMeta: dto.tipoMeta,
        CuentaId: dto.cuentaId || null
      };
    }

    const dtoToSend = toBackendMetaDTO(dto);
    // Solo eliminar CuentaId si es null o undefined, no si es string vacío
    if (dtoToSend.CuentaId === null || dtoToSend.CuentaId === undefined) {
      delete (dtoToSend as Record<string, unknown>).CuentaId;
    }

    console.log('Enviando datos al backend:', dtoToSend);

    const response = await fetch(`${API_BASE_URL}/MetasFinanciera`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(dtoToSend)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al crear la meta: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return this.mapBackendToFrontend(data);
  }

  async actualizarMeta(metaId: string, dto: Partial<MetaFinanciera>): Promise<MetaFinanciera> {
    function toBackendUpdateDTO(dto: Partial<MetaFinanciera>) {
      const result: Record<string, unknown> = {};
      
      // Siempre incluir MetaId
      result.MetaId = metaId;
      
      if (dto.nombreMeta !== undefined) result.NombreMeta = dto.nombreMeta;
      if (dto.descripcion !== undefined) result.Descripcion = dto.descripcion;
      if (dto.montoObjetivo !== undefined) result.MontoObjetivo = dto.montoObjetivo;
      if (dto.montoActual !== undefined) result.MontoActual = dto.montoActual;
      if (dto.fechaObjetivo !== undefined) {
        result.FechaObjetivo = dto.fechaObjetivo ? formatDateForAPI(dto.fechaObjetivo) : null;
      }
      if (dto.tipoMeta !== undefined) result.TipoMeta = dto.tipoMeta;
      if (dto.cuentaId !== undefined) result.CuentaId = dto.cuentaId || null;
      if (dto.estaCompletada !== undefined) result.EstaCompletada = dto.estaCompletada;
      if (dto.fechaComplecion !== undefined) {
        result.FechaComplecion = dto.fechaComplecion ? formatDateForAPI(dto.fechaComplecion) : null;
      }
      
      return result;
    }

    const dtoToSend = toBackendUpdateDTO(dto);
    
    console.log('📤 Enviando datos de actualización:', dtoToSend);
    console.log('📤 MetaId:', metaId);

    const response = await fetch(`${API_BASE_URL}/MetasFinanciera/${metaId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(dtoToSend)
    });

    console.log('📤 Status de respuesta:', response.status);
    console.log('📤 Status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📤 Error response:', errorText);
      throw new Error(`Error al actualizar la meta: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📤 Respuesta exitosa:', data);
    return this.mapBackendToFrontend(data);
  }

  async eliminarMeta(metaId: string, eliminacionFisica: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/MetasFinanciera/${metaId}?eliminacionFisica=${eliminacionFisica}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar la meta: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  async actualizarEstadoMeta(metaId: string, estaCompletada: boolean): Promise<MetaFinanciera> {
    try {
      console.log(`[metaFinancieraService] Actualizando estado de meta ${metaId}, estaCompletada: ${estaCompletada}`);
      
      const updateData = {
        MetaId: metaId,
        EstaCompletada: estaCompletada,
        FechaComplecion: estaCompletada ? new Date().toISOString() : null
      };

      const response = await fetch(`${API_BASE_URL}/MetasFinanciera/${metaId}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[metaFinancieraService] Error al actualizar estado:`, errorText);
        throw new Error(`Error al actualizar estado: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[metaFinancieraService] Estado actualizado exitosamente:`, data);
      
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('[metaFinancieraService] Error en actualizarEstadoMeta:', error);
      throw error;
    }
  }
}

export const metaFinancieraService = new MetaFinancieraService();
