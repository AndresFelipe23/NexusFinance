using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class ContribucionesMetaService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public ContribucionesMetaService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearContribucionMetaAsync(Guid metaId, decimal monto, DateTime? fechaContribucion, string? notas, Guid? transaccionId, bool actualizarMetaAutomaticamente = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ContribucionesMetas_Insert",
                new
                {
                    MetaId = metaId,
                    Monto = monto,
                    FechaContribucion = fechaContribucion,
                    Notas = notas,
                    TransaccionId = transaccionId,
                    ActualizarMetaAutomaticamente = actualizarMetaAutomaticamente
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarContribucionMetaAsync(Guid contribucionId, decimal? monto, DateTime? fechaContribucion, string? notas, bool actualizarMetaAutomaticamente = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ContribucionesMetas_Update",
                new
                {
                    ContribucionId = contribucionId,
                    Monto = monto,
                    FechaContribucion = fechaContribucion,
                    Notas = notas,
                    ActualizarMetaAutomaticamente = actualizarMetaAutomaticamente
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarContribucionMetaAsync(Guid contribucionId, bool actualizarMetaAutomaticamente = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ContribucionesMetas_Delete",
                new
                {
                    ContribucionId = contribucionId,
                    ActualizarMetaAutomaticamente = actualizarMetaAutomaticamente
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerContribucionMetaPorIdAsync(Guid contribucionId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ContribucionesMetas_Select",
                new { ContribucionId = contribucionId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ObtenerContribucionesPorMetaAsync(Guid metaId, DateTime? fechaInicio = null, DateTime? fechaFin = null, string ordenarPor = "fecha_desc")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "ContribucionesMetas_SelectByMeta",
                new
                {
                    MetaId = metaId,
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> RecalcularMetaAsync(Guid metaId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ContribucionesMetas_RecalcularMeta",
                new { MetaId = metaId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EstadisticasAsync(Guid metaId, int periodoDias = 30)
        {
            using var connection = new SqlConnection(_connectionString!);
            using var multi = await connection.QueryMultipleAsync(
                "ContribucionesMetas_Estadisticas",
                new { MetaId = metaId, PeriodoDias = periodoDias },
                commandType: CommandType.StoredProcedure
            );
            var estadisticasBasicas = await multi.ReadFirstOrDefaultAsync() ?? new { };
            var distribucionMensual = (await multi.ReadAsync()).AsList();
            return new { EstadisticasBasicas = estadisticasBasicas, DistribucionMensual = distribucionMensual };
        }
    }
} 