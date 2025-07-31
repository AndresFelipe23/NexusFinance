import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  StorageReference 
} from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  progress: number;
  downloadURL?: string;
}

class FirebaseStorageService {
  /**
   * Sube un archivo a Firebase Storage
   */
  async uploadFile(
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      if (onProgress) {
        onProgress(100);
      }
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw new Error(`Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Elimina un archivo de Firebase Storage
   */
  async deleteFile(fileURL: string): Promise<boolean> {
    try {
      // Crear referencia desde la URL
      const storageRef = ref(storage, fileURL);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  }

  /**
   * Obtiene la URL de descarga de un archivo
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error al obtener URL de descarga:', error);
      throw new Error(`Error al obtener URL de descarga: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Lista todos los archivos en una carpeta
   */
  async listFiles(folderPath: string): Promise<string[]> {
    try {
      const folderRef = ref(storage, folderPath);
      const result = await listAll(folderRef);
      return result.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Error al listar archivos:', error);
      return [];
    }
  }

  /**
   * Genera un nombre único para el archivo
   */
  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Valida el tipo y tamaño del archivo
   */
  validateFile(file: File, maxSizeMB: number = 10): { isValid: boolean; error?: string } {
    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB` 
      };
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Tipo de archivo no permitido. Solo se permiten PDF, imágenes, Word y Excel' 
      };
    }

    return { isValid: true };
  }
}

export const firebaseStorageService = new FirebaseStorageService(); 