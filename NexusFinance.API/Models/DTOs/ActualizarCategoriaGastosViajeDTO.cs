using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarCategoriaGastosViajeDTO
    {
        public Guid CategoriaViajeId { get; set; }
        public string? NombreCategoria { get; set; }
        public string? Descripcion { get; set; }
        public string? Icono { get; set; }
        public string? Color { get; set; }
        public bool? EsObligatoria { get; set; }
        public int? OrdenVisualizacion { get; set; }
        public bool? EstaActivo { get; set; }
    }
} 