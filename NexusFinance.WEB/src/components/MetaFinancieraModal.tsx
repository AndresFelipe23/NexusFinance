import React, { useEffect, useState } from 'react';
import type { MetaFinanciera } from '../types/metaFinanciera';
import type { Cuenta } from '../types/cuenta';
import { metaFinancieraService, formatDateForInput } from '../services/metaFinancieraService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';
import { Calendar, DollarSign, TrendingUp, Target, Loader2, X, CreditCard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMeta: MetaFinanciera | null;
}

// Tipo específico para el formulario
interface MetaFormData {
  usuarioId: string;
  nombreMeta: string;
  descripcion: string;
  montoObjetivo: number;
  montoActual: number;
  fechaObjetivo: string;
  tipoMeta: string;
  cuentaId: string;
  estaCompletada?: boolean;
  fechaComplecion?: string;
}

const tiposMeta = [
  { value: 'ahorro', label: 'Ahorro', icon: <DollarSign className="w-4 h-4 mr-1" /> },
  { value: 'pago_deuda', label: 'Pago de deuda', icon: <TrendingUp className="w-4 h-4 mr-1" /> },
  { value: 'inversion', label: 'Inversión', icon: <Target className="w-4 h-4 mr-1" /> }
];

const MetaFinancieraModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, editingMeta }) => {
  const [form, setForm] = useState<MetaFormData>({
    usuarioId: '',
    nombreMeta: '',
    descripcion: '',
    montoObjetivo: 0,
    montoActual: 0,
    fechaObjetivo: '',
    tipoMeta: 'ahorro',
    cuentaId: '',
    estaCompletada: false,
    fechaComplecion: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);

  // Cargar cuentas del usuario
  const cargarCuentas = async () => {
    try {
      setLoadingCuentas(true);
      const usuarioId = authService.getUserId();
      if (usuarioId) {
        const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId, true);
        setCuentas(cuentasData);
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setCuentas([]);
    } finally {
      setLoadingCuentas(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarCuentas();
      
      if (editingMeta) {
        setForm({
          usuarioId: editingMeta.usuarioId,
          nombreMeta: editingMeta.nombreMeta,
          descripcion: editingMeta.descripcion ?? '',
          montoObjetivo: editingMeta.montoObjetivo,
          montoActual: editingMeta.montoActual ?? 0,
          fechaObjetivo: editingMeta.fechaObjetivo ? formatDateForInput(editingMeta.fechaObjetivo) : '',
          tipoMeta: editingMeta.tipoMeta,
          cuentaId: editingMeta.cuentaId ?? '',
          estaCompletada: editingMeta.estaCompletada,
          fechaComplecion: editingMeta.fechaComplecion
        });
      } else {
        setForm({
          usuarioId: authService.getUserId() ?? '',
          nombreMeta: '',
          descripcion: '',
          montoObjetivo: 0,
          montoActual: 0,
          fechaObjetivo: '',
          tipoMeta: 'ahorro',
          cuentaId: '',
          estaCompletada: false,
          fechaComplecion: undefined
        });
      }
      setError('');
    }
  }, [isOpen, editingMeta]);

  const handleChange = (field: keyof MetaFormData, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreMeta.trim()) {
      setError('El nombre de la meta es obligatorio');
      return;
    }
    if (form.montoObjetivo <= 0) {
      setError('El monto objetivo debe ser mayor a 0');
      return;
    }
    if (!form.tipoMeta) {
      setError('El tipo de meta es obligatorio');
      return;
    }
    try {
      setLoading(true);
      if (editingMeta) {
        // Para actualizar, solo enviar los campos que se pueden modificar
        const updateData = {
          nombreMeta: form.nombreMeta,
          descripcion: form.descripcion,
          montoObjetivo: form.montoObjetivo,
          montoActual: form.montoActual,
          fechaObjetivo: form.fechaObjetivo,
          tipoMeta: form.tipoMeta,
          cuentaId: form.cuentaId || undefined,
          estaCompletada: form.estaCompletada,
          fechaComplecion: form.fechaComplecion
        };
        console.log('📝 Actualizando meta:', editingMeta.metaId, updateData);
        await metaFinancieraService.actualizarMeta(editingMeta.metaId, updateData);
      } else {
        console.log('📝 Creando nueva meta:', form);
        await metaFinancieraService.crearMeta(form);
      }
      await Swal.fire({
        title: '¡Éxito!',
        text: editingMeta ? 'Meta actualizada exitosamente' : 'Meta creada exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(`Error al guardar la meta: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingMeta ? 'Editar Meta' : 'Nueva Meta Financiera'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {editingMeta ? 'Modifica los datos de tu meta financiera' : 'Crea una nueva meta para alcanzar tus objetivos'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>
        {/* Formulario */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm">{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la meta *</label>
            <input
              type="text"
              placeholder="Ej: Viaje a Europa"
              value={form.nombreMeta}
              onChange={e => handleChange('nombreMeta', e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              placeholder="Describe tu meta"
              value={form.descripcion}
              onChange={e => handleChange('descripcion', e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto objetivo *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><DollarSign className="w-5 h-5" /></span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.montoObjetivo}
                  onChange={e => handleChange('montoObjetivo', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto actual</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><DollarSign className="w-5 h-5" /></span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.montoActual}
                  onChange={e => handleChange('montoActual', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha objetivo</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><Calendar className="w-5 h-5" /></span>
              <input
                type="date"
                value={form.fechaObjetivo}
                onChange={e => handleChange('fechaObjetivo', e.target.value)}
                className="w-full pl-10 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              La fecha se guardará con la hora actual del sistema
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de meta *</label>
            <select
              value={form.tipoMeta}
              onChange={e => handleChange('tipoMeta', e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
            >
              {tiposMeta.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta asociada</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><CreditCard className="w-5 h-5" /></span>
              <select
                value={form.cuentaId}
                onChange={e => handleChange('cuentaId', e.target.value)}
                className="w-full pl-10 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                disabled={loadingCuentas}
              >
                <option value="">Sin cuenta asociada</option>
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
              Selecciona una cuenta para asociar a esta meta (opcional)
            </p>
          </div>
          {editingMeta && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="estaCompletada"
                checked={form.estaCompletada || false}
                onChange={e => handleChange('estaCompletada', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="estaCompletada" className="text-sm font-medium text-gray-700">
                Marcar como completada
              </label>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{editingMeta ? 'Actualizar' : 'Crear'} Meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MetaFinancieraModal;
