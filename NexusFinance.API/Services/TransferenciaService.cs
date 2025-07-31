using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using NexusFinance.API.Models.DTOs;

namespace NexusFinance.API.Services
{
    public class TransferenciaService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public TransferenciaService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<TransferenciaResponseDTO> CrearTransferenciaAsync(Guid usuarioId, Guid cuentaOrigenId, Guid cuentaDestinoId, decimal monto, decimal? comisionTransferencia, string? descripcion, DateTime fechaTransferencia)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<TransferenciaResponseDTO>(
                "Transferencia_Insert",
                new { UsuarioId = usuarioId, CuentaOrigenId = cuentaOrigenId, CuentaDestinoId = cuentaDestinoId, Monto = monto, ComisionTransferencia = comisionTransferencia, Descripcion = descripcion, FechaTransferencia = fechaTransferencia },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<TransferenciaResponseDTO>> ObtenerTransferenciasPorUsuarioAsync(Guid usuarioId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<TransferenciaResponseDTO>(
                "Transferencias_ObtenerPorUsuario",
                new { UsuarioId = usuarioId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<TransferenciaResponseDTO> ObtenerTransferenciaPorIdAsync(Guid transferenciaId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<TransferenciaResponseDTO>(
                "Transferencia_ObtenerPorId",
                new { TransferenciaId = transferenciaId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<TransferenciaResponseDTO> ActualizarTransferenciaAsync(Guid transferenciaId, Guid? cuentaOrigenId, Guid? cuentaDestinoId, decimal? monto, decimal? comisionTransferencia, string? descripcion, DateTime? fechaTransferencia)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<TransferenciaResponseDTO>(
                "Transferencia_Actualizar",
                new { TransferenciaId = transferenciaId, CuentaOrigenId = cuentaOrigenId, CuentaDestinoId = cuentaDestinoId, Monto = monto, ComisionTransferencia = comisionTransferencia, Descripcion = descripcion, FechaTransferencia = fechaTransferencia },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<bool> EliminarTransferenciaAsync(Guid transferenciaId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.ExecuteAsync(
                "Transferencia_Eliminar",
                new { TransferenciaId = transferenciaId },
                commandType: CommandType.StoredProcedure
            );
            return result > 0;
        }

        public async Task<EstadisticasTransferenciasDTO> ObtenerEstadisticasTransferenciasAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<EstadisticasTransferenciasDTO>(
                "Transferencias_ObtenerEstadisticas",
                new { UsuarioId = usuarioId, FechaInicio = fechaInicio, FechaFin = fechaFin },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new EstadisticasTransferenciasDTO();
        }

        public async Task<IEnumerable<TransferenciaResponseDTO>> ObtenerTransferenciasPorPeriodoAsync(Guid usuarioId, DateTime fechaInicio, DateTime fechaFin)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<TransferenciaResponseDTO>(
                "Transferencias_ObtenerPorPeriodo",
                new { UsuarioId = usuarioId, FechaInicio = fechaInicio, FechaFin = fechaFin },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        // Métodos de utilidad para formateo
        public string FormatearMonto(decimal monto)
        {
            return monto.ToString("C", new System.Globalization.CultureInfo("es-CO"));
        }

        public string FormatearFecha(DateTime fecha)
        {
            return fecha.ToString("dd/MM/yyyy HH:mm", new System.Globalization.CultureInfo("es-CO"));
        }

        public string FormatearFechaCorta(DateTime fecha)
        {
            return fecha.ToString("dd/MM/yyyy", new System.Globalization.CultureInfo("es-CO"));
        }
    }
} 