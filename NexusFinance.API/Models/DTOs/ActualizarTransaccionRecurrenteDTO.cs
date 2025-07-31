using System.ComponentModel.DataAnnotations;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarTransaccionRecurrenteDTO
    {
        [Required]
        public Guid RecurrenteId { get; set; }

        public Guid? CuentaId { get; set; }

        public Guid? CategoriaId { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero")]
        public decimal? Monto { get; set; }

        [StringLength(500)]
        public string? Descripcion { get; set; }

        [StringLength(20)]
        public string? Frecuencia { get; set; }

        public DateTime? FechaFin { get; set; }

        public bool? EstaActivo { get; set; }

        public bool RemoverFechaFin { get; set; } = false;
    }
} 