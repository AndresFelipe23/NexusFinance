using System.ComponentModel.DataAnnotations;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearTransaccionRecurrenteDTO
    {
        [Required]
        public Guid UsuarioId { get; set; }

        [Required]
        public Guid CuentaId { get; set; }

        [Required]
        public Guid CategoriaId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero")]
        public decimal Monto { get; set; }

        [Required]
        [StringLength(20)]
        public string TipoTransaccion { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descripcion { get; set; }

        [Required]
        [StringLength(20)]
        public string Frecuencia { get; set; } = string.Empty;

        [Required]
        public DateTime FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }
    }
} 