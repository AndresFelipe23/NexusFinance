import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { documentosViajeService } from '../services/documentosViajeService';
import FileUpload from './FileUpload';
import type { DocumentoViaje } from '../types/documentoViaje';
import Swal from 'sweetalert2';

interface DocumentoViajeModalProps {
  onClose: () => void;
  onSuccess: (action: 'created' | 'updated', documento: DocumentoViaje) => void;
  planId: string;
  editingDocumento?: DocumentoViaje | null;
}

const TIPOS_DOCUMENTO = [
  { value: 'pasaporte', label: 'Pasaporte', icon: '🛂' },
  { value: 'visa', label: 'Visa', icon: '📋' },
  { value: 'reservas', label: 'Reservas', icon: '🏨' },
  { value: 'seguros', label: 'Seguros', icon: '🛡️' },
  { value: 'vuelos', label: 'Vuelos', icon: '✈️' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'actividades', label: 'Actividades', icon: '🎫' },
  { value: 'financiero', label: 'Financiero', icon: '💰' },
  { value: 'salud', label: 'Salud', icon: '⚕️' },
  { value: 'otros', label: 'Otros', icon: '📎' }
];

const DocumentoViajeModal: React.FC<DocumentoViajeModalProps> = ({
  onClose,
  onSuccess,
  planId,
  editingDocumento
}) => {
  console.log('DocumentoViajeModal renderizado:', { planId, editingDocumento });
  const [formData, setFormData] = useState({
    tipoDocumento: '',
    nombreDocumento: '',
    numeroDocumento: '',
    fechaExpedicion: '',
    fechaVencimiento: '',
    notas: '',
    esObligatorio: false,
    estaVerificado: false
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isEditing = !!editingDocumento;

  useEffect(() => {
    if (editingDocumento) {
      setFormData({
        tipoDocumento: editingDocumento.tipoDocumento || '',
        nombreDocumento: editingDocumento.nombreDocumento || '',
        numeroDocumento: editingDocumento.numeroDocumento || '',
        fechaExpedicion: editingDocumento.fechaExpedicion ? new Date(editingDocumento.fechaExpedicion).toISOString().split('T')[0] : '',
        fechaVencimiento: editingDocumento.fechaVencimiento ? new Date(editingDocumento.fechaVencimiento).toISOString().split('T')[0] : '',
        notas: editingDocumento.notas || '',
        esObligatorio: editingDocumento.esObligatorio || false,
        estaVerificado: editingDocumento.estaVerificado || false
      });
      setUploadedFileUrl(editingDocumento.urlArchivo || '');
    }
  }, [editingDocumento]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUploadComplete = (url: string) => {
    setUploadedFileUrl(url);
    setSelectedFile(null);
  };

  const handleUploadError = (error: string) => {
    Swal.fire({
      title: 'Error',
      text: error,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipoDocumento || !formData.nombreDocumento) {
      Swal.fire({
        title: 'Campos requeridos',
        text: 'Por favor completa los campos obligatorios',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalFileUrl = uploadedFileUrl;

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        const uploadResult = await documentosViajeService.subirArchivo(
          {
            planId,
            tipoDocumento: formData.tipoDocumento,
            archivo: selectedFile
          },
          setUploadProgress
        );
        finalFileUrl = uploadResult.urlArchivo;
      }

      if (isEditing && editingDocumento) {
        // Actualizar documento existente
        const updatedDocumento = await documentosViajeService.actualizarDocumento({
          documentoId: editingDocumento.documentoId,
          tipoDocumento: formData.tipoDocumento,
          nombreDocumento: formData.nombreDocumento,
          numeroDocumento: formData.numeroDocumento,
          fechaExpedicion: formData.fechaExpedicion || undefined,
          fechaVencimiento: formData.fechaVencimiento || undefined,
          urlArchivo: finalFileUrl,
          notas: formData.notas,
          esObligatorio: formData.esObligatorio,
          estaVerificado: formData.estaVerificado
        });

        onSuccess('updated', updatedDocumento);
        onClose(); // Cerrar modal después de actualizar
      } else {
        // Crear nuevo documento
        const newDocumento = await documentosViajeService.crearDocumento({
          planId,
          tipoDocumento: formData.tipoDocumento,
          nombreDocumento: formData.nombreDocumento,
          numeroDocumento: formData.numeroDocumento,
          fechaExpedicion: formData.fechaExpedicion || undefined,
          fechaVencimiento: formData.fechaVencimiento || undefined,
          urlArchivo: finalFileUrl,
          notas: formData.notas,
          esObligatorio: formData.esObligatorio,
          estaVerificado: formData.estaVerificado
        });

        onSuccess('created', newDocumento);
        onClose(); // Cerrar modal después de crear
      }
    } catch (error) {
      console.error('Error al guardar documento:', error);
      Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Error al guardar el documento',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      default:
        return '📎';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-fuchsia-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Documento' : 'Nuevo Documento'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Modifica la información del documento' : 'Agrega un nuevo documento al viaje'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona un tipo</option>
              {TIPOS_DOCUMENTO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre del Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento *
            </label>
            <input
              type="text"
              name="nombreDocumento"
              value={formData.nombreDocumento}
              onChange={handleInputChange}
              required
              placeholder="Ej: Pasaporte colombiano, Visa Schengen, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Número de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento
            </label>
            <input
              type="text"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleInputChange}
              placeholder="Ej: 123456789, ABC123456, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Expedición
              </label>
              <input
                type="date"
                name="fechaExpedicion"
                value={formData.fechaExpedicion}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo del Documento
            </label>
            
            {uploadedFileUrl ? (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(uploadedFileUrl)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Archivo subido
                      </p>
                      <p className="text-xs text-gray-500">
                        Documento disponible
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver archivo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={uploadedFileUrl}
                      download
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Descargar archivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                onFileSelect={handleFileSelect}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadProgress={setUploadProgress}
                acceptedTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'image/gif',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]}
                maxSizeMB={10}
              />
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows={3}
              placeholder="Información adicional sobre el documento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="esObligatorio"
                checked={formData.esObligatorio}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Documento obligatorio</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="estaVerificado"
                checked={formData.estaVerificado}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Documento verificado</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                isEditing ? 'Actualizar Documento' : 'Crear Documento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentoViajeModal; 