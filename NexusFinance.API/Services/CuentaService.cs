using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class CuentaService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public CuentaService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearCuentaAsync(Guid usuarioId, string nombreCuenta, string tipoCuenta, decimal? saldo = 0.00m, string? moneda = "COP", string? nombreBanco = null, string? numeroCuenta = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Cuentas_Insert",
                new { UsuarioId = usuarioId, NombreCuenta = nombreCuenta, TipoCuenta = tipoCuenta, Saldo = saldo, Moneda = moneda, NombreBanco = nombreBanco, NumeroCuenta = numeroCuenta },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarCuentaAsync(Guid cuentaId, string? nombreCuenta = null, string? tipoCuenta = null, string? moneda = null, string? nombreBanco = null, string? numeroCuenta = null, bool? estaActivo = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Cuentas_Update",
                new { CuentaId = cuentaId, NombreCuenta = nombreCuenta, TipoCuenta = tipoCuenta, Moneda = moneda, NombreBanco = nombreBanco, NumeroCuenta = numeroCuenta, EstaActivo = estaActivo },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarCuentaAsync(Guid cuentaId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Cuentas_Delete",
                new { CuentaId = cuentaId, EliminacionFisica = eliminacionFisica ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerCuentaPorIdAsync(Guid cuentaId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Cuentas_Select",
                new { CuentaId = cuentaId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ObtenerCuentasPorUsuarioAsync(Guid usuarioId, bool soloActivas = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "Cuentas_SelectByUser",
                new { UsuarioId = usuarioId, SoloActivas = soloActivas ? 1 : 0 },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 