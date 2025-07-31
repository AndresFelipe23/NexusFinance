import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Tag, Save } from 'lucide-react';
import { gsap } from 'gsap';
import { categoriaService } from '../services/categoriaService';
import { categoriasPresupuestoService } from '../services/categoriasPresupuestoService';
import { authService } from '../services/authService';
import type { Categoria } from '../types/categoria';
import type { CategoriaPresupuesto } from '../types/categoriaPresupuesto';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';

interface CategoriaPresupuestoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuestoId: string;
  editingCategoria?: CategoriaPresupuesto | null;
}

const CategoriaPresupuestoFormModal: React.FC<CategoriaPresupuestoFormModalProps> = ({ isOpen, onClose, presupuestoId, editingCategoria }) => {
  const [categoriasGenerales, setCategoriasGenerales] = useState<Categoria[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(editingCategoria?.categoriaId || '');
  const [montoAsignado, setMontoAsignado] = useState<number>(editingCategoria?.montoAsignado || 0);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      const fetchCategoriasGenerales = async () => {
        try {
          const usuarioId = authService.getUserId();
          if (!usuarioId) {
            Swal.fire({
              title: 'Error',
              text: 'Usuario no autenticado.',
              icon: 'error',
              zIndex: 999999
            });
            return;
          }
          const data = await categoriaService.obtenerCategoriasPorUsuario(usuarioId, { soloActivas: true, tipoCategoria: 'gasto' });
          setCategoriasGenerales(data);
        } catch (error) {
          console.error('Error al cargar categorías generales:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar las categorías generales.',
            icon: 'error',
            zIndex: 999999
          });
        }
      };
      fetchCategoriasGenerales();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingCategoria) {
      setSelectedCategoriaId(editingCategoria.categoriaId);
      setMontoAsignado(editingCategoria.montoAsignado);
    } else {
      setSelectedCategoriaId('');
      setMontoAsignado(0);
    }
    setHasChanges(false); // Resetear al abrir/cambiar de edición
  }, [editingCategoria, isOpen]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const currentCategoriaId = editingCategoria?.categoriaId || '';
    const currentMontoAsignado = editingCategoria?.montoAsignado || 0;

    const formHasChanges = 
      selectedCategoriaId !== currentCategoriaId ||
      montoAsignado !== currentMontoAsignado;

    setHasChanges(formHasChanges);
  }, [selectedCategoriaId, montoAsignado, editingCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoriaId || montoAsignado <= 0) {
      Swal.fire({
        title: 'Advertencia',
        text: 'Por favor, selecciona una categoría y un monto válido.',
        icon: 'warning',
        zIndex: 999999
      });
      return;
    }

    setLoading(true);
    try {
      if (editingCategoria) {
        await categoriasPresupuestoService.actualizarCategoriaPresupuesto(
          editingCategoria.categoriaPresupuestoId,
          { categoriaPresupuestoId: editingCategoria.categoriaPresupuestoId, montoAsignado }
        );
        Swal.fire({
          title: 'Éxito',
          text: 'Categoría del presupuesto actualizada exitosamente.',
          icon: 'success',
          zIndex: 999999
        });
      } else {
        await categoriasPresupuestoService.crearCategoriaPresupuesto({
          presupuestoId,
          categoriaId: selectedCategoriaId,
          montoAsignado,
        });
        Swal.fire({
          title: 'Éxito',
          text: 'Categoría asignada al presupuesto exitosamente.',
          icon: 'success',
          zIndex: 999999
        });
      }
      onClose(); // Cierra el modal y recarga las categorías en el modal padre
    } catch (error) {
      let errorMessage = 'No se pudo guardar la categoría del presupuesto.';
      if (AxiosError.isAxiosError(error) && error.response) {
        // Si el backend devuelve un mensaje de error especfico
        if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && typeof error.response.data === 'object' && error.response.data.errors) {
          // Manejo de errores de validacin de .NET Core
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join('\n');
        }
      }
      console.error('Error al guardar categoría del presupuesto:', error);
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        zIndex: 999999
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6b7280',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando',
        reverseButtons: true,
        zIndex: 999999,
        customClass: {
          popup: 'rounded-xl'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          onClose();
        }
      });
    } else {
      onClose();
    }
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden z-[99999]"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{editingCategoria ? 'Editar' : 'Añadir'} Categoría</h2>
                <p className="text-blue-100 text-sm">
                  {editingCategoria ? 'Modifica el monto asignado a esta categoría' : 'Asigna una categoría existente a este presupuesto'}
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoría General</label>
            <select
              id="categoria"
              value={selectedCategoriaId}
              onChange={(e) => setSelectedCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!editingCategoria} // Deshabilitar si se está editando
            >
              <option value="">Selecciona una categoría</option>
              {categoriasGenerales.map(cat => (
                <option key={cat.categoriaId} value={cat.categoriaId}>
                  {cat.nombreCategoria}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">Monto Asignado</label>
            <input
              type="number"
              id="monto"
              value={montoAsignado}
              onChange={(e) => setMontoAsignado(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 500.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          
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
              disabled={loading || (!selectedCategoriaId && !editingCategoria) || montoAsignado <= 0}
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
                  <span>{editingCategoria ? 'Actualizar' : 'Añadir'} Categoría</span>
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

export default CategoriaPresupuestoFormModal;