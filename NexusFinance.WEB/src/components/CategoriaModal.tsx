import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Palette, Image, ChevronDown, Loader2 } from 'lucide-react';
import { categoriaService } from '../services/categoriaService';
import { authService } from '../services/authService';
import type { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from '../types/categoria';

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCategoria?: Categoria | null;
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

const CategoriaModal: React.FC<CategoriaModalProps> = ({ 
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

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, editingCategoria]);

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

  const handleChange = (field: keyof CrearCategoriaDTO, value: any) => {
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
          icono: formData.icono
        };
        
        console.log('Datos a actualizar:', updateData);
        console.log('FormData actual:', formData);
        
        await categoriaService.actualizarCategoria(editingCategoria.categoriaId, updateData);
      } else {
        // Crear nueva categoría
        await categoriaService.crearCategoria(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(`Error al ${editingCategoria ? 'actualizar' : 'crear'} la categoría: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden z-[99999]">
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
              onClick={onClose}
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
              onChange={(e) => handleChange('nombreCategoria', e.target.value)}
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
            <div className="grid grid-cols-3 gap-3">
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
                  <div className="text-sm text-green-600">Para ingresos y entradas</div>
                </div>
              </label>
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
          </div>

          {/* Categoría padre */}
          {categoriasPadre.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría padre (opcional)
              </label>
              <select
                value={formData.categoriaIdPadre || ''}
                onChange={(e) => handleChange('categoriaIdPadre', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin categoría padre</option>
                {categoriasPadre.map((categoria) => (
                  <option key={categoria.categoriaId} value={categoria.categoriaId}>
                    {categoria.nombreCategoria}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconos(!showIconos)}
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getIconoSeleccionado()}</span>
                  <span className="text-gray-700">Seleccionar icono</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              
              {showIconos && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2 p-3">
                    {iconosDisponibles.map((icono) => (
                      <button
                        key={icono.value}
                        type="button"
                        onClick={() => {
                          handleChange('icono', icono.value);
                          setShowIconos(false);
                        }}
                        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                          formData.icono === icono.value ? 'bg-blue-100 border border-blue-300' : ''
                        }`}
                        title={icono.label}
                      >
                        <span className="text-xl">{icono.icon}</span>
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
                className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorSeleccionado() }}
                  />
                  <span className="text-gray-700">Seleccionar color</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              
              {showColores && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <div className="grid grid-cols-5 gap-2 p-3">
                    {coloresDisponibles.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          handleChange('color', color.value);
                          setShowColores(false);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color.value ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
  );
};

export default CategoriaModal;