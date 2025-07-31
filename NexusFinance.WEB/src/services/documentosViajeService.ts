import { API_BASE_URL } from '../utils/constants';
import { authService } from './authService';
import { firebaseStorageService } from './firebaseStorageService';
import type { DocumentoViaje } from '../types/documentoViaje';

interface CrearDocumentoViajeDTO {
  planId: string;
  tipoDocumento: string;
  nombreDocumento: string;
  numeroDocumento?: string;
  fechaExpedicion?: string; // ISO date string
  fechaVencimiento?: string; // ISO date string
  urlArchivo?: string;
  notas?: string;
  esObligatorio?: boolean;
  estaVerificado?: boolean;
}

interface ActualizarDocumentoViajeDTO {
  documentoId: string;
  tipoDocumento?: string;
  nombreDocumento?: string;
  numeroDocumento?: string;
  fechaExpedicion?: string; // ISO date string
  fechaVencimiento?: string; // ISO date string
  urlArchivo?: string;
  notas?: string;
  esObligatorio?: boolean;
  estaVerificado?: boolean;
}

interface SubirDocumentoViajeArchivoDTO {
  planId: string;
  tipoDocumento: string;
  archivo: File;
}

class DocumentosViajeService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/DocumentosViaje${endpoint}`;
    console.log(`[SERVICE] Haciendo petición a: ${url}`);
    console.log(`[SERVICE] Método: ${options?.method || 'GET'}`);
    
    const response = await fetch(url,
      {
        headers: await this.getAuthHeaders(),
        ...options,
      }
    );
    if (!response.ok) {
      let errorMessage = 'Error en la petición';
      try {
        // Clonar response para poder leer el body múltiples veces si es necesario
        const responseClone = response.clone();
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const errorText = await responseClone.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        // Si falla la lectura, usar el status y statusText
        errorMessage = `${response.status} ${response.statusText}`;
      }
      
      console.error(`[SERVICE] Error ${response.status}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // Para operaciones que no devuelven contenido (como DELETE), retornar undefined
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }
    
    return response.json();
  }

  async crearDocumento(dto: CrearDocumentoViajeDTO): Promise<DocumentoViaje> {
    return this.request<DocumentoViaje>('', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async subirArchivo(dto: SubirDocumentoViajeArchivoDTO, onProgress?: (progress: number) => void): Promise<{ urlArchivo: string }> {
    try {
      // Validar archivo
      const validation = firebaseStorageService.validateFile(dto.archivo);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Crear FormData para enviar el archivo a la API
      const formData = new FormData();
      formData.append('archivo', dto.archivo);
      formData.append('planId', dto.planId);
      formData.append('tipoDocumento', dto.tipoDocumento);

      // Obtener token para autorización
      const token = authService.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Subir archivo a través de la API del backend
      const response = await fetch(`${API_BASE_URL}/DocumentosViaje/subir-archivo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NO incluir Content-Type para FormData, el navegador lo establecerá automáticamente
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al subir archivo');
      }

      const result = await response.json();
      
      if (onProgress) {
        onProgress(100);
      }

      return { urlArchivo: result.urlArchivo };
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw new Error(`Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async actualizarDocumento(dto: ActualizarDocumentoViajeDTO): Promise<DocumentoViaje> {
    return this.request<DocumentoViaje>('', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarDocumento(documentoId: string): Promise<void> {
    console.log(`[SERVICE] Eliminando documento con ID: ${documentoId}`);
    // El backend ya maneja la eliminación del archivo de Firebase automáticamente
    await this.request<void>(`/${documentoId}`, {
      method: 'DELETE',
    });
  }

  async obtenerDocumentoPorId(documentoId: string): Promise<DocumentoViaje> {
    return this.request<DocumentoViaje>(`/${documentoId}`);
  }

  async obtenerDocumentosPorPlan(planId: string, tipoDocumento?: string, estadoVerificacion?: boolean, soloObligatorios: boolean = false, soloVencidos: boolean = false, soloProximosVencer: boolean = false, ordenarPor: string = "Tipo"): Promise<DocumentoViaje[]> {
    const params = new URLSearchParams();
    params.append('planId', planId);
    if (tipoDocumento) params.append('tipoDocumento', tipoDocumento);
    if (estadoVerificacion !== undefined) params.append('estadoVerificacion', estadoVerificacion.toString());
    params.append('soloObligatorios', soloObligatorios.toString());
    params.append('soloVencidos', soloVencidos.toString());
    params.append('soloProximosVencer', soloProximosVencer.toString());
    params.append('ordenarPor', ordenarPor);
    return this.request<DocumentoViaje[]>(`/plan/${planId}?${params.toString()}`);
  }

  async marcarVerificado(documentoId: string, estaVerificado: boolean): Promise<DocumentoViaje> {
    return this.request<DocumentoViaje>(`/marcar-verificado/${documentoId}?estaVerificado=${estaVerificado}`, {
      method: 'POST',
    });
  }

  async obtenerResumen(planId: string): Promise<any> {
    return this.request<any>(`/resumen/${planId}`);
  }
}

export const documentosViajeService = new DocumentosViajeService();