import Swal from 'sweetalert2';

// Configuración base para SweetAlert2
const baseConfig = {
  confirmButtonText: 'Confirmar',
  cancelButtonText: 'Cancelar',
  reverseButtons: true,
  customClass: {
    popup: 'swal2-popup',
    title: 'swal2-title',
    htmlContainer: 'swal2-html-container',
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel'
  }
};

// Función para confirmar eliminación normal
export const confirmarEliminacion = async (titulo: string, mensaje: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  return result.isConfirmed;
};

// Función para confirmar eliminación permanente
export const confirmarEliminacionPermanente = async (titulo: string, nombreMeta: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: '⚠️ Eliminación Permanente',
    html: `
      <div class="text-left">
        <p class="mb-3">¿Estás seguro de que quieres eliminar <strong>permanentemente</strong> la meta "${nombreMeta}"?</p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <p class="font-semibold mb-1">⚠️ Esta acción es irreversible:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Se eliminarán todos los datos de la meta</li>
            <li>Se perderá el historial de contribuciones</li>
            <li>No se podrá recuperar la información</li>
          </ul>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar permanentemente',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'swal2-confirm-danger'
    }
  });

  return result.isConfirmed;
};

// Función para confirmar activar/inactivar meta
export const confirmarCambioEstado = async (nombreMeta: string, activar: boolean): Promise<boolean> => {
  const actionText = activar ? 'activar' : 'pausar';
  const icon = activar ? 'question' : 'warning';
  const confirmColor = activar ? '#10b981' : '#f59e0b';
  
  const result = await Swal.fire({
    title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} meta?`,
    text: `¿Estás seguro de que quieres ${actionText} la meta "${nombreMeta}"?`,
    icon,
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: '#6b7280',
    confirmButtonText: activar ? 'Sí, activar' : 'Sí, pausar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  return result.isConfirmed;
};

// Función para mostrar éxito
export const mostrarExito = (titulo: string, mensaje: string): void => {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Aceptar'
  });
};

// Función para mostrar error
export const mostrarError = (titulo: string, mensaje: string): void => {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'error',
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Aceptar'
  });
};

// Función para mostrar información
export const mostrarInfo = (titulo: string, mensaje: string): void => {
  Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'info',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Aceptar'
  });
};

// Función para mostrar confirmación personalizada
export const confirmarAccion = async (
  titulo: string, 
  mensaje: string, 
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar',
  icon: 'warning' | 'question' | 'info' = 'question'
): Promise<boolean> => {
  const result = await Swal.fire({
    title: titulo,
    text: mensaje,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    ...baseConfig
  });

  return result.isConfirmed;
};

// Función para mostrar loading
export const mostrarLoading = (mensaje: string = 'Procesando...'): void => {
  Swal.fire({
    title: mensaje,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Función para cerrar loading
export const cerrarLoading = (): void => {
  Swal.close();
};

// Función para mostrar input
export const mostrarInput = async (
  titulo: string,
  placeholder: string,
  inputType: 'text' | 'number' | 'email' | 'password' = 'text'
): Promise<string | null> => {
  const result = await Swal.fire({
    title: titulo,
    input: inputType,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar un valor';
      }
      return null;
    }
  });

  return result.isConfirmed ? result.value : null;
};

// Función para mostrar selección
export const mostrarSeleccion = async (
  titulo: string,
  opciones: { value: string; label: string }[]
): Promise<string | null> => {
  const result = await Swal.fire({
    title: titulo,
    input: 'select',
    inputOptions: opciones.reduce((acc, opcion) => {
      acc[opcion.value] = opcion.label;
      return acc;
    }, {} as Record<string, string>),
    showCancelButton: true,
    confirmButtonText: 'Seleccionar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  return result.isConfirmed ? result.value : null;
};

// Objeto sweetAlert que exporta todos los métodos
export const sweetAlert = {
  success: (mensaje: string, titulo: string = '¡Éxito!') => mostrarExito(titulo, mensaje),
  error: (mensaje: string, titulo: string = 'Error') => mostrarError(titulo, mensaje),
  info: (mensaje: string, titulo: string = 'Información') => mostrarInfo(titulo, mensaje),
  confirm: (titulo: string, mensaje: string) => confirmarAccion(titulo, mensaje),
  confirmarEliminacion,
  confirmarEliminacionPermanente,
  confirmarCambioEstado,
  confirmarAccion,
  mostrarExito,
  mostrarError,
  mostrarInfo,
  mostrarLoading,
  cerrarLoading,
  mostrarInput,
  mostrarSeleccion
}; 