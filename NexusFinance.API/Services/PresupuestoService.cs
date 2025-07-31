using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using NexusFinance.API.Models.DTOs; // Asegúrate de tener este using

namespace NexusFinance.API.Services
{
    public class PresupuestoService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public PresupuestoService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> CrearPresupuestoAsync(Guid usuarioId, string nombrePresupuesto, string periodoPresupuesto, DateTime fechaInicio, DateTime? fechaFin, decimal presupuestoTotal, bool crearCategoriasDefecto = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Presupuestos_Insert",
                new
                {
                    UsuarioId = usuarioId,
                    NombrePresupuesto = nombrePresupuesto,
                    PeriodoPresupuesto = periodoPresupuesto,
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    PresupuestoTotal = presupuestoTotal,
                    CrearCategoriasDefecto = crearCategoriasDefecto ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarPresupuestoAsync(Guid presupuestoId, string? nombrePresupuesto = null, DateTime? fechaInicio = null, DateTime? fechaFin = null, decimal? presupuestoTotal = null, bool? estaActivo = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Presupuestos_Update",
                new
                {
                    PresupuestoId = presupuestoId,
                    NombrePresupuesto = nombrePresupuesto,
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    PresupuestoTotal = presupuestoTotal,
                    EstaActivo = estaActivo
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarPresupuestoAsync(Guid presupuestoId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Presupuestos_Delete",
                new
                {
                    PresupuestoId = presupuestoId,
                    EliminacionFisica = eliminacionFisica ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerPresupuestoPorIdAsync(Guid presupuestoId, bool incluirCategorias = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryMultipleAsync(
                "Presupuestos_Select",
                new
                {
                    PresupuestoId = presupuestoId,
                    IncluirCategorias = incluirCategorias ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            var presupuesto = await result.ReadFirstOrDefaultAsync();
            var categorias = incluirCategorias ? (await result.ReadAsync()) : null;
            return new { Presupuesto = presupuesto, Categorias = categorias };
        }

        public async Task<IEnumerable<PresupuestoResponseDTO>> ObtenerPresupuestosPorUsuarioAsync(
            Guid usuarioId, DateTime? fechaReferencia = null, string? periodo = null, bool soloActivos = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync<PresupuestoResponseDTO>(
                "Presupuestos_SelectByUser",
                new
                {
                    UsuarioId = usuarioId,
                    FechaReferencia = fechaReferencia,
                    Periodo = periodo,
                    SoloActivos = soloActivos ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 