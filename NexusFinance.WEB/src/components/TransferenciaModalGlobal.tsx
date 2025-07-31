import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, ArrowRight, DollarSign, Calendar, CreditCard } from 'lucide-react';
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

interface TransferenciaModalGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransferencia?: Transferencia | null;
}

const TransferenciaModalGlobal: React.FC<TransferenciaModalGlobalProps> = ({ 
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
        title: '¡Transferencia guardada!',
        text: editingTransferencia ? 'Transferencia actualizada exitosamente' : 'Transferencia creada exitosamente',
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
    if (loading) return;

    if (hasChanges) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar',
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

  const getCuentaInfo = (cuentaId: string) => {
    return cuentas.find(c => c.cuentaId === cuentaId);
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingTransferencia ? 'Editar Transferencia' : 'Nueva Transferencia'}
                </h2>
                <p className="text-orange-100 text-sm">
                  {editingTransferencia ? 'Modifica los datos de tu transferencia' : 'Transfiere dinero entre tus cuentas'}
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

        {/* Formulario */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cuenta Origen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta Origen *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.cuentaOrigenId}
                    onChange={(e) => handleFormChange('cuentaOrigenId', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    required
                  >
                    <option value="">Selecciona cuenta origen</option>
                    {cuentas.map(cuenta => (
                      <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                        {cuenta.nombreCuenta} - ${cuenta.saldo?.toLocaleString() || 0}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cuenta Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta Destino *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.cuentaDestinoId}
                    onChange={(e) => handleFormChange('cuentaDestinoId', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    required
                  >
                    <option value="">Selecciona cuenta destino</option>
                    {cuentas.map(cuenta => (
                      <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                        {cuenta.nombreCuenta} - ${cuenta.saldo?.toLocaleString() || 0}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Transferir *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => handleFormChange('monto', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Comisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión de Transferencia
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.comisionTransferencia}
                    onChange={(e) => handleFormChange('comisionTransferencia', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Fecha de Transferencia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Transferencia
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={formData.fechaTransferencia}
                    onChange={(e) => handleFormChange('fechaTransferencia', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                              disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                            disabled:opacity-50 disabled:bg-gray-50 transition-colors duration-200"
                  placeholder="Descripción de la transferencia..."
                />
              </div>
            </div>

            {/* Resumen de la Transferencia */}
            {formData.cuentaOrigenId && formData.cuentaDestinoId && formData.monto > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-800 mb-3">Resumen de la Transferencia</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desde:</span>
                    <span className="font-medium">{getCuentaInfo(formData.cuentaOrigenId)?.nombreCuenta}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hacia:</span>
                    <span className="font-medium">{getCuentaInfo(formData.cuentaDestinoId)?.nombreCuenta}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium text-green-600">
                      ${formData.monto.toLocaleString()}
                    </span>
                  </div>
                  {formData.comisionTransferencia > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Comisión:</span>
                      <span className="font-medium text-red-600">
                        ${formData.comisionTransferencia.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-orange-200 pt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-700">Total a debitar:</span>
                      <span className="text-orange-600">
                        ${(formData.monto + formData.comisionTransferencia).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                disabled={loading || !formData.cuentaOrigenId || !formData.cuentaDestinoId || formData.monto <= 0}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
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
    </div>,
    document.body
  );
};

export default TransferenciaModalGlobal; 