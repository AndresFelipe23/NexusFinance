using AutoMapper;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Models.Entities;

namespace NexusFinance.API.Models
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // Mapeo para CategoriasPresupuesto
            CreateMap<CategoriasPresupuesto, CategoriaPresupuestoResponseDTO>();
            // Si necesitas mapeo inverso o para creacion/actualizacion
            // CreateMap<CrearCategoriaPresupuestoDTO, CategoriasPresupuesto>();
            // CreateMap<ActualizarCategoriaPresupuestoDTO, CategoriasPresupuesto>();

            // Mapeo para CategoriasGastosViaje
            CreateMap<CategoriasGastosViaje, CategoriaGastosViajeResponseDTO>();
            CreateMap<CrearCategoriaGastosViajeDTO, CategoriasGastosViaje>();
            CreateMap<ActualizarCategoriaGastosViajeDTO, CategoriasGastosViaje>();

            // Mapeo para ActividadesViaje
            CreateMap<ActividadesViaje, ActividadViajeResponseDTO>();
        }
    }
} 