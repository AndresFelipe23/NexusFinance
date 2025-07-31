using System;

namespace NexusFinance.API.Models.DTOs
{
    public class TransaccionRecurrenteResponseDTO
    {
        public Guid RecurrenteId { get; set; }
        public Guid UsuarioId { get; set; }
        public Guid CuentaId { get; set; }
        public string? NombreCuenta { get; set; }
        public Guid CategoriaId { get; set; }
        public string? NombreCategoria { get; set; }
        public decimal Monto { get; set; }
        public string TipoTransaccion { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Frecuencia { get; set; } = null!;
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public DateTime ProximaFechaEjecucion { get; set; }
        public bool? EstaActivo { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public int? TotalTransaccionesGeneradas { get; set; }
        public string? EstadoTransaccion { get; set; }
    }
} 