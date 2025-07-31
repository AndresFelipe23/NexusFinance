using System;

namespace NexusFinance.API.Models.DTOs
{
    public class EstadisticasTransferenciasDTO
    {
        public int TotalTransferencias { get; set; }
        public decimal MontoTotalTransferido { get; set; }
        public decimal TotalComisiones { get; set; }
        public decimal MontoPromedio { get; set; }
        public DateTime? PrimeraTransferencia { get; set; }
        public DateTime? UltimaTransferencia { get; set; }
    }
} 