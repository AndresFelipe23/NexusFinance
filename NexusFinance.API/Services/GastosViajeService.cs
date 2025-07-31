using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class GastosViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public GastosViajeService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearGastoAsync(Guid planId, Guid categoriaViajeId, decimal monto, string monedaGasto, string descripcion, DateTime? fechaGasto = null, string? ubicacion = null, int? numeroPersonas = 1, Guid? actividadId = null, Guid? transaccionId = null, decimal? tasaCambioUsada = null, string? urlRecibo = null, string? notas = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "GastosViaje_Insert",
                new { PlanId = planId, CategoriaViajeId = categoriaViajeId, Monto = monto, MonedaGasto = monedaGasto, Descripcion = descripcion, FechaGasto = fechaGasto, Ubicacion = ubicacion, NumeroPersonas = numeroPersonas, ActividadId = actividadId, TransaccionId = transaccionId, TasaCambioUsada = tasaCambioUsada, UrlRecibo = urlRecibo, Notas = notas },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarGastoAsync(Guid gastoViajeId, Guid? categoriaViajeId = null, decimal? monto = null, string? monedaGasto = null, string? descripcion = null, DateTime? fechaGasto = null, string? ubicacion = null, int? numeroPersonas = null, Guid? actividadId = null, decimal? tasaCambioUsada = null, string? urlRecibo = null, string? notas = null, bool cambiarActividad = false, bool recalcularMontoLocal = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "GastosViaje_Update",
                new { GastoViajeId = gastoViajeId, CategoriaViajeId = categoriaViajeId, Monto = monto, MonedaGasto = monedaGasto, Descripcion = descripcion, FechaGasto = fechaGasto, Ubicacion = ubicacion, NumeroPersonas = numeroPersonas, ActividadId = actividadId, TasaCambioUsada = tasaCambioUsada, UrlRecibo = urlRecibo, Notas = notas, CambiarActividad = cambiarActividad ? 1 : 0, RecalcularMontoLocal = recalcularMontoLocal ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarGastoAsync(Guid gastoViajeId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "GastosViaje_Delete",
                new { GastoViajeId = gastoViajeId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerGastoPorIdAsync(Guid gastoViajeId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "GastosViaje_Select",
                new { GastoViajeId = gastoViajeId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<Models.Entities.GastosViaje>> ObtenerGastosPorPlanAsync(Guid planId, Guid? categoriaViajeId = null, Guid? actividadId = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null, decimal? montoMinimo = null, decimal? montoMaximo = null, string? monedaGasto = null, string? ordenarPor = "Fecha", bool incluirResumen = true)
        {
            // Validar entrada
            if (planId == Guid.Empty)
            {
                throw new ArgumentException("El ID del plan de vacaciones no puede estar vacío.", nameof(planId));
            }

            using var connection = new SqlConnection(_connectionString!);
            try
            {
                var result = await connection.QueryAsync<Models.Entities.GastosViaje>(
                    "GastosViaje_SelectByPlan",
                    new { PlanId = planId, CategoriaViajeId = categoriaViajeId, ActividadId = actividadId, FechaDesde = fechaDesde, FechaHasta = fechaHasta, MontoMinimo = montoMinimo, MontoMaximo = montoMaximo, MonedaGasto = monedaGasto, OrdenarPor = ordenarPor, IncluirResumen = incluirResumen ? 1 : 0 },
                    commandType: CommandType.StoredProcedure
                );
                return result;
            }
            catch (SqlException ex) when (ex.Message.Contains("El plan de vacaciones no existe"))
            {
                throw new ArgumentException($"El plan de vacaciones con ID {planId} no existe.", nameof(planId));
            }
            catch (SqlException ex)
            {
                throw new InvalidOperationException($"Error al consultar los gastos del plan: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<dynamic>> AnalisisPorCategoriaAsync(Guid planId, bool incluirSinGastos = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "GastosViaje_GetAnalisisPorCategoria",
                new { PlanId = planId, IncluirSinGastos = incluirSinGastos ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> AnalisisTemporalAsync(Guid planId, string tipoAnalisis = "Diario")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "GastosViaje_GetAnalisisTemporal",
                new { PlanId = planId, TipoAnalisis = tipoAnalisis },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> GastosPorActividadAsync(Guid planId, bool incluirSinActividad = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "GastosViaje_GetGastosPorActividad",
                new { PlanId = planId, IncluirSinActividad = incluirSinActividad ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> ConversionMonedasAsync(Guid planId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "GastosViaje_GetConversionMonedas",
                new { PlanId = planId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> ActualizarCostosActividadesAsync(Guid planId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "GastosViaje_ActualizarCostosActividades",
                new { PlanId = planId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 