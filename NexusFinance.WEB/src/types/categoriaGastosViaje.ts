export interface CategoriaGastosViaje {
  categoriaViajeId: string;
  nombreCategoria: string;
  descripcion: string;
  color: string;
  icono: string;
  esObligatoria?: boolean;
  ordenVisualizacion?: number;
  estaActivo?: boolean;
}