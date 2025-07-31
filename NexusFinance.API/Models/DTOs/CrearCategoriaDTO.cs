using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearCategoriaDTO
    {
        public Guid UsuarioId { get; set; }
        public string NombreCategoria { get; set; } = null!;
        public string TipoCategoria { get; set; } = null!;
        public Guid? CategoriaIdPadre { get; set; }
        public string Color { get; set; } = "#3B82F6";
        public string Icono { get; set; } = "categoria";
    }
} 