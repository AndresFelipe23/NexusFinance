import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit, Trash2, PieChart } from 'lucide-react';
import { gsap } from 'gsap';
import type { Presupuesto } from '../types/presupuesto';
import type { CategoriaPresupuesto } from '../types/categoriaPresupuesto';
import { categoriasPresupuestoService } from '../services/categoriasPresupuestoService';
import CategoriaPresupuestoFormModal from './CategoriaPresupuestoFormModal';
import Swal from 'sweetalert2';

interface CategoriasPresupuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto: Presupuesto | null;
}

const CategoriasPresupuestoModal: React.FC<CategoriasPresupuestoModalProps> = ({ isOpen, onClose, presupuesto }) => {
  const [categorias, setCategorias] = useState<CategoriaPresupuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPresupuesto | null>(null);

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOpenFormModal = (categoria?: CategoriaPresupuesto) => {
    setEditingCategoria(categoria || null);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    // Recargar categorías después de añadir/editar
    if (presupuesto) {
      const fetchCategorias = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await categoriasPresupuestoService.obtenerCategoriasPorPresupuesto(presupuesto.presupuestoId);
          setCategorias(data);
        } catch (err) {
          setError('Error al cargar las categorías.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchCategorias();
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la categoría "${nombre}" de este presupuesto? Esta acción no se puede deshacer.`, 
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      zIndex: 999999, // Mayor que el z-index del modal
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        await categoriasPresupuestoService.eliminarCategoriaPresupuesto(id);
        Swal.fire({
          title: '¡Eliminada!',
          text: 'La categoría ha sido eliminada del presupuesto.',
          icon: 'success',
          zIndex: 999999
        });
        handleCloseFormModal(); // Recarga la lista de categorías
      } catch (err) {
        console.error('Error al eliminar categoría de presupuesto:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la categoría del presupuesto.',
          icon: 'error',
          zIndex: 999999
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen && presupuesto) {
      const fetchCategorias = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await categoriasPresupuestoService.obtenerCategoriasPorPresupuesto(presupuesto.presupuestoId);
          setCategorias(data);
        } catch (err) {
          setError('Error al cargar las categorías.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchCategorias();
    }
  }, [isOpen, presupuesto]);

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

  if (!isOpen || !presupuesto) return null;

  return createPortal(
    <div
      ref={modalRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} // Cierra el modal al hacer clic fuera
      />
      
      {/* Modal Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-[99999]">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Gestionar Categorías</h2>
                <p className="text-blue-100 text-sm">Asigna y organiza las categorías para "{presupuesto.nombrePresupuesto}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 min-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : categorias.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Este presupuesto aún no tiene categorías asignadas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categorias.map(cat => (
                <div key={cat.categoriaPresupuestoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.iconoCategoria || '📁'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{cat.nombreCategoria}</p>
                      <p className="text-sm text-gray-500">Gastado: {cat.montoGastado} de {cat.montoAsignado}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenFormModal(cat)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.categoriaPresupuestoId, cat.nombreCategoria)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={() => handleOpenFormModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Añadir Categoría
          </button>
        </div>
      </div>
      {presupuesto && (
        <CategoriaPresupuestoFormModal
          isOpen={showFormModal}
          onClose={handleCloseFormModal}
          presupuestoId={presupuesto.presupuestoId}
          editingCategoria={editingCategoria}
        />
      )}
    </div>,
    document.body
  );
};

export default CategoriasPresupuestoModal;