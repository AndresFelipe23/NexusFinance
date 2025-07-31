using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class PlanesVacacioneService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public PlanesVacacioneService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearPlanAsync(Guid usuarioId, string nombrePlan, string? descripcion, string destino, string pais, string? ciudad, DateTime fechaInicio, DateTime fechaFin, int? cantidadPersonas, decimal? presupuestoEstimado, string? monedaDestino, decimal? tasaCambio, bool? esViajeInternacional, Guid? metaFinancieraId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PlanesVacaciones_Insert",
                new { UsuarioId = usuarioId, NombrePlan = nombrePlan, Descripcion = descripcion, Destino = destino, Pais = pais, Ciudad = ciudad, FechaInicio = fechaInicio, FechaFin = fechaFin, CantidadPersonas = cantidadPersonas, PresupuestoEstimado = presupuestoEstimado, MonedaDestino = monedaDestino, TasaCambio = tasaCambio, EsViajeInternacional = esViajeInternacional, MetaFinancieraId = metaFinancieraId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarPlanAsync(Guid planId, string? nombrePlan = null, string? descripcion = null, string? destino = null, string? pais = null, string? ciudad = null, DateTime? fechaInicio = null, DateTime? fechaFin = null, int? cantidadPersonas = null, decimal? presupuestoEstimado = null, decimal? presupuestoReal = null, string? monedaDestino = null, decimal? tasaCambio = null, string? estadoPlan = null, bool? esViajeInternacional = null, Guid? metaFinancieraId = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PlanesVacaciones_Update",
                new { PlanId = planId, NombrePlan = nombrePlan, Descripcion = descripcion, Destino = destino, Pais = pais, Ciudad = ciudad, FechaInicio = fechaInicio, FechaFin = fechaFin, CantidadPersonas = cantidadPersonas, PresupuestoEstimado = presupuestoEstimado, PresupuestoReal = presupuestoReal, MonedaDestino = monedaDestino, TasaCambio = tasaCambio, EstadoPlan = estadoPlan, EsViajeInternacional = esViajeInternacional, MetaFinancieraId = metaFinancieraId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarPlanAsync(Guid planId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PlanesVacaciones_Delete",
                new { PlanId = planId, EliminacionFisica = eliminacionFisica ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerPlanPorIdAsync(Guid planId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "PlanesVacaciones_Select",
                new { PlanId = planId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<Models.Entities.PlanesVacacione>> ObtenerPlanesPorUsuarioAsync(Guid usuarioId, string? estadoPlan = null, bool soloActivos = true, string? ordenarPor = "fecha_inicio")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync<Models.Entities.PlanesVacacione>(
                "PlanesVacaciones_SelectByUser",
                new { UsuarioId = usuarioId, EstadoPlan = estadoPlan, SoloActivos = soloActivos ? 1 : 0, OrdenarPor = ordenarPor },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 