using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CategoriaGastosViajeResponseDTO
    {
        public Guid CategoriaViajeId { get; set; }
        public string NombreCategoria { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? Icono { get; set; }
        public string? Color { get; set; }
        public bool? EsObligatoria { get; set; }
        public int? OrdenVisualizacion { get; set; }
        public bool? EstaActivo { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public int? PlanesConPresupuesto { get; set; }
        public int? ActividadesAsociadas { get; set; }
        public int? GastosRegistrados { get; set; }
        public decimal? TotalGastado { get; set; }
    }
} 