using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class TransaccionesRecurrenteService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public TransaccionesRecurrenteService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> CrearTransaccionRecurrenteAsync(Guid usuarioId, Guid cuentaId, Guid categoriaId, decimal monto, string tipoTransaccion, string? descripcion, string frecuencia, DateTime fechaInicio, DateTime? fechaFin)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "TransaccionesRecurrentes_Insert",
                new { 
                    UsuarioId = usuarioId, 
                    CuentaId = cuentaId, 
                    CategoriaId = categoriaId, 
                    Monto = monto, 
                    TipoTransaccion = tipoTransaccion, 
                    Descripcion = descripcion, 
                    Frecuencia = frecuencia, 
                    FechaInicio = fechaInicio, 
                    FechaFin = fechaFin 
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> ObtenerTransaccionesRecurrentesPorUsuarioAsync(Guid usuarioId, string? tipoTransaccion = null, string? frecuencia = null, bool soloActivas = true, bool soloPendientes = false)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<dynamic>(
                "TransaccionesRecurrentes_SelectByUser",
                new { 
                    UsuarioId = usuarioId,
                    TipoTransaccion = tipoTransaccion,
                    Frecuencia = frecuencia,
                    SoloActivas = soloActivas,
                    SoloPendientes = soloPendientes
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ObtenerTransaccionRecurrentePorIdAsync(Guid recurrenteId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "TransaccionesRecurrentes_Select",
                new { RecurrenteId = recurrenteId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ActualizarTransaccionRecurrenteAsync(Guid recurrenteId, Guid? cuentaId, Guid? categoriaId, decimal? monto, string? descripcion, string? frecuencia, DateTime? fechaFin, bool? estaActivo, bool removerFechaFin = false)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "TransaccionesRecurrentes_Update",
                new { 
                    RecurrenteId = recurrenteId, 
                    CuentaId = cuentaId, 
                    CategoriaId = categoriaId, 
                    Monto = monto, 
                    Descripcion = descripcion, 
                    Frecuencia = frecuencia, 
                    FechaFin = fechaFin, 
                    EstaActivo = estaActivo,
                    RemoverFechaFin = removerFechaFin
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<bool> EliminarTransaccionRecurrenteAsync(Guid recurrenteId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.ExecuteAsync(
                "TransaccionesRecurrentes_Delete",
                new { 
                    RecurrenteId = recurrenteId,
                    EliminacionFisica = eliminacionFisica
                },
                commandType: CommandType.StoredProcedure
            );
            return result > 0;
        }

        public async Task<IEnumerable<string>> ObtenerFrecuenciasAsync()
        {
            return new[] { "diario", "semanal", "mensual", "anual" };
        }

        public async Task<IEnumerable<string>> ObtenerTiposTransaccionAsync()
        {
            return new[] { "ingreso", "gasto", "transferencia" };
        }
    }
} 