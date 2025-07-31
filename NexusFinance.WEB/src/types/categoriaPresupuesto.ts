export interface CategoriaPresupuesto {
  categoriaPresupuestoId: string;
  presupuestoId: string;
  categoriaId: string;
  nombreCategoria: string; 
  montoAsignado: number;
  montoGastado: number;
  iconoCategoria?: string;
}

export interface CrearCategoriaPresupuestoDTO {
  presupuestoId: string;
  categoriaId: string;
  montoAsignado: number;
}

export interface ActualizarCategoriaPresupuestoDTO {
  categoriaPresupuestoId: string;
  montoAsignado: number;
}
