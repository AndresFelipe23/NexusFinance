import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, DollarSign, Loader2, Calendar, FileText, Link, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { transaccionService } from '../services/transaccionService';
import { categoriaService } from '../services/categoriaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import type { Transaccion, CrearTransaccionDTO, ActualizarTransaccionDTO } from '../types/transaccion';
import type { Categoria } from '../types/categoria';
import type { Cuenta } from '../types/cuenta';

interface TransaccionModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaccion?: Transaccion | null;
}

const tiposTransaccion = [
  { 
    value: 'ingreso', 
    nombre: 'Ingreso', 
    descripcion: 'Dinero que entra a tu cuenta',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500'
  },
  { 
    value: 'gasto', 
    nombre: 'Gasto', 
    descripcion: 'Dinero que sale de tu cuenta',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500'
  },
  { 
    value: 'transferencia', 
    nombre: 'Transferencia', 
    descripcion: 'Movimiento entre cuentas',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500'
  }
];

const TransaccionModalGlobal: React.FC<TransaccionModalGlobalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingTransaccion 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Referencias para animaciones
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<CrearTransaccionDTO>({
    usuarioId: '',
    cuentaId: '',
    categoriaId: '',
    monto: 0,
    tipoTransaccion: 'gasto',
    descripcion: '',
    notas: '',
    fechaTransaccion: new Date().toISOString().split('T')[0],
    urlRecibo: '',
    estaConciliado: false
  });

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
      cargarDatosIniciales();
      if (editingTransaccion) {
        setFormData({
          usuarioId: editingTransaccion.usuarioId,
          cuentaId: editingTransaccion.cuentaId,
          categoriaId: editingTransaccion.categoriaId,
          monto: editingTransaccion.monto,
          tipoTransaccion: editingTransaccion.tipoTransaccion,
          descripcion: editingTransaccion.descripcion || '',
          notas: editingTransaccion.notas || '',
          fechaTransaccion: editingTransaccion.fechaTransaccion.split('T')[0],
          urlRecibo: editingTransaccion.urlRecibo || '',
          estaConciliado: editingTransaccion.estaConciliado || false
        });
      } else {
        resetForm();
      }
      setError('');
    }
  }, [isOpen, editingTransaccion]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cargarDatosIniciales = async () => {
    try {
      const usuarioId = authService.getUserId();
      if (usuarioId) {
        // Cargar cuentas
        const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId, true);
        setCuentas(cuentasData);
        
        // Cargar categorías
        const categoriasData = await categoriaService.obtenerCategoriasPorUsuario(usuarioId);
        setCategorias(categoriasData);
      }
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos iniciales');
    }
  };

  const resetForm = () => {
    const usuarioId = authService.getUserId();
    setFormData({
      usuarioId: usuarioId || '',
      cuentaId: '',
      categoriaId: '',
      monto: 0,
      tipoTransaccion: 'gasto',
      descripcion: '',
      notas: '',
      fechaTransaccion: new Date().toISOString().split('T')[0],
      urlRecibo: '',
      estaConciliado: false
    });
    setError('');
  };

  const handleChange = <K extends keyof CrearTransaccionDTO>(field: K, value: CrearTransaccionDTO[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cuentaId) {
      setError('Debes seleccionar una cuenta');
      return;
    }

    if (!formData.categoriaId) {
      setError('Debes seleccionar una categoría');
      return;
    }

    if (formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.descripcion?.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingTransaccion) {
        // Actualizar transacción existente
        const updateData: ActualizarTransaccionDTO = {
          transaccionId: editingTransaccion.transaccionId,
          cuentaId: formData.cuentaId,
          categoriaId: formData.categoriaId,
          monto: formData.monto,
          descripcion: formData.descripcion,
          notas: formData.notas,
          fechaTransaccion: formData.fechaTransaccion,
          urlRecibo: formData.urlRecibo,
          estaConciliado: formData.estaConciliado
        };
        
        await transaccionService.actualizarTransaccion(updateData);
      } else {
        // Crear nueva transacción
        await transaccionService.crearTransaccion(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(`Error al ${editingTransaccion ? 'actualizar' : 'crear'} la transacción: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  };

  const filtrarCategoriasPorTipo = () => {
    return categorias.filter(c => c.tipoCategoria === formData.tipoTransaccion);
  };

  const getTipoSeleccionado = () => {
    return tiposTransaccion.find(t => t.value === formData.tipoTransaccion) || tiposTransaccion[1];
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingTransaccion ? 'Editar Transacción' : 'Nueva Transacción'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingTransaccion ? 'Modifica los datos de la transacción' : 'Registra una nueva transacción financiera'}
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
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección 1: Tipo y Monto */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tipo de Transacción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Transacción *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {tiposTransaccion.map((tipo) => (
                      <label
                        key={tipo.value}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.tipoTransaccion === tipo.value
                            ? `${tipo.borderColor} ${tipo.bgColor} shadow-md`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoTransaccion"
                          value={tipo.value}
                          checked={formData.tipoTransaccion === tipo.value}
                          onChange={(e) => handleChange('tipoTransaccion', e.target.value as CrearTransaccionDTO['tipoTransaccion'])}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className={`text-lg font-semibold ${tipo.color}`}>{tipo.nombre}</div>
                          <div className="text-sm text-gray-600">{tipo.descripcion}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.tipoTransaccion === tipo.value 
                            ? `${tipo.borderColor} bg-current` 
                            : 'border-gray-300'
                        }`}></div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={loading}
                      value={formData.monto}
                      onChange={(e) => handleChange('monto', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                                placeholder:text-gray-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Cuenta y Categoría */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Clasificación
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cuenta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Cuenta *
                  </label>
                  <select
                    required
                    disabled={loading}
                    value={formData.cuentaId}
                    onChange={(e) => handleChange('cuentaId', e.target.value as CrearTransaccionDTO['cuentaId'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                  >
                    <option value="">Seleccionar cuenta</option>
                    {cuentas.map((cuenta) => (
                      <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                        {cuenta.nombreCuenta} - {cuenta.nombreBanco} ({cuenta.tipoCuenta})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categoría *
                  </label>
                  <select
                    required
                    disabled={loading}
                    value={formData.categoriaId}
                    onChange={(e) => handleChange('categoriaId', e.target.value as CrearTransaccionDTO['categoriaId'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              text-gray-700"
                  >
                    <option value="">Seleccionar categoría</option>
                    {filtrarCategoriasPorTipo().map((categoria) => (
                      <option key={categoria.categoriaId} value={categoria.categoriaId}>
                        {categoria.nombreCategoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 3: Descripción y Fecha */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Detalles
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={formData.descripcion}
                    onChange={(e) => handleChange('descripcion', e.target.value as CrearTransaccionDTO['descripcion'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="Ej: Compra en el supermercado"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={loading}
                    value={formData.fechaTransaccion}
                    onChange={(e) => handleChange('fechaTransaccion', e.target.value as CrearTransaccionDTO['fechaTransaccion'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Sección 4: Información Adicional */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                Información Adicional
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notas (Opcional)
                  </label>
                  <textarea
                    disabled={loading}
                    value={formData.notas}
                    onChange={(e) => handleChange('notas', e.target.value as CrearTransaccionDTO['notas'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400 resize-none"
                    placeholder="Información adicional sobre la transacción"
                    rows={3}
                  />
                </div>

                {/* URL del Recibo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    URL del Recibo (Opcional)
                  </label>
                  <input
                    type="url"
                    disabled={loading}
                    value={formData.urlRecibo}
                    onChange={(e) => handleChange('urlRecibo', e.target.value as CrearTransaccionDTO['urlRecibo'])}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200
                              placeholder:text-gray-400"
                    placeholder="https://ejemplo.com/recibo.pdf"
                  />
                </div>
              </div>

              {/* Conciliado */}
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="conciliado"
                  disabled={loading}
                  checked={formData.estaConciliado}
                  onChange={(e) => handleChange('estaConciliado', e.target.checked as CrearTransaccionDTO['estaConciliado'])}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <label htmlFor="conciliado" className="ml-3 text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Transacción conciliada
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-8 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.descripcion?.trim() || !formData.cuentaId || !formData.categoriaId || formData.monto <= 0}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 hover:shadow-lg disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingTransaccion ? 'Actualizar' : 'Crear'} Transacción</span>
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

export default TransaccionModalGlobal; 