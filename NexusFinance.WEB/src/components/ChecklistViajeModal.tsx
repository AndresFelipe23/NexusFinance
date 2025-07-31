import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';
import { checklistViajeService } from '../services/checklistViajeService';
import type { ChecklistViaje, CreateChecklistViajeDTO, UpdateChecklistViajeDTO } from '../types/checklistViaje';
import Swal from 'sweetalert2';

interface ChecklistViajeModalProps {
  onClose: () => void;
  onSuccess: (action: 'created' | 'updated', itemName: string) => void;
  planId: string;
  editingItem?: ChecklistViaje | null;
}

const ChecklistViajeModal: React.FC<ChecklistViajeModalProps> = ({
  onClose,
  onSuccess,
  planId,
  editingItem
}) => {
  const [formData, setFormData] = useState({
    item: '',
    descripcion: '',
    categoriaChecklist: 'general' as 'documentos' | 'equipaje' | 'salud' | 'finanzas' | 'general',
    prioridad: 'media' as 'alta' | 'media' | 'baja',
    fechaLimite: '',
    ordenVisualizacion: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        item: editingItem.item,
        descripcion: editingItem.descripcion || '',
        categoriaChecklist: editingItem.categoriaChecklist,
        prioridad: editingItem.prioridad,
        fechaLimite: editingItem.fechaLimite ? editingItem.fechaLimite.split('T')[0] : '',
        ordenVisualizacion: editingItem.ordenVisualizacion
      });
    } else {
      setFormData({
        item: '',
        descripcion: '',
        categoriaChecklist: 'general',
        prioridad: 'media',
        fechaLimite: '',
        ordenVisualizacion: 0
      });
    }
    setError('');
  }, [editingItem]);

  const validateForm = (): boolean => {
    if (!formData.item.trim()) {
      setError('El item es requerido');
      return false;
    }
    
    if (formData.item.length > 300) {
      setError('El item no puede exceder 300 caracteres');
      return false;
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      setError('La descripción no puede exceder 500 caracteres');
      return false;
    }

    if (formData.fechaLimite) {
      const fechaLimite = new Date(formData.fechaLimite);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaLimite < hoy) {
        setError('La fecha límite no puede ser en el pasado');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (editingItem) {
        // Actualizar item existente
        const updateData: UpdateChecklistViajeDTO = {
          checklistId: editingItem.checklistId,
          item: formData.item.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          categoriaChecklist: formData.categoriaChecklist,
          prioridad: formData.prioridad,
          fechaLimite: formData.fechaLimite || undefined,
          ordenVisualizacion: formData.ordenVisualizacion
        };

        await checklistViajeService.actualizarItemChecklist(updateData);
      } else {
        // Crear nuevo item
        const createData: CreateChecklistViajeDTO = {
          planId,
          item: formData.item.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          categoriaChecklist: formData.categoriaChecklist,
          prioridad: formData.prioridad,
          fechaLimite: formData.fechaLimite || undefined,
          ordenVisualizacion: formData.ordenVisualizacion
        };

        await checklistViajeService.crearItemChecklist(createData);
      }

      onSuccess(editingItem ? 'updated' : 'created', formData.item.trim());
      onClose();
    } catch (err) {
      console.error('Error al guardar item:', err);
      setError(`Error al ${editingItem ? 'actualizar' : 'crear'} el item: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const getCategoriaIcon = (categoria: string): string => {
    const iconos = {
      documentos: '📄',
      equipaje: '🧳',
      salud: '⚕️',
      finanzas: '💰',
      general: '📋'
    };
    return iconos[categoria as keyof typeof iconos] || '📋';
  };

  const getCategoriaColor = (categoria: string): string => {
    const colores = {
      documentos: 'bg-blue-50 border-blue-200 text-blue-800',
      equipaje: 'bg-purple-50 border-purple-200 text-purple-800',
      salud: 'bg-green-50 border-green-200 text-green-800',
      finanzas: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      general: 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colores[categoria as keyof typeof colores] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getPrioridadIcon = (prioridad: string): string => {
    const iconos = {
      alta: '🔴',
      media: '🟡',
      baja: '🟢'
    };
    return iconos[prioridad as keyof typeof iconos] || '⚪';
  };



  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden z-[99999]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingItem ? 'Editar Item' : 'Nuevo Item de Checklist'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {editingItem ? 'Modifica los detalles del item' : 'Agrega un nuevo item al checklist de viaje'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {/* Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item del Checklist *
            </label>
            <input
              type="text"
              name="item"
              value={formData.item}
              onChange={handleInputChange}
              placeholder="Ej: Pasaporte vigente, Ropa para el clima..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={300}
              disabled={loading}
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              placeholder="Detalles adicionales sobre este item..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
              disabled={loading}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              name="categoriaChecklist"
              value={formData.categoriaChecklist}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="documentos">📄 Documentos</option>
              <option value="equipaje">🧳 Equipaje</option>
              <option value="salud">⚕️ Salud</option>
              <option value="finanzas">💰 Finanzas</option>
              <option value="general">📋 General</option>
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">🟢 Baja</option>
            </select>
          </div>

          {/* Fecha Límite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Límite (Opcional)
            </label>
            <input
              type="date"
              name="fechaLimite"
              value={formData.fechaLimite}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistViajeModal;