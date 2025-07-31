import axios from 'axios';
import { authService } from './authService';
import type { CategoriaPresupuesto, CrearCategoriaPresupuestoDTO, ActualizarCategoriaPresupuestoDTO } from '../types/categoriaPresupuesto';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = authService.getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const categoriasPresupuestoService = {
  async obtenerCategoriasPorPresupuesto(presupuestoId: string): Promise<CategoriaPresupuesto[]> {
    const response = await axios.get(`${API_URL}/CategoriasPresupuesto/presupuesto/${presupuestoId}`, getAuthHeaders());
    return response.data;
  },

  async crearCategoriaPresupuesto(data: CrearCategoriaPresupuestoDTO): Promise<CategoriaPresupuesto> {
    const response = await axios.post(`${API_URL}/CategoriasPresupuesto`, data, getAuthHeaders());
    return response.data;
  },

  async actualizarCategoriaPresupuesto(id: string, data: ActualizarCategoriaPresupuestoDTO): Promise<any> {
    const response = await axios.put(`${API_URL}/CategoriasPresupuesto/${id}`, data, getAuthHeaders());
    return response.data;
  },

  async eliminarCategoriaPresupuesto(id: string): Promise<any> {
    const response = await axios.delete(`${API_URL}/CategoriasPresupuesto/${id}`, getAuthHeaders());
    return response.data;
  },
};