import React, { useState, useEffect } from 'react';
import { 
  Target, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { metaFinancieraService } from '../services/metaFinancieraService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import type { MetaFinanciera } from '../types/metaFinanciera';
import type { Cuenta } from '../types/cuenta';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isCompleted: boolean;
}

interface WizardFormData {
  // Paso 1: Información básica
  nombreMeta: string;
  descripcion: string;
  tipoMeta: string;
  
  // Paso 2: Objetivos financieros
  montoObjetivo: number;
  montoActual: number;
  
  // Paso 3: Plazos
  fechaObjetivo: string;
  tieneFechaObjetivo: boolean;
  
  // Paso 4: Cuenta asociada
  cuentaId: string;
  usarCuenta: boolean;
  
  // Paso 5: Configuración avanzada
  recordatorios: boolean;
  contribucionesAutomaticas: boolean;
  montoContribucion: number;
  frecuenciaContribucion: 'semanal' | 'quincenal' | 'mensual';
}

const steps: WizardStep[] = [
  {
    id: 1,
    title: 'Información Básica',
    description: 'Define el nombre y tipo de tu meta',
    icon: Target,
    isCompleted: false
  },
  {
    id: 2,
    title: 'Objetivos Financieros',
    description: 'Establece el monto objetivo y actual',
    icon: DollarSign,
    isCompleted: false
  },
  {
    id: 3,
    title: 'Plazos',
    description: 'Define cuándo quieres alcanzar tu meta',
    icon: Calendar,
    isCompleted: false
  },
  {
    id: 4,
    title: 'Cuenta Asociada',
    description: 'Vincula una cuenta para el seguimiento',
    icon: CreditCard,
    isCompleted: false
  },
  {
    id: 5,
    title: 'Configuración Avanzada',
    description: 'Personaliza recordatorios y contribuciones',
    icon: TrendingUp,
    isCompleted: false
  }
];

const tiposMeta = [
  { value: 'ahorro', label: '💰 Ahorro', description: 'Ahorrar para algo específico' },
  { value: 'pago_deuda', label: '💳 Pago de Deuda', description: 'Pagar una deuda o préstamo' },
  { value: 'inversion', label: '📈 Inversión', description: 'Invertir para generar ingresos' }
];

const frecuenciasContribucion = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' }
];

const MetaFinancieraWizard: React.FC<WizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  const [formData, setFormData] = useState<WizardFormData>({
    nombreMeta: '',
    descripcion: '',
    tipoMeta: 'ahorro',
    montoObjetivo: 0,
    montoActual: 0,
    fechaObjetivo: '',
    tieneFechaObjetivo: false,
    cuentaId: '',
    usarCuenta: false,
    recordatorios: true,
    contribucionesAutomaticas: false,
    montoContribucion: 0,
    frecuenciaContribucion: 'mensual'
  });

  useEffect(() => {
    if (isOpen) {
      cargarCuentas();
    }
  }, [isOpen]);

  const cargarCuentas = async () => {
    try {
      setLoadingCuentas(true);
      const usuarioId = authService.getUserId();
      if (usuarioId) {
        const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId);
        setCuentas(cuentasData);
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
    } finally {
      setLoadingCuentas(false);
    }
  };

  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.nombreMeta.trim().length >= 3 && formData.tipoMeta !== '';
      case 2:
        return formData.montoObjetivo > 0 && formData.montoActual >= 0 && formData.montoActual <= formData.montoObjetivo;
      case 3:
        return !formData.tieneFechaObjetivo || (formData.fechaObjetivo && new Date(formData.fechaObjetivo) > new Date());
      case 4:
        return !formData.usarCuenta || formData.cuentaId !== '';
      case 5:
        return true; // Paso opcional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      setError('');
    } else {
      setError('Por favor completa todos los campos requeridos');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      const metaData = {
        usuarioId,
        nombreMeta: formData.nombreMeta,
        descripcion: formData.descripcion || undefined,
        montoObjetivo: formData.montoObjetivo,
        montoActual: formData.montoActual,
        fechaObjetivo: formData.tieneFechaObjetivo ? formData.fechaObjetivo : undefined,
        tipoMeta: formData.tipoMeta,
        cuentaId: formData.usarCuenta ? formData.cuentaId : undefined
      };

      await metaFinancieraService.crearMeta(metaData);
      
      // Aquí podrías configurar recordatorios y contribuciones automáticas
      if (formData.recordatorios || formData.contribucionesAutomaticas) {
        // Lógica para configurar notificaciones y contribuciones
        console.log('Configurando recordatorios y contribuciones...');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(`Error al crear la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la meta *
              </label>
              <input
                type="text"
                placeholder="Ej: Viaje a Europa, Pago de hipoteca..."
                value={formData.nombreMeta}
                onChange={e => handleChange('nombreMeta', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                placeholder="Describe tu meta con más detalle..."
                value={formData.descripcion}
                onChange={e => handleChange('descripcion', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de meta *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {tiposMeta.map(tipo => (
                  <label
                    key={tipo.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipoMeta === tipo.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoMeta"
                      value={tipo.value}
                      checked={formData.tipoMeta === tipo.value}
                      onChange={e => handleChange('tipoMeta', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{tipo.label}</div>
                      <div className="text-sm text-gray-600">{tipo.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto objetivo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <DollarSign size={20} />
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.montoObjetivo}
                  onChange={e => handleChange('montoObjetivo', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto actual (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <DollarSign size={20} />
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.montoActual}
                  onChange={e => handleChange('montoActual', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Si ya tienes dinero ahorrado para esta meta
              </p>
            </div>

            {formData.montoObjetivo > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-900">Progreso inicial</span>
                  <span className="text-sm font-bold text-blue-900">
                    {Math.round((formData.montoActual / formData.montoObjetivo) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (formData.montoActual / formData.montoObjetivo) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Te faltan ${(formData.montoObjetivo - formData.montoActual).toLocaleString()} para alcanzar tu meta
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="tieneFechaObjetivo"
                checked={formData.tieneFechaObjetivo}
                onChange={e => handleChange('tieneFechaObjetivo', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="tieneFechaObjetivo" className="text-sm font-medium text-gray-700">
                Establecer fecha objetivo
              </label>
            </div>

            {formData.tieneFechaObjetivo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha objetivo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Calendar size={20} />
                  </span>
                  <input
                    type="date"
                    value={formData.fechaObjetivo}
                    onChange={e => handleChange('fechaObjetivo', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.fechaObjetivo && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.ceil((new Date(formData.fechaObjetivo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                  </p>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">¿Por qué establecer una fecha?</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Una fecha objetivo te ayuda a mantener el enfoque y calcular cuánto necesitas ahorrar por período.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="usarCuenta"
                checked={formData.usarCuenta}
                onChange={e => handleChange('usarCuenta', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="usarCuenta" className="text-sm font-medium text-gray-700">
                Asociar una cuenta
              </label>
            </div>

            {formData.usarCuenta && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar cuenta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <CreditCard size={20} />
                  </span>
                  <select
                    value={formData.cuentaId}
                    onChange={e => handleChange('cuentaId', e.target.value)}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingCuentas}
                  >
                    <option value="">Selecciona una cuenta</option>
                    {loadingCuentas ? (
                      <option disabled>Cargando cuentas...</option>
                    ) : (
                      cuentas.map(cuenta => (
                        <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                          {cuenta.nombreCuenta} - ${cuenta.saldo?.toLocaleString() ?? 0} {cuenta.moneda}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Asociar una cuenta te permite hacer seguimiento automático de los fondos
                </p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-900">Beneficios de asociar una cuenta</h4>
                  <ul className="text-sm text-green-700 mt-1 space-y-1">
                    <li>• Seguimiento automático del saldo</li>
                    <li>• Transferencias directas a la meta</li>
                    <li>• Reportes integrados</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recordatorios"
                checked={formData.recordatorios}
                onChange={e => handleChange('recordatorios', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="recordatorios" className="text-sm font-medium text-gray-700">
                Activar recordatorios
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="contribucionesAutomaticas"
                checked={formData.contribucionesAutomaticas}
                onChange={e => handleChange('contribucionesAutomaticas', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="contribucionesAutomaticas" className="text-sm font-medium text-gray-700">
                Configurar contribuciones automáticas
              </label>
            </div>

            {formData.contribucionesAutomaticas && (
              <div className="space-y-4 pl-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto de contribución
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <DollarSign size={20} />
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.montoContribucion}
                      onChange={e => handleChange('montoContribucion', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <select
                    value={formData.frecuenciaContribucion}
                    onChange={e => handleChange('frecuenciaContribucion', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {frecuenciasContribucion.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Resumen de tu meta</h4>
                  <div className="text-sm text-blue-700 mt-2 space-y-1">
                    <p><strong>Meta:</strong> {formData.nombreMeta}</p>
                    <p><strong>Objetivo:</strong> ${formData.montoObjetivo.toLocaleString()}</p>
                    <p><strong>Actual:</strong> ${formData.montoActual.toLocaleString()}</p>
                    <p><strong>Faltante:</strong> ${(formData.montoObjetivo - formData.montoActual).toLocaleString()}</p>
                    {formData.tieneFechaObjetivo && formData.fechaObjetivo && (
                      <p><strong>Fecha objetivo:</strong> {new Date(formData.fechaObjetivo).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Crear Meta Financiera</h2>
              <p className="text-blue-100 mt-1">Sigue estos pasos para crear tu meta</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep > step.id
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-white border-white text-blue-600'
                    : 'bg-white/20 border-white/30 text-white'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Anterior</span>
          </button>

          <div className="text-sm text-gray-500">
            Paso {currentStep} de {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <span>Siguiente</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Crear Meta</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaFinancieraWizard; 