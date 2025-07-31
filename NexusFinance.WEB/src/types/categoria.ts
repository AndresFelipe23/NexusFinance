export interface Categoria {
  categoriaId: string;
  usuarioId: string;
  nombreCategoria: string;
  tipoCategoria: 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda';
  categoriaIdPadre?: string;
  nombreCategoriaPadre?: string;
  color?: string;
  icono?: string;
  estaActivo?: boolean;
  fechaCreacion?: string;
  cantidadSubcategorias?: number;
}

export interface CrearCategoriaDTO {
  usuarioId: string;
  nombreCategoria: string;
  tipoCategoria: 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda';
  categoriaIdPadre?: string;
  color?: string;
  icono?: string;
}

export interface ActualizarCategoriaDTO {
  categoriaId?: string;
  nombreCategoria?: string;
  categoriaIdPadre?: string;
  color?: string;
  icono?: string;
  estaActivo?: boolean;
  cambiarPadre?: boolean;
}

export interface FiltrosCategoria {
  tipoCategoria?: 'ingreso' | 'gasto' | 'transferencia' | 'inversion' | 'ahorro' | 'credito' | 'deuda';
  soloActivas?: boolean;
  incluirJerarquia?: boolean;
} 