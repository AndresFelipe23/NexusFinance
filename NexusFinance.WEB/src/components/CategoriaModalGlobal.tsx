import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Tag, ChevronDown, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { categoriaService } from '../services/categoriaService';
import { authService } from '../services/authService';
import type { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from '../types/categoria';
import Swal from 'sweetalert2';

interface CategoriaModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategoria?: Categoria | null;
}

interface TipoCategoria {
  valor: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
}

const iconosDisponibles = [
  { value: 'categoria', label: '📁 Categoría', icon: '📁' },
  { value: 'comida', label: '🍽️ Comida', icon: '🍽️' },
  { value: 'transporte', label: '🚗 Transporte', icon: '🚗' },
  { value: 'entretenimiento', label: '🎮 Entretenimiento', icon: '🎮' },
  { value: 'salud', label: '🏥 Salud', icon: '🏥' },
  { value: 'educacion', label: '📚 Educación', icon: '📚' },
  { value: 'ropa', label: '👕 Ropa', icon: '👕' },
  { value: 'hogar', label: '🏠 Hogar', icon: '🏠' },
  { value: 'servicios', label: '⚡ Servicios', icon: '⚡' },
  { value: 'viajes', label: '✈️ Viajes', icon: '✈️' },
  { value: 'deportes', label: '⚽ Deportes', icon: '⚽' },
  { value: 'tecnologia', label: '💻 Tecnología', icon: '💻' },
  { value: 'salario', label: '💰 Salario', icon: '💰' },
  { value: 'inversion', label: '📈 Inversión', icon: '📈' },
  { value: 'regalo', label: '🎁 Regalo', icon: '🎁' },
  { value: 'otros', label: '📦 Otros', icon: '📦' }
];

const coloresDisponibles = [
  { value: '#3B82F6', label: 'Azul', color: '#3B82F6' },
  { value: '#10B981', label: 'Verde', color: '#10B981' },
  { value: '#F59E0B', label: 'Amarillo', color: '#F59E0B' },
  { value: '#EF4444', label: 'Rojo', color: '#EF4444' },
  { value: '#8B5CF6', label: 'Púrpura', color: '#8B5CF6' },
  { value: '#EC4899', label: 'Rosa', color: '#EC4899' },
  { value: '#06B6D4', label: 'Cian', color: '#06B6D4' },
  { value: '#84CC16', label: 'Lima', color: '#84CC16' },
  { value: '#F97316', label: 'Naranja', color: '#F97316' },
  { value: '#6B7280', label: 'Gris', color: '#6B7280' }
];

const CategoriaModalGlobal: React.FC<CategoriaModalGlobalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingCategoria 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriasPadre, setCategoriasPadre] = useState<Categoria[]>([]);
  const [tiposCategoria, setTiposCategoria] = useState<TipoCategoria[]>([]);
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
      if (isOpen && overlayRef.current && contentRef.current) {
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
      } else if (!isOpen && modalRef.current && overlayRef.current && contentRef.current) {
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
      cargarTiposCategoria();
      cargarCategoriasPadre();
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
        resetForm();
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

  const cargarTiposCategoria = async () => {
    try {
      const tipos = await categoriaService.obtenerTiposCategoria();
      setTiposCategoria(tipos);
    } catch (err) {
      console.error('Error al cargar tipos de categoría:', err);
    }
  };

  const cargarCategoriasPadre = async () => {
    try {
      const usuarioId = authService.getUserId();
      if (usuarioId) {
        const categorias = await categoriaService.obtenerCategoriasPadre(usuarioId, formData.tipoCategoria);
        setCategoriasPadre(categorias);
      }
    } catch (err) {
      console.error('Error al cargar categorías padre:', err);
    }
  };

  const resetForm = () => {
    const usuarioId = authService.getUserId();
    setFormData({
      usuarioId: usuarioId || '',
      nombreCategoria: '',
      tipoCategoria: 'gasto',
      categoriaIdPadre: undefined,
      color: '#3B82F6',
      icono: 'categoria'
    });
    setError('');
  };

  const handleChange = (field: keyof CrearCategoriaDTO, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si cambia el tipo de categoría, recargar categorías padre
    if (field === 'tipoCategoria') {
      cargarCategoriasPadre();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombreCategoria.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingCategoria) {
        // Actualizar categoría existente
        const updateData: ActualizarCategoriaDTO = {
          categoriaId: editingCategoria.categoriaId,
          nombreCategoria: formData.nombreCategoria,
          categoriaIdPadre: formData.categoriaIdPadre,
          color: formData.color,
          icono: formData.icono,
          estaActivo: editingCategoria.estaActivo // Mantener el estado actual
        };
        
        console.log('Datos a actualizar:', updateData);
        console.log('FormData actual:', formData);
        
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
      setError(`Error al ${editingCategoria ? 'actualizar' : 'crear'} la categoría: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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

  const getIconoSeleccionado = () => {
    const icono = iconosDisponibles.find(i => i.value === formData.icono);
    return icono ? icono.icon : '📁';
  };

  const getColorSeleccionado = () => {
    return formData.color || '#3B82F6';
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Tag className="w-6 h-6" />
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
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                value={formData.nombreCategoria}
                onChange={(e) => handleChange('nombreCategoria', e.target.value)}
                placeholder="Ej: Comida, Transporte, Entretenimiento..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Tipo de categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de categoría *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tiposCategoria.length > 0 ? (
                  tiposCategoria.map((tipo) => (
                    <div key={tipo.valor} className="relative group">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.tipoCategoria === tipo.valor
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="tipoCategoria"
                          value={tipo.valor}
                          checked={formData.tipoCategoria === tipo.valor}
                          onChange={(e) => handleChange('tipoCategoria', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{tipo.nombre}</div>
                          <div className="text-sm text-gray-600">{tipo.descripcion}</div>
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  // Fallback mientras se cargan los tipos
                  <>
                    <div className="relative group">
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
                          onChange={(e) => handleChange('tipoCategoria', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-red-700">💸 Gasto</div>
                          <div className="text-sm text-red-600">Para gastos y egresos</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="relative group">
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
                          onChange={(e) => handleChange('tipoCategoria', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-green-700">💰 Ingreso</div>
                          <div className="text-sm text-green-600">Para ingresos y ganancias</div>
                        </div>
                      </label>
                    </div>

                    <div className="relative group">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.tipoCategoria === 'transferencia'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="tipoCategoria"
                          value="transferencia"
                          checked={formData.tipoCategoria === 'transferencia'}
                          onChange={(e) => handleChange('tipoCategoria', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-blue-700">🔄 Transferencia</div>
                          <div className="text-sm text-blue-600">Para movimientos entre cuentas</div>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Categoría padre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría padre (opcional)
              </label>
              <select
                value={formData.categoriaIdPadre || ''}
                onChange={(e) => handleChange('categoriaIdPadre', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Sin categoría padre</option>
                {categoriasPadre.map(categoria => (
                  <option key={categoria.categoriaId} value={categoria.categoriaId}>
                    {categoria.nombreCategoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Icono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconos(!showIconos)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getIconoSeleccionado()}</span>
                    <span className="text-gray-700">Seleccionar icono</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showIconos ? 'rotate-180' : ''}`} />
                </button>
                
                {showIconos && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {iconosDisponibles.map(icono => (
                        <button
                          key={icono.value}
                          type="button"
                          onClick={() => {
                            handleChange('icono', icono.value);
                            setShowIconos(false);
                          }}
                          className={`p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                            formData.icono === icono.value ? 'bg-blue-100 border-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="text-2xl">{icono.icon}</div>
                          <div className="text-xs text-gray-600 mt-1">{icono.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColores(!showColores)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: getColorSeleccionado() }}
                    />
                    <span className="text-gray-700">Seleccionar color</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showColores ? 'rotate-180' : ''}`} />
                </button>
                
                {showColores && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <div className="grid grid-cols-5 gap-2 p-3">
                      {coloresDisponibles.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            handleChange('color', color.value);
                            setShowColores(false);
                          }}
                          className={`p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                            formData.color === color.value ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-full mx-auto"
                            style={{ backgroundColor: color.color }}
                          />
                          <div className="text-xs text-gray-600 mt-1">{color.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campo de Estado (solo para edición) */}
            {editingCategoria && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la Categoría
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estado"
                      value="activa"
                      checked={editingCategoria.estaActivo === true}
                      onChange={() => {
                        if (editingCategoria) {
                          // setEditingCategoria({ // This line was removed as per the edit hint
                          //   ...editingCategoria,
                          //   estaActivo: true
                          // });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Activa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estado"
                      value="inactiva"
                      checked={editingCategoria.estaActivo === false}
                      onChange={() => {
                        if (editingCategoria) {
                          // setEditingCategoria({ // This line was removed as per the edit hint
                          //   ...editingCategoria,
                          //   estaActivo: false
                          // });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Inactiva</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Las categorías inactivas no aparecerán en las listas de selección
                </p>
              </div>
            )}

            {/* Vista previa */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa</h4>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: getColorSeleccionado() }}
                >
                  <span className="text-lg">{getIconoSeleccionado()}</span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">
                    {formData.nombreCategoria || 'Nombre de la categoría'}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {formData.tipoCategoria === 'gasto' ? '💸 Gasto' : 
                     formData.tipoCategoria === 'ingreso' ? '💰 Ingreso' :
                     formData.tipoCategoria === 'transferencia' ? '🔄 Transferencia' :
                     formData.tipoCategoria === 'inversion' ? '📈 Inversión' :
                     formData.tipoCategoria === 'ahorro' ? '🏦 Ahorro' :
                     formData.tipoCategoria === 'credito' ? '💳 Crédito' :
                     formData.tipoCategoria === 'deuda' ? '💸 Deuda' : '📁 Categoría'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
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
      </div>
    </div>,
    document.body
  );
};

export default CategoriaModalGlobal; 