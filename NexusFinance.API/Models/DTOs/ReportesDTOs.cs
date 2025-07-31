using System;
using System.Collections.Generic;

namespace NexusFinance.API.Models.DTOs
{
    // ===============================
    // DTOs para Dashboard Financiero
    // ===============================
    
    public class DashboardFinancieroResponseDTO
    {
        public KPIsPrincipalesDTO KPIs { get; set; } = new();
        public List<CategoriaGastoDTO> TopCategorias { get; set; } = new();
        public List<EvolucionBalanceDTO> EvolucionBalance { get; set; } = new();
    }

    public class KPIsPrincipalesDTO
    {
        public decimal BalanceTotal { get; set; }
        public decimal IngresosPeriodo { get; set; }
        public decimal GastosPeriodo { get; set; }
        public decimal BalancePeriodo { get; set; }
        public int MetasActivas { get; set; }
        public decimal ProgresoPromedioMetas { get; set; }
        public decimal PresupuestoTotal { get; set; }
        public decimal PresupuestoEjecutado { get; set; }
        public decimal PorcentajePresupuestoEjecutado => PresupuestoTotal > 0 ? (PresupuestoEjecutado * 100 / PresupuestoTotal) : 0;
        public int NumeroTransacciones { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
    }

    public class CategoriaGastoDTO
    {
        public string Categoria { get; set; } = string.Empty;
        public decimal TotalGastado { get; set; }
        public int NumeroTransacciones { get; set; }
        public decimal PromedioTransaccion { get; set; }
    }

    public class EvolucionBalanceDTO
    {
        public int Anio { get; set; }
        public int Mes { get; set; }
        public string NombreMes { get; set; } = string.Empty;
        public decimal BalanceMes { get; set; }
        public decimal BalanceAcumulado { get; set; }
    }

    // ===============================
    // DTOs para Gastos por Categoría
    // ===============================
    
    public class GastosPorCategoriaResponseDTO
    {
        public List<ResumenCategoriaDTO> ResumenCategorias { get; set; } = new();
        public List<DetalleTransaccionDTO> DetalleTransacciones { get; set; } = new();
        public List<EvolucionDiariaDTO> EvolucionDiaria { get; set; } = new();
    }

    public class ResumenCategoriaDTO
    {
        public Guid CategoriaId { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public decimal TotalGastado { get; set; }
        public int NumeroTransacciones { get; set; }
        public decimal PromedioTransaccion { get; set; }
        public decimal MontoMinimo { get; set; }
        public decimal MontoMaximo { get; set; }
        public decimal PorcentajeDelTotal { get; set; }
        public decimal TotalMesAnterior { get; set; }
        public decimal VariacionMesAnterior => TotalMesAnterior > 0 ? ((TotalGastado - TotalMesAnterior) / TotalMesAnterior) * 100 : 0;
    }

    public class DetalleTransaccionDTO
    {
        public Guid TransaccionId { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; }
        public string Cuenta { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
    }

    public class EvolucionDiariaDTO
    {
        public DateTime Fecha { get; set; }
        public decimal TotalDia { get; set; }
        public int TransaccionesDia { get; set; }
    }

    // ===============================
    // DTOs para Progreso de Metas
    // ===============================
    
    public class ProgresoMetasResponseDTO
    {
        public List<ResumenMetaDTO> ResumenMetas { get; set; } = new();
        public List<ContribucionRecienteDTO> ContribucionesRecientes { get; set; } = new();
        public EstadisticasMetasDTO EstadisticasGenerales { get; set; } = new();
    }

    public class ResumenMetaDTO
    {
        public Guid MetaId { get; set; }
        public string NombreMeta { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal MontoObjetivo { get; set; }
        public decimal MontoAcumulado { get; set; }
        public DateTime? FechaLimite { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public decimal PorcentajeProgreso { get; set; }
        public decimal MontoFaltante { get; set; }
        public int DiasRestantes { get; set; }
        public decimal AhorroRequeridoDiario { get; set; }
        public int NumeroContribuciones { get; set; }
        public decimal PromedioContribuciones { get; set; }
        public DateTime? UltimaContribucion { get; set; }
        
        // Propiedades calculadas
        public bool EstaVencida => FechaLimite.HasValue && FechaLimite.Value < DateTime.Now;
        public bool EstaProximaAVencer => FechaLimite.HasValue && DiasRestantes > 0 && DiasRestantes <= 30;
        public string EstadoVisual => EstaVencida ? "vencida" : EstaProximaAVencer ? "proxima" : "normal";
    }

    public class ContribucionRecienteDTO
    {
        public Guid ContribucionId { get; set; }
        public Guid MetaId { get; set; }
        public string NombreMeta { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; }
        public string Descripcion { get; set; } = string.Empty;
    }

    public class EstadisticasMetasDTO
    {
        public int TotalMetas { get; set; }
        public int MetasActivas { get; set; }
        public int MetasCompletadas { get; set; }
        public int MetasPausadas { get; set; }
        public decimal TotalObjetivos { get; set; }
        public decimal TotalAcumulado { get; set; }
        public decimal TotalFaltante { get; set; }
        public decimal ProgresoPromedio { get; set; }
        public int MetasProximasVencer { get; set; }
        
        // Propiedades calculadas
        public decimal PorcentajeCompletadas => TotalMetas > 0 ? (MetasCompletadas * 100.0m / TotalMetas) : 0;
        public decimal PorcentajeAcumuladoTotal => TotalObjetivos > 0 ? (TotalAcumulado * 100.0m / TotalObjetivos) : 0;
    }

    // ===============================
    // DTOs para Balance de Cuentas
    // ===============================
    
    public class BalanceCuentasResponseDTO
    {
        public List<ResumenCuentaDTO> ResumenCuentas { get; set; } = new();
        public decimal TotalPatrimonio => ResumenCuentas.Sum(c => c.SaldoActual);
        public decimal TotalMovimientoPeriodo => ResumenCuentas.Sum(c => c.MovimientoPeriodo);
    }

    public class ResumenCuentaDTO
    {
        public Guid CuentaId { get; set; }
        public string NombreCuenta { get; set; } = string.Empty;
        public string TipoCuenta { get; set; } = string.Empty;
        public decimal SaldoActual { get; set; }
        public decimal MovimientoPeriodo { get; set; }
        public decimal IngresosPeriodo { get; set; }
        public decimal GastosPeriodo { get; set; }
        public int NumeroTransacciones { get; set; }
        public decimal SaldoInicioPeriodo { get; set; }
        
        // Propiedades calculadas
        public decimal VariacionPeriodo => SaldoActual - SaldoInicioPeriodo;
        public decimal PorcentajeVariacion => SaldoInicioPeriodo != 0 ? (VariacionPeriodo / Math.Abs(SaldoInicioPeriodo)) * 100 : 0;
        public string Tendencia => VariacionPeriodo > 0 ? "positiva" : VariacionPeriodo < 0 ? "negativa" : "estable";
    }

    // ===============================
    // DTOs para Filtros de Reportes
    // ===============================
    
    public class FiltrosReporteDTO
    {
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public Guid? CategoriaId { get; set; }
        public Guid? CuentaId { get; set; }
        public string? EstadoMeta { get; set; }
        public string? TipoReporte { get; set; }
        
        // Validaciones
        public bool EsRangoFechaValido => !FechaInicio.HasValue || !FechaFin.HasValue || FechaInicio.Value <= FechaFin.Value;
    }

    // ===============================
    // DTOs para Respuestas de Error
    // ===============================
    
    public class ReporteErrorResponseDTO
    {
        public string Error { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}