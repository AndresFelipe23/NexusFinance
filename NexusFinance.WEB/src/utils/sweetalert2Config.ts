// Configuración global para SweetAlert2
// Establece un z-index alto por defecto para que siempre aparezca sobre los modales

import Swal from 'sweetalert2';

// Configuración por defecto para todos los SweetAlert2
export const configurarSweetAlert2 = () => {
  // Establecer configuración por defecto
  Swal.mixin({
    zIndex: 999999, // Z-index más alto que cualquier modal
    customClass: {
      popup: 'rounded-xl', // Bordes redondeados por defecto
      confirmButton: 'swal2-confirm-button',
      cancelButton: 'swal2-cancel-button',
    },
    buttonsStyling: false, // Usar estilos personalizados
  });
};

// Función helper para crear alertas con configuración consistente
export const mostrarAlerta = {
  exito: (titulo: string, mensaje?: string) => Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'success',
    zIndex: 999999,
    customClass: { popup: 'rounded-xl' }
  }),

  error: (titulo: string, mensaje?: string) => Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'error',
    zIndex: 999999,
    customClass: { popup: 'rounded-xl' }
  }),

  advertencia: (titulo: string, mensaje?: string) => Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'warning',
    zIndex: 999999,
    customClass: { popup: 'rounded-xl' }
  }),

  confirmacion: (titulo: string, mensaje?: string, confirmarTexto = 'Confirmar', cancelarTexto = 'Cancelar') => Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmarTexto,
    cancelButtonText: cancelarTexto,
    reverseButtons: true,
    zIndex: 999999,
    customClass: { popup: 'rounded-xl' }
  }),

  exitoConTimer: (titulo: string, mensaje?: string, tiempo = 2000) => Swal.fire({
    title: titulo,
    text: mensaje,
    icon: 'success',
    timer: tiempo,
    showConfirmButton: false,
    zIndex: 999999,
    customClass: { popup: 'rounded-xl' }
  })
};

export default mostrarAlerta;