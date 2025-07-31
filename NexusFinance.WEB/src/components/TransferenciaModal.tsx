import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Loader2, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import type { Transferencia, CrearTransferenciaDTO, ActualizarTransferenciaDTO } from '../types/transferencia';
import type { Cuenta } from '../types/cuenta';
import { transferenciaService } from '../services/transferenciaService';
import { cuentaService } from '../services/cuentaService';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

interface TransferenciaFormData {
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: number;
  comisionTransferencia: number;
  descripcion: string;
  fechaTransferencia: string;
}

interface TransferenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransferencia?: Transferencia | null;
}

const TransferenciaModal: React.FC<TransferenciaModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingTransferencia 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [formData, setFormData] = useState<TransferenciaFormData>({
    cuentaOrigenId: '',
    cuentaDestinoId: '',
    monto: 0,
    comisionTransferencia: 0,
    descripcion: '',
    fechaTransferencia: new Date().toISOString().slice(0, 16)
  });
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

  // Cargar cuentas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarCuentas();
    }
  }, [isOpen]);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (editingTransferencia) {
        setFormData({
          cuentaOrigenId: editingTransferencia.cuentaOrigenId,
          cuentaDestinoId: editingTransferencia.cuentaDestinoId,
          monto: editingTransferencia.monto,
          comisionTransferencia: editingTransferencia.comisionTransferencia || 0,
          descripcion: editingTransferencia.descripcion || '',
          fechaTransferencia: new Date(editingTransferencia.fechaTransferencia).toISOString().slice(0, 16)
        });
      } else {
        setFormData({
          cuentaOrigenId: '',
          cuentaDestinoId: '',
          monto: 0,
          comisionTransferencia: 0,
          descripcion: '',
          fechaTransferencia: new Date().toISOString().slice(0, 16)
        });
      }
      setError('');
      setHasChanges(false);
    }
  }, [isOpen, editingTransferencia]);

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cargarCuentas = async () => {
    try {
      const usuarioId = authService.getUserId();
      if (!usuarioId) {
        setError('Usuario no autenticado');
        return;
      }

      const cuentasData = await cuentaService.obtenerCuentasPorUsuario(usuarioId, true);
      setCuentas(cuentasData);
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setError('Error al cargar las cuentas');
    }
  };

  // Detectar cambios en el formulario
  const handleFormChange = (field: keyof TransferenciaFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

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

      // Validaciones
      if (!formData.cuentaOrigenId || !formData.cuentaDestinoId) {
        setError('Debes seleccionar cuenta origen y destino');
        return;
      }

      if (formData.cuentaOrigenId === formData.cuentaDestinoId) {
        setError('La cuenta origen y destino no pueden ser la misma');
        return;
      }

      if (formData.monto <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }

      if (editingTransferencia) {
        // Actualizar transferencia existente
        const updateData: ActualizarTransferenciaDTO = {
          transferenciaId: editingTransferencia.transferenciaId,
          cuentaOrigenId: formData.cuentaOrigenId,
          cuentaDestinoId: formData.cuentaDestinoId,
          monto: formData.monto,
          comisionTransferencia: formData.comisionTransferencia,
          descripcion: formData.descripcion,
          fechaTransferencia: new Date(formData.fechaTransferencia)
        };
        await transferenciaService.actualizarTransferencia(updateData);
      } else {
        // Crear nueva transferencia
        const newTransferencia: CrearTransferenciaDTO = {
          usuarioId,
          cuentaOrigenId: formData.cuentaOrigenId,
          cuentaDestinoId: formData.cuentaDestinoId,
          monto: formData.monto,
          comisionTransferencia: formData.comisionTransferencia,
          descripcion: formData.descripcion,
          fechaTransferencia: new Date(formData.fechaTransferencia)
        };
        await transferenciaService.crearTransferencia(newTransferencia);
      }

      // Mostrar éxito
      await Swal.fire({
        title: '¡Transferencia procesada!',
        text: `Transferencia ${editingTransferencia ? 'actualizada' : 'creada'} exitosamente`,
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
      console.error('Error al guardar transferencia:', err);
      setError(`Error al ${editingTransferencia ? 'actualizar' : 'crear'} la transferencia: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (loading) return; // No permitir cerrar mientras está cargando
    
    if (hasChanges) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6b7280',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl'
        }
      });

      if (result.isConfirmed) {
        onClose();
      }
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

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">
              {editingTransferencia ? 'Editar Transferencia' : 'Nueva Transferencia'}
            </h2>
            <p className="text-blue-100 mt-1">
              {editingTransferencia ? 'Modifica los detalles de la transferencia' : 'Crea una nueva transferencia entre cuentas'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Cuentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cuenta Origen */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cuenta Origen *
              </label>
              <select
                value={formData.cuentaOrigenId}
                onChange={(e) => handleFormChange('cuentaOrigenId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar cuenta origen</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                    {cuenta.nombreCuenta} - {transferenciaService.formatearMonto(cuenta.saldo)}
                  </option>
                ))}
              </select>
            </div>

            {/* Flecha */}
            <div className="flex items-center justify-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Cuenta Destino */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cuenta Destino *
              </label>
              <select
                value={formData.cuentaDestinoId}
                onChange={(e) => handleFormChange('cuentaDestinoId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar cuenta destino</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                    {cuenta.nombreCuenta} - {transferenciaService.formatearMonto(cuenta.saldo)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto y Comisión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => handleFormChange('monto', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Comisión
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={formData.comisionTransferencia}
                  onChange={(e) => handleFormChange('comisionTransferencia', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción de la transferencia (opcional)"
              rows={3}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha de Transferencia *
            </label>
            <input
              type="datetime-local"
              value={formData.fechaTransferencia}
              onChange={(e) => handleFormChange('fechaTransferencia', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Total */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total a transferir:</span>
              <span className="text-2xl font-bold text-blue-600">
                {transferenciaService.formatearMonto(formData.monto + formData.comisionTransferencia)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Monto: {transferenciaService.formatearMonto(formData.monto)} + 
              Comisión: {transferenciaService.formatearMonto(formData.comisionTransferencia)}
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
              disabled={loading || !formData.cuentaOrigenId || !formData.cuentaDestinoId || formData.monto <= 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{editingTransferencia ? 'Actualizar' : 'Crear'} Transferencia</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferenciaModal; 