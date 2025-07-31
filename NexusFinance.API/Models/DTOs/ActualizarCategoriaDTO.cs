using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarCategoriaDTO
    {
        public Guid CategoriaId { get; set; }
        public string? NombreCategoria { get; set; }
        public Guid? CategoriaIdPadre { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public bool? EstaActivo { get; set; }
        public bool CambiarPadre { get; set; } = false;
    }
} 