import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import type { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from '../types/categoria';
import { categoriaService } from '../services/categoriaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategoria?: Categoria | null;
}

const GlobalModal: React.FC<GlobalModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingCategoria 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriasPadre, setCategoriasPadre] = useState<Categoria[]>([]);
  const [showIconos, setShowIconos] = useState(false);
  const [showColores, setShowColores] = useState(false);

  const [formData, setFormData] = useState<CrearCategoriaDTO>({
    usuarioId: '',
    nombreCategoria: '',
    tipoCategoria: 'gasto',
    categoriaIdPadre: undefined,
    color: '#3B82F6',
    icono: 'categoria'
  });

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Animaciones de entrada y salida
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen) {
        // Animación de entrada
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(contentRef.current, { opacity: 0, scale: 0.9, y: 20 });

        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out"
        });

        gsap.to(contentRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          delay: 0.1,
          ease: "power2.out"
        });
      } else if (modalRef.current) {
        // Animación de salida
        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.2,
          ease: "power2.in"
        });

        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          delay: 0.1,
          ease: "power2.in"
        });
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (editingCategoria) {
        setFormData({
          usuarioId: editingCategoria.usuarioId,
          nombreCategoria: editingCategoria.nombreCategoria,
          tipoCategoria: editingCategoria.tipoCategoria,
          categoriaIdPadre: editingCategoria.categoriaIdPadre,
          color: editingCategoria.color || '#3B82F6',
          icono: editingCategoria.icono || 'categoria'
        });
      } else {
        setFormData({
          usuarioId: '',
          nombreCategoria: '',
          tipoCategoria: 'gasto',
          categoriaIdPadre: undefined,
          color: '#3B82F6',
          icono: 'categoria'
        });
      }
      setError('');
    }
  }, [isOpen, editingCategoria]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      if (editingCategoria) {
        // Actualizar categoría existente
        const updateData: ActualizarCategoriaDTO = {
          categoriaId: editingCategoria.categoriaId,
          nombreCategoria: formData.nombreCategoria,
          categoriaIdPadre: formData.categoriaIdPadre,
          color: formData.color,
          icono: formData.icono
        };
        await categoriaService.actualizarCategoria(editingCategoria.categoriaId, updateData);
      } else {
        // Crear nueva categoría
        await categoriaService.crearCategoria(formData);
      }

      // Mostrar éxito
      await Swal.fire({
        title: '¡Guardado!',
        text: `Categoría ${editingCategoria ? 'actualizada' : 'creada'} exitosamente`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-xl'
        }
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      setError(`Error al ${editingCategoria ? 'actualizar' : 'crear'} la categoría: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (loading) return;
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  // Renderizar usando portal para que aparezca fuera del Layout
  return createPortal(
    <div
      ref={modalRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingCategoria ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para organizar tus transacciones'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
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

          {/* Nombre de la categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              value={formData.nombreCategoria}
              onChange={(e) => setFormData(prev => ({ ...prev, nombreCategoria: e.target.value }))}
              placeholder="Ej: Comida, Transporte, Entretenimiento..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Tipo de categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de categoría *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.tipoCategoria === 'gasto'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipoCategoria"
                  value="gasto"
                  checked={formData.tipoCategoria === 'gasto'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoCategoria: e.target.value as 'gasto' | 'ingreso' }))}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="font-medium text-red-700">💸 Gasto</div>
                  <div className="text-sm text-red-600">Para gastos y egresos</div>
                </div>
              </label>
              
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.tipoCategoria === 'ingreso'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="tipoCategoria"
                  value="ingreso"
                  checked={formData.tipoCategoria === 'ingreso'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoCategoria: e.target.value as 'gasto' | 'ingreso' }))}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="font-medium text-green-700">💰 Ingreso</div>
                  <div className="text-sm text-green-600">Para ingresos y entradas</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.nombreCategoria.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{editingCategoria ? 'Actualizar' : 'Crear'} Categoría</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default GlobalModal; 