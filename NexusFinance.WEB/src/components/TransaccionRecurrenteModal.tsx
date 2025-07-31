import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Repeat, Calendar, DollarSign, ChevronDown, Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { gsap } from 'gsap';
import { transaccionRecurrenteService } from '../services/transaccionRecurrenteService';
import { categoriaService } from '../services/categoriaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import { sweetAlert } from '../utils/sweetAlert';
import type { 
  TransaccionRecurrente, 
  CrearTransaccionRecurrenteDTO, 
  ActualizarTransaccionRecurrenteDTO 
} from '../types/transaccionRecurrente';
import type { Categoria } from '../types/categoria';
import type { Cuenta } from '../types/cuenta';

interface TransaccionRecurrenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaccion?: TransaccionRecurrente | null;
}

interface TipoTransaccion {
  valor: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: React.ReactNode;
}

interface Frecuencia {
  valor: string;
  nombre: string;
  descripcion: string;
}

const TransaccionRecurrenteModal: React.FC<TransaccionRecurrenteModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingTransaccion 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [tiposTransaccion, setTiposTransaccion] = useState<TipoTransaccion[]>([]);
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([]);
  const [showCategorias, setShowCategorias] = useState(false);
  const [showCuentas, setShowCuentas] = useState(false);
  const [showTipos, setShowTipos] = useState(false);
  const [showFrecuencias, setShowFrecuencias] = useState(false);

  const [formData, setFormData] = useState<CrearTransaccionRecurrenteDTO>({
    usuarioId: '',
    cuentaId: '',
    categoriaId: '',
    monto: 0,
    tipoTransaccion: 'gasto',
    descripcion: '',
    frecuencia: 'mensual',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: undefined
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
      } else if (!isOpen && overlayRef.current && contentRef.current) {
        // Animación de salida
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in"
        });

        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.2,
          ease: "power2.in"
        });
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

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
          frecuencia: editingTransaccion.frecuencia,
          fechaInicio: editingTransaccion.fechaInicio.split('T')[0],
          fechaFin: editingTransaccion.fechaFin ? editingTransaccion.fechaFin.split('T')[0] : undefined
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingTransaccion]);

  const cargarDatosIniciales = async () => {
    try {
      const usuarioId = authService.getUserId();
      if (!usuarioId) return;

      const [
        categoriasData,
        cuentasData,
        tiposData,
        frecuenciasData
      ] = await Promise.all([
        categoriaService.obtenerCategoriasPorUsuario(usuarioId),
        cuentaService.obtenerCuentasPorUsuario(usuarioId),
        transaccionRecurrenteService.obtenerTiposTransaccion(),
        transaccionRecurrenteService.obtenerFrecuencias()
      ]);

      setCategorias(categoriasData);
      setCuentas(cuentasData);
      
      // Mapear tipos de transacción
      const tiposMapeados: TipoTransaccion[] = tiposData.map(tipo => ({
        valor: tipo,
        nombre: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        descripcion: `Transacción de ${tipo}`,
        color: transaccionRecurrenteService.obtenerColorPorTipo(tipo),
        icono: obtenerIconoTipo(tipo)
      }));
      setTiposTransaccion(tiposMapeados);

      // Mapear frecuencias
      const frecuenciasMapeadas: Frecuencia[] = frecuenciasData.map(frecuencia => ({
        valor: frecuencia,
        nombre: transaccionRecurrenteService.obtenerLabelPorFrecuencia(frecuencia),
        descripcion: `Se ejecuta ${transaccionRecurrenteService.obtenerLabelPorFrecuencia(frecuencia).toLowerCase()}`
      }));
      setFrecuencias(frecuenciasMapeadas);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar los datos iniciales');
    }
  };

  const resetForm = () => {
    const usuario = authService.getUser();
    setFormData({
      usuarioId: usuario?.usuarioId || '',
      cuentaId: '',
      categoriaId: '',
      monto: 0,
      tipoTransaccion: 'gasto',
      descripcion: '',
      frecuencia: 'mensual',
      fechaInicio: new Date().toISOString().split('T')[0], // Fecha actual
      fechaFin: undefined
    });
    setError('');
  };

  const handleChange = (field: keyof CrearTransaccionRecurrenteDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.cuentaId || !formData.categoriaId || formData.monto <= 0) {
        setError('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      // Validar que la fecha de inicio no sea anterior a hoy
      const fechaInicio = new Date(formData.fechaInicio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Resetear a inicio del día
      
      if (fechaInicio < hoy) {
        setError('La fecha de inicio no puede ser anterior a hoy');
        setLoading(false);
        return;
      }

      // Validar que la fecha fin no sea anterior a la fecha de inicio
      if (formData.fechaFin) {
        const fechaFin = new Date(formData.fechaFin);
        if (fechaFin < fechaInicio) {
          setError('La fecha de fin no puede ser anterior a la fecha de inicio');
          setLoading(false);
          return;
        }
      }

      if (editingTransaccion) {
        // Actualizar - Formatear fechas para el backend
        const updateData: ActualizarTransaccionRecurrenteDTO = {
          recurrenteId: editingTransaccion.recurrenteId,
          cuentaId: formData.cuentaId,
          categoriaId: formData.categoriaId,
          monto: formData.monto,
          descripcion: formData.descripcion,
          frecuencia: formData.frecuencia,
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : undefined,
          removerFechaFin: !formData.fechaFin
        };

        console.log('🔍 Debug - Datos a actualizar:', JSON.stringify(updateData, null, 2));

        await transaccionRecurrenteService.actualizarTransaccionRecurrente(updateData);
        await sweetAlert.mostrarExito('¡Éxito!', 'Transacción recurrente actualizada exitosamente');
      } else {
        // Crear - Enviar fechas como objetos Date
        const createData = {
          ...formData,
          fechaInicio: new Date(formData.fechaInicio),
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : undefined
        };
        
        console.log('🔍 Debug - Datos a enviar:', JSON.stringify(createData, null, 2));
        
        await transaccionRecurrenteService.crearTransaccionRecurrente(createData);
        await sweetAlert.mostrarExito('¡Éxito!', 'Transacción recurrente creada exitosamente');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error al guardar transacción recurrente:', err);
      setError(`Error al ${editingTransaccion ? 'actualizar' : 'crear'} la transacción recurrente`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    const ctx = gsap.context(() => {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in"
      });

      gsap.to(contentRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          onClose();
          resetForm();
        }
      });
    });

    return () => ctx.revert();
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

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ingreso':
        return <TrendingUp className="h-4 w-4" />;
      case 'gasto':
        return <TrendingDown className="h-4 w-4" />;
      case 'transferencia':
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const obtenerCategoriaSeleccionada = () => {
    return categorias.find(c => c.categoriaId === formData.categoriaId);
  };

  const obtenerCuentaSeleccionada = () => {
    return cuentas.find(c => c.cuentaId === formData.cuentaId);
  };

  const obtenerTipoSeleccionado = () => {
    return tiposTransaccion.find(t => t.valor === formData.tipoTransaccion);
  };

  const obtenerFrecuenciaSeleccionada = () => {
    return frecuencias.find(f => f.valor === formData.frecuencia);
  };

  const filtrarCategoriasPorTipo = () => {
    return categorias.filter(c => c.tipoCategoria === formData.tipoTransaccion);
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingTransaccion ? 'Editar Transacción Recurrente' : 'Nueva Transacción Recurrente'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {editingTransaccion ? 'Modifica los datos de la transacción' : 'Configura una nueva transacción automática'}
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
            {/* Tipo de Transacción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Transacción *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {tiposTransaccion.map((tipo) => (
                  <div key={tipo.valor} className="relative group">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipoTransaccion === tipo.valor
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="tipoTransaccion"
                        value={tipo.valor}
                        checked={formData.tipoTransaccion === tipo.valor}
                        onChange={(e) => handleChange('tipoTransaccion', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{tipo.nombre}</div>
                        <div className="text-sm text-gray-600">{tipo.descripcion}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cuenta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCuentas(!showCuentas)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <span className="text-gray-900">
                    {obtenerCuentaSeleccionada()?.nombreCuenta || 'Seleccionar cuenta'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCuentas ? 'rotate-180' : ''}`} />
                </button>
                
                {showCuentas && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {cuentas.map((cuenta) => (
                      <button
                        key={cuenta.cuentaId}
                        type="button"
                        onClick={() => {
                          handleChange('cuentaId', cuenta.cuentaId);
                          setShowCuentas(false);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{cuenta.nombreCuenta}</div>
                          <div className="text-sm text-gray-500">{cuenta.tipoCuenta}</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaccionRecurrenteService.formatearMonto(cuenta.saldo || 0)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategorias(!showCategorias)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {obtenerCategoriaSeleccionada() && (
                      <span 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: obtenerCategoriaSeleccionada()?.color }}
                      />
                    )}
                    <span className="text-gray-900">
                      {obtenerCategoriaSeleccionada()?.nombreCategoria || 'Seleccionar categoría'}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategorias ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategorias && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filtrarCategoriasPorTipo().map((categoria) => (
                      <button
                        key={categoria.categoriaId}
                        type="button"
                        onClick={() => {
                          handleChange('categoriaId', categoria.categoriaId);
                          setShowCategorias(false);
                        }}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 text-left"
                      >
                        <span 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: categoria.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{categoria.nombreCategoria}</div>
                          <div className="text-sm text-gray-500">{categoria.tipoCategoria}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => handleChange('monto', parseFloat(e.target.value) || 0)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: Pago de internet mensual"
              />
            </div>

            {/* Frecuencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFrecuencias(!showFrecuencias)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <span className="text-gray-900">
                    {obtenerFrecuenciaSeleccionada()?.nombre || 'Seleccionar frecuencia'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFrecuencias ? 'rotate-180' : ''}`} />
                </button>
                
                {showFrecuencias && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {frecuencias.map((frecuencia) => (
                      <button
                        key={frecuencia.valor}
                        type="button"
                        onClick={() => {
                          handleChange('frecuencia', frecuencia.valor);
                          setShowFrecuencias(false);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{frecuencia.nombre}</div>
                          <div className="text-sm text-gray-500">{frecuencia.descripcion}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fecha de Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  value={typeof formData.fechaInicio === 'string' ? formData.fechaInicio : formData.fechaInicio.toISOString().split('T')[0]}
                  onChange={(e) => handleChange('fechaInicio', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Fecha de Fin (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  min={typeof formData.fechaInicio === 'string' ? formData.fechaInicio : formData.fechaInicio.toISOString().split('T')[0]} // No permitir fechas anteriores a la fecha de inicio
                  value={formData.fechaFin ? (typeof formData.fechaFin === 'string' ? formData.fechaFin : formData.fechaFin.toISOString().split('T')[0]) : ''}
                  onChange={(e) => handleChange('fechaFin', e.target.value || undefined)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Dejar vacío para sin fecha de fin"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Deja vacío si la transacción no tiene fecha de finalización
              </p>
            </div>

            {/* Vista previa */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa</h4>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                  formData.tipoTransaccion === 'ingreso' ? 'bg-green-500' :
                  formData.tipoTransaccion === 'gasto' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}>
                  {obtenerIconoTipo(formData.tipoTransaccion)}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">
                    {formData.descripcion || 'Descripción de la transacción'}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {obtenerCuentaSeleccionada()?.nombreCuenta || 'Cuenta'} • {obtenerCategoriaSeleccionada()?.nombreCategoria || 'Categoría'}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {transaccionRecurrenteService.formatearMonto(formData.monto)} • {obtenerFrecuenciaSeleccionada()?.nombre || 'Frecuencia'}
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
                disabled={loading || !formData.descripcion?.trim() || !formData.cuentaId || !formData.categoriaId || formData.monto <= 0}
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
                    <span>{editingTransaccion ? 'Actualizar' : 'Crear'} Transacción Recurrente</span>
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

export default TransaccionRecurrenteModal; 