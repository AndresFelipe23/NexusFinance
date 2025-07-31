using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class PresupuestoViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public PresupuestoViajeService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> CrearPresupuestoViajeAsync(Guid planId, Guid categoriaViajeId, decimal presupuestoEstimado, string? notas = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PresupuestoViaje_Insert",
                new
                {
                    PlanId = planId,
                    CategoriaViajeId = categoriaViajeId,
                    PresupuestoEstimado = presupuestoEstimado,
                    Notas = notas
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarPresupuestoViajeAsync(Guid presupuestoViajeId, decimal? presupuestoEstimado = null, decimal? gastoReal = null, string? notas = null, bool actualizarSoloNotas = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PresupuestoViaje_Update",
                new
                {
                    PresupuestoViajeId = presupuestoViajeId,
                    PresupuestoEstimado = presupuestoEstimado,
                    GastoReal = gastoReal,
                    Notas = notas,
                    ActualizarSoloNotas = actualizarSoloNotas ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarPresupuestoViajeAsync(Guid presupuestoViajeId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PresupuestoViaje_Delete",
                new { PresupuestoViajeId = presupuestoViajeId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerPresupuestoViajePorIdAsync(Guid presupuestoViajeId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PresupuestoViaje_Select",
                new { PresupuestoViajeId = presupuestoViajeId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ObtenerPresupuestosPorPlanAsync(Guid planId, bool incluirResumen = true, string ordenarPor = "Categoria")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "PresupuestoViaje_SelectByPlan",
                new
                {
                    PlanId = planId,
                    IncluirResumen = incluirResumen ? 1 : 0,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> CrearPresupuestoCompletoAsync(Guid planId, decimal? presupuestoTotal = null, bool soloObligatorias = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryMultipleAsync(
                "PresupuestoViaje_CrearPresupuestoCompleto",
                new
                {
                    PlanId = planId,
                    PresupuestoTotal = presupuestoTotal,
                    SoloObligatorias = soloObligatorias ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            var presupuestos = await result.ReadAsync();
            var resumen = await result.ReadFirstOrDefaultAsync();
            return new { Presupuestos = presupuestos, Resumen = resumen };
        }

        public async Task<dynamic> ActualizarGastosRealesAsync(Guid? planId = null, Guid? categoriaViajeId = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryMultipleAsync(
                "PresupuestoViaje_ActualizarGastosReales",
                new
                {
                    PlanId = planId,
                    CategoriaViajeId = categoriaViajeId
                },
                commandType: CommandType.StoredProcedure
            );
            var actualizacion = await result.ReadFirstOrDefaultAsync();
            var resumen = planId != null ? (await result.ReadAsync()) : null;
            return new { Actualizacion = actualizacion, Resumen = resumen };
        }
    }
} 