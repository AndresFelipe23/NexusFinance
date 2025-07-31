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
    public class CategoriasPresupuestoService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public CategoriasPresupuestoService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> CrearCategoriaPresupuestoAsync(Guid presupuestoId, Guid categoriaId, decimal montoAsignado)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_Insert",
                new
                {
                    PresupuestoId = presupuestoId,
                    CategoriaId = categoriaId,
                    MontoAsignado = montoAsignado
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarCategoriaPresupuestoAsync(Guid categoriaPresupuestoId, decimal? montoAsignado)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_Update",
                new
                {
                    CategoriaPresupuestoId = categoriaPresupuestoId,
                    MontoAsignado = montoAsignado
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarCategoriaPresupuestoAsync(Guid categoriaPresupuestoId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_Delete",
                new { CategoriaPresupuestoId = categoriaPresupuestoId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerCategoriaPresupuestoPorIdAsync(Guid categoriaPresupuestoId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_Select",
                new { CategoriaPresupuestoId = categoriaPresupuestoId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<CategoriaPresupuestoResponseDTO>> ObtenerCategoriasPorPresupuestoAsync(Guid presupuestoId, bool soloConGastos = false, string ordenarPor = "nombre")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync<CategoriaPresupuestoResponseDTO>(
                "CategoriasPresupuesto_SelectByPresupuesto",
                new
                {
                    PresupuestoId = presupuestoId,
                    SoloConGastos = soloConGastos,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ActualizarMontoGastadoAsync(Guid? presupuestoId = null, Guid? categoriaId = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_UpdateMontoGastado",
                new
                {
                    PresupuestoId = presupuestoId,
                    CategoriaId = categoriaId
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> RedistribuirAsync(Guid presupuestoId, decimal? nuevoPresupuestoTotal = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasPresupuesto_Redistribuir",
                new
                {
                    PresupuestoId = presupuestoId,
                    NuevoPresupuestoTotal = nuevoPresupuestoTotal
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }
    }
} 