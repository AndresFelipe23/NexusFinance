namespace NexusFinance.API.Models.DTOs
{
    public class CrearCategoriaGastosViajeDTO
    {
        public string NombreCategoria { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? Icono { get; set; }
        public string? Color { get; set; }
        public bool? EsObligatoria { get; set; }
        public int? OrdenVisualizacion { get; set; }
    }
} 