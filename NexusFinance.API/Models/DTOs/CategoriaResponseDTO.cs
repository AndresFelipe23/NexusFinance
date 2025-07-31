using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CategoriaResponseDTO
    {
        public Guid CategoriaId { get; set; }
        public Guid UsuarioId { get; set; }
        public string NombreCategoria { get; set; } = null!;
        public string TipoCategoria { get; set; } = null!;
        public Guid? CategoriaIdPadre { get; set; }
        public string? NombreCategoriaPadre { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public bool? EstaActivo { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public int? CantidadSubcategorias { get; set; } // Solo para consultas jerárquicas
    }
} 