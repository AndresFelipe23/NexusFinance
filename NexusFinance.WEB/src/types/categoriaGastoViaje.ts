export interface CategoriaGastoViaje {
  categoriaViajeId: string;
  nombreCategoria: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  esObligatoria?: boolean;
  ordenVisualizacion?: number;
  estaActivo?: boolean;
  fechaCreacion?: string; // ISO date string
  // Campos opcionales para estadísticas
  planesConPresupuesto?: number;
  actividadesAsociadas?: number;
  gastosRegistrados?: number;
  totalGastado?: number;
}