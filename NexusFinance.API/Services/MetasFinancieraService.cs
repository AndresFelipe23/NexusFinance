using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class MetasFinancieraService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public MetasFinancieraService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearMetaAsync(Guid usuarioId, string nombreMeta, string? descripcion, decimal montoObjetivo, decimal? montoActual, DateTime? fechaObjetivo, string tipoMeta, Guid? cuentaId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "MetasFinancieras_Insert",
                new { UsuarioId = usuarioId, NombreMeta = nombreMeta, Descripcion = descripcion, MontoObjetivo = montoObjetivo, MontoActual = montoActual, FechaObjetivo = fechaObjetivo, TipoMeta = tipoMeta, CuentaId = cuentaId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarMetaAsync(Guid metaId, string? nombreMeta = null, string? descripcion = null, decimal? montoObjetivo = null, decimal? montoActual = null, DateTime? fechaObjetivo = null, string? tipoMeta = null, Guid? cuentaId = null, bool? estaCompletada = null, DateTime? fechaComplecion = null, bool removerCuenta = false, bool removerFechaObjetivo = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "MetasFinancieras_Update",
                new { 
                    MetaId = metaId, 
                    NombreMeta = nombreMeta, 
                    Descripcion = descripcion, 
                    MontoObjetivo = montoObjetivo, 
                    MontoActual = montoActual,
                    FechaObjetivo = fechaObjetivo, 
                    CuentaId = cuentaId, 
                    EstaCompletada = estaCompletada,
                    FechaComplecion = fechaComplecion,
                    RemoverCuenta = removerCuenta ? 1 : 0, 
                    RemoverFechaObjetivo = removerFechaObjetivo ? 1 : 0 
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarMetaAsync(Guid metaId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "MetasFinancieras_Delete",
                new { MetaId = metaId, EliminacionFisica = eliminacionFisica ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerMetaPorIdAsync(Guid metaId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "MetasFinancieras_Select",
                new { MetaId = metaId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ObtenerMetasPorUsuarioAsync(Guid usuarioId, string? tipoMeta = null, bool soloActivas = true, string? ordenarPor = "fecha_objetivo")
        {
            try
            {
                Console.WriteLine($"MetasFinancieraService.ObtenerMetasPorUsuarioAsync llamado con: usuarioId={usuarioId}, tipoMeta={tipoMeta}, soloActivas={soloActivas}, ordenarPor={ordenarPor}");
                
                using var connection = new SqlConnection(_connectionString!);
                Console.WriteLine($"Conexión creada, connection string: {_connectionString?.Substring(0, Math.Min(50, _connectionString.Length))}...");
                
                var parameters = new { UsuarioId = usuarioId, TipoMeta = tipoMeta, SoloActivas = soloActivas ? 1 : 0, OrdenarPor = ordenarPor };
                Console.WriteLine($"Parámetros para SP: {System.Text.Json.JsonSerializer.Serialize(parameters)}");
                
                var result = await connection.QueryAsync(
                    "MetasFinancieras_SelectByUser",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
                
                Console.WriteLine($"SP ejecutado exitosamente, resultado: {result?.Count() ?? 0} registros");
                if (result != null && result.Any())
                {
                    Console.WriteLine($"Primer registro: {System.Text.Json.JsonSerializer.Serialize(result.First())}");
                }
                
                return result ?? new List<dynamic>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en MetasFinancieraService.ObtenerMetasPorUsuarioAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
} 