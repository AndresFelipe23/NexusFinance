import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Save, 
  Repeat, 
  Calendar, 
  DollarSign, 
  ChevronDown, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Info,
  Calculator,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  CreditCard,
  Tag,
  FileText
} from 'lucide-react';
import { gsap } from 'gsap';
import { transaccionRecurrenteService } from '../services/transaccionRecurrenteService';
import { categoriaService } from '../services/categoriaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import { mostrarAlerta } from '../utils/sweetalert2Config';
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
  bgColor: string;
  icono: React.ReactNode;
}

interface Frecuencia {
  valor: string;
  nombre: string;
  descripcion: string;
  ejemploProximaEjecucion: string;
  multiplicadorMensual: number;
}

const TransaccionRecurrenteModalMejorado: React.FC<TransaccionRecurrenteModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingTransaccion 
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  
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
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const tiposTransaccion: TipoTransaccion[] = [
    {
      valor: 'ingreso',
      nombre: 'Ingreso',
      descripcion: 'Dinero que entra regularmente',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icono: <TrendingUp className="h-5 w-5" />
    },
    {
      valor: 'gasto',
      nombre: 'Gasto',
      descripcion: 'Dinero que sale regularmente',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icono: <TrendingDown className="h-5 w-5" />
    },
    {
      valor: 'transferencia',
      nombre: 'Transferencia',
      descripcion: 'Movimiento entre cuentas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      icono: <ArrowRightLeft className="h-5 w-5" />
    }
  ];

  const frecuencias: Frecuencia[] = [
    {
      valor: 'diario',
      nombre: 'Diario',
      descripcion: 'Cada día',
      ejemploProximaEjecucion: 'Mañana',
      multiplicadorMensual: 30
    },
    {
      valor: 'semanal',
      nombre: 'Semanal',
      descripcion: 'Cada semana',
      ejemploProximaEjecucion: 'Próxima semana',
      multiplicadorMensual: 4.33
    },
    {
      valor: 'quincenal',
      nombre: 'Quincenal',
      descripcion: 'Cada 15 días',
      ejemploProximaEjecucion: 'En 15 días',
      multiplicadorMensual: 2
    },
    {
      valor: 'mensual',
      nombre: 'Mensual',
      descripcion: 'Cada mes',
      ejemploProximaEjecucion: 'Próximo mes',
      multiplicadorMensual: 1
    },
    {
      valor: 'bimestral',
      nombre: 'Bimestral',
      descripcion: 'Cada 2 meses',
      ejemploProximaEjecucion: 'En 2 meses',
      multiplicadorMensual: 0.5
    },
    {
      valor: 'trimestral',
      nombre: 'Trimestral',
      descripcion: 'Cada 3 meses',
      ejemploProximaEjecucion: 'En 3 meses',
      multiplicadorMensual: 0.33
    },
    {
      valor: 'anual',
      nombre: 'Anual',
      descripcion: 'Cada año',
      ejemploProximaEjecucion: 'Próximo año',
      multiplicadorMensual: 0.083
    }
  ];

  // Animaciones de entrada y salida
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isOpen && overlayRef.current && contentRef.current) {
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
      }
    });

    return () => ctx.revert();
  }, [isOpen]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
      if (editingTransaccion) {
        inicializarFormularioParaEdicion();
      } else {
        inicializarFormularioNuevo();
      }
    }
  }, [isOpen, editingTransaccion]);

  // Detectar cambios para mostrar advertencia al cerrar
  useEffect(() => {
    const initialData = editingTransaccion ? {
      cuentaId: editingTransaccion.cuentaId,
      categoriaId: editingTransaccion.categoriaId,
      monto: editingTransaccion.monto,
      tipoTransaccion: editingTransaccion.tipoTransaccion,
      descripcion: editingTransaccion.descripcion,
      frecuencia: editingTransaccion.frecuencia,
      fechaInicio: editingTransaccion.fechaInicio.split('T')[0],
      fechaFin: editingTransaccion.fechaFin?.split('T')[0]
    } : {
      cuentaId: '',
      categoriaId: '',
      monto: 0,
      tipoTransaccion: 'gasto',
      descripcion: '',
      frecuencia: 'mensual',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: undefined
    };

    const hasFormChanges = Object.keys(initialData).some(key => {
      const currentValue = formData[key as keyof typeof formData];
      const initialValue = initialData[key as keyof typeof initialData];
      return currentValue !== initialValue;
    });

    setHasChanges(hasFormChanges);
  }, [formData, editingTransaccion]);

  const cargarDatosIniciales = async () => {
    const usuario = authService.getUser();
    if (!usuario) return;

    try {
      setLoadingData(true);
      const [categoriasData, cuentasData] = await Promise.all([
        categoriaService.obtenerCategoriasPorUsuario(usuario.usuarioId),
        cuentaService.obtenerCuentasPorUsuario(usuario.usuarioId)
      ]);

      setCategorias(categoriasData.filter(c => c.estaActivo));
      setCuentas(cuentasData.filter(c => c.estaActivo));
      
      setFormData(prev => ({ ...prev, usuarioId: usuario.usuarioId }));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const inicializarFormularioParaEdicion = () => {
    if (!editingTransaccion) return;
    
    setFormData({
      usuarioId: editingTransaccion.usuarioId,
      cuentaId: editingTransaccion.cuentaId,
      categoriaId: editingTransaccion.categoriaId,
      monto: editingTransaccion.monto,
      tipoTransaccion: editingTransaccion.tipoTransaccion,
      descripcion: editingTransaccion.descripcion,
      frecuencia: editingTransaccion.frecuencia,
      fechaInicio: editingTransaccion.fechaInicio.split('T')[0],
      fechaFin: editingTransaccion.fechaFin?.split('T')[0]
    });
  };

  const inicializarFormularioNuevo = () => {
    const usuario = authService.getUser();
    if (!usuario) return;
    
    setFormData({
      usuarioId: usuario.usuarioId,
      cuentaId: '',
      categoriaId: '',
      monto: 0,
      tipoTransaccion: 'gasto',
      descripcion: '',
      frecuencia: 'mensual',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: undefined
    });
    setCurrentStep(1);
  };

  const handleInputChange = (field: keyof CrearTransaccionRecurrenteDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      // Animación del paso
      gsap.fromTo(stepRefs.current[currentStep], 
        { opacity: 0, x: 20 }, 
        { opacity: 1, x: 0, duration: 0.3 }
      );
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      gsap.fromTo(stepRefs.current[currentStep - 2], 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, duration: 0.3 }
      );
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.tipoTransaccion && formData.descripcion.trim();
      case 2:
        return formData.monto > 0 && formData.frecuencia;
      case 3:
        return formData.cuentaId && formData.categoriaId;
      case 4:
        return formData.fechaInicio;
      default:
        return true;
    }
  };

  const calcularMontoMensualEstimado = () => {
    const frecuencia = frecuencias.find(f => f.valor === formData.frecuencia);
    return frecuencia ? formData.monto * frecuencia.multiplicadorMensual : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones finales
      if (!formData.cuentaId || !formData.categoriaId || formData.monto <= 0) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }

      const fechaInicio = new Date(formData.fechaInicio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaInicio < hoy) {
        setError('La fecha de inicio no puede ser anterior a hoy');
        return;
      }

      if (formData.fechaFin) {
        const fechaFin = new Date(formData.fechaFin);
        if (fechaFin < fechaInicio) {
          setError('La fecha de fin no puede ser anterior a la fecha de inicio');
          return;
        }
      }

      if (editingTransaccion) {
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

        await transaccionRecurrenteService.actualizarTransaccionRecurrente(updateData);
        mostrarAlerta.exito('¡Actualizada!', 'Transacción recurrente actualizada exitosamente');
      } else {
        const createData: CrearTransaccionRecurrenteDTO = {
          ...formData,
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : undefined
        };

        await transaccionRecurrenteService.crearTransaccionRecurrente(createData);
        mostrarAlerta.exito('¡Creada!', 'Transacción recurrente creada exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setError(error.message || 'Error al guardar la transacción recurrente');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (hasChanges) {
      const result = await mostrarAlerta.confirmacion(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        'Sí, descartar',
        'Continuar editando'
      );

      if (!result.isConfirmed) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div ref={modalRef} className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Overlay mejorado */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div
        ref={contentRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
      >
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {editingTransaccion ? 'Editar' : 'Crear'} Transacción Recurrente
                </h2>
                <p className="text-blue-100 mt-1">
                  {editingTransaccion ? 'Modifica los detalles' : 'Automatiza tus finanzas'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar mejorada */}
          {!editingTransaccion && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Paso {currentStep} de 4</span>
                <span>{Math.round((currentStep / 4) * 100)}% completado</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {loadingData ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              {/* Paso 1: Tipo y descripción */}
              {(editingTransaccion || currentStep === 1) && (
                <div ref={el => stepRefs.current[0] = el} className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Información Básica
                    </h3>
                    <p className="text-gray-600">
                      Define el tipo y describe tu transacción recurrente
                    </p>
                  </div>

                  {/* Tipo de transacción mejorado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de transacción
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {tiposTransaccion.map((tipo) => (
                        <button
                          key={tipo.valor}
                          type="button"
                          onClick={() => handleInputChange('tipoTransaccion', tipo.valor)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            formData.tipoTransaccion === tipo.valor
                              ? `${tipo.bgColor} border-current ${tipo.color} ring-2 ring-current/20`
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <div className={`p-2 rounded-lg ${
                              formData.tipoTransaccion === tipo.valor 
                                ? `${tipo.color.replace('text-', 'text-')} bg-current/10`
                                : 'text-gray-400 bg-gray-100'
                            }`}>
                              {tipo.icono}
                            </div>
                          </div>
                          <h4 className="font-semibold text-sm">{tipo.nombre}</h4>
                          <p className="text-xs mt-1 opacity-75">{tipo.descripcion}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Descripción mejorada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={formData.descripcion}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      placeholder="Ej: Salario mensual, Alquiler, Netflix, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usa un nombre descriptivo que te ayude a identificar fácilmente esta transacción
                    </p>
                  </div>
                </div>
              )}

              {/* Paso 2: Monto y frecuencia */}
              {(editingTransaccion || currentStep === 2) && (
                <div ref={el => stepRefs.current[1] = el} className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Monto y Frecuencia
                    </h3>
                    <p className="text-gray-600">
                      Define cuánto y con qué frecuencia ocurre
                    </p>
                  </div>

                  {/* Monto con vista previa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Monto por ejecución
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monto}
                        onChange={(e) => handleInputChange('monto', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-semibold"
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        COP
                      </div>
                    </div>
                    {formData.monto > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Calculator className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Impacto mensual estimado: {transaccionRecurrenteService.formatearMonto(calcularMontoMensualEstimado())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Frecuencia mejorada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Frecuencia
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {frecuencias.map((freq) => (
                        <button
                          key={freq.valor}
                          type="button"
                          onClick={() => handleInputChange('frecuencia', freq.valor)}
                          className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                            formData.frecuencia === freq.valor
                              ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-sm">{freq.nombre}</div>
                          <div className="text-xs opacity-75 mt-1">{freq.descripcion}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Cuenta y categoría */}
              {(editingTransaccion || currentStep === 3) && (
                <div ref={el => stepRefs.current[2] = el} className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Cuenta y Categoría
                    </h3>
                    <p className="text-gray-600">
                      Selecciona desde dónde y cómo categorizar
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cuenta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Cuenta
                      </label>
                      <select
                        value={formData.cuentaId}
                        onChange={(e) => handleInputChange('cuentaId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Seleccionar cuenta</option>
                        {cuentas.map(cuenta => (
                          <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                            {cuenta.nombreCuenta} ({transaccionRecurrenteService.formatearMonto(cuenta.saldo)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag className="w-4 h-4 inline mr-1" />
                        Categoría
                      </label>
                      <select
                        value={formData.categoriaId}
                        onChange={(e) => handleInputChange('categoriaId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.filter(c => c.tipoCategoria === formData.tipoTransaccion).map(categoria => (
                          <option key={categoria.categoriaId} value={categoria.categoriaId}>
                            {categoria.nombreCategoria}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vista previa de selección */}
                  {formData.cuentaId && formData.categoriaId && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Configuración válida</span>
                      </div>
                      <div className="text-sm text-green-600">
                        <div>Cuenta: {cuentas.find(c => c.cuentaId === formData.cuentaId)?.nombreCuenta}</div>
                        <div>Categoría: {categorias.find(c => c.categoriaId === formData.categoriaId)?.nombreCategoria}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 4: Fechas */}
              {(editingTransaccion || currentStep === 4) && (
                <div ref={el => stepRefs.current[3] = el} className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Fechas de Ejecución
                    </h3>
                    <p className="text-gray-600">
                      Define cuándo inicia y termina la recurrencia
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha inicio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Fecha fin opcional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Fecha de fin (opcional)
                      </label>
                      <input
                        type="date"
                        value={formData.fechaFin || ''}
                        onChange={(e) => handleInputChange('fechaFin', e.target.value || undefined)}
                        min={formData.fechaInicio}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Si no especificas una fecha de fin, la transacción continuará indefinidamente
                      </p>
                    </div>
                  </div>

                  {/* Información de próximas ejecuciones */}
                  {formData.fechaInicio && formData.monto > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="font-medium">Vista previa</span>
                      </div>
                      <div className="text-sm text-blue-600 space-y-1">
                        <div>Primera ejecución: {new Date(formData.fechaInicio).toLocaleDateString()}</div>
                        <div>Monto por ejecución: {transaccionRecurrenteService.formatearMonto(formData.monto)}</div>
                        <div>Impacto mensual estimado: {transaccionRecurrenteService.formatearMonto(calcularMontoMensualEstimado())}</div>
                        {formData.fechaFin && (
                          <div>Última ejecución: {new Date(formData.fechaFin).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Footer con botones mejorado */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                {/* Navegación de pasos (solo para crear) */}
                {!editingTransaccion && (
                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                      >
                        Anterior
                      </button>
                    )}
                    {currentStep < 4 && (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!validateCurrentStep()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente
                      </button>
                    )}
                  </div>
                )}

                {/* Botones principales */}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  {(editingTransaccion || currentStep === 4) && (
                    <button
                      type="submit"
                      disabled={loading || !validateCurrentStep()}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingTransaccion ? 'Actualizar' : 'Crear'} Transacción
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TransaccionRecurrenteModalMejorado;