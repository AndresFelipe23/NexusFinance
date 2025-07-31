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
    public class TransaccioneService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public TransaccioneService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<TransaccionResponseDTO> CrearTransaccionAsync(Guid usuarioId, Guid cuentaId, Guid? categoriaId, decimal monto, string tipoTransaccion, string? descripcion, string? notas, DateTime fechaTransaccion, Guid? transaccionRecurrenteId, string? urlRecibo, bool estaConciliado = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync<TransaccionResponseDTO>(
                "Transacciones_Insert",
                new
                {
                    UsuarioId = usuarioId,
                    CuentaId = cuentaId,
                    CategoriaId = categoriaId,
                    Monto = monto,
                    TipoTransaccion = tipoTransaccion,
                    Descripcion = descripcion,
                    Notas = notas,
                    FechaTransaccion = fechaTransaccion,
                    TransaccionRecurrenteId = transaccionRecurrenteId,
                    UrlRecibo = urlRecibo,
                    EstaConciliado = estaConciliado ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new TransaccionResponseDTO();
        }

        public async Task<TransaccionResponseDTO> ActualizarTransaccionAsync(Guid transaccionId, Guid? cuentaId = null, Guid? categoriaId = null, decimal? monto = null, string? descripcion = null, string? notas = null, DateTime? fechaTransaccion = null, string? urlRecibo = null, bool? estaConciliado = null)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync<TransaccionResponseDTO>(
                "Transacciones_Update",
                new
                {
                    TransaccionId = transaccionId,
                    CuentaId = cuentaId,
                    CategoriaId = categoriaId,
                    Monto = monto,
                    Descripcion = descripcion,
                    Notas = notas,
                    FechaTransaccion = fechaTransaccion,
                    UrlRecibo = urlRecibo,
                    EstaConciliado = estaConciliado
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new TransaccionResponseDTO();
        }

        public async Task<bool> EliminarTransaccionAsync(Guid transaccionId, bool validarSaldo = true)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.ExecuteAsync(
                "Transacciones_Delete",
                new
                {
                    TransaccionId = transaccionId,
                    ValidarSaldo = validarSaldo ? 1 : 0
                },
                commandType: CommandType.StoredProcedure
            );
            return result > 0;
        }

        public async Task<TransaccionResponseDTO> ObtenerTransaccionPorIdAsync(Guid transaccionId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync<TransaccionResponseDTO>(
                "Transacciones_Select",
                new { TransaccionId = transaccionId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new TransaccionResponseDTO();
        }

        public async Task<IEnumerable<TransaccionResponseDTO>> ObtenerTransaccionesPorUsuarioAsync(Guid usuarioId, Guid? cuentaId = null, Guid? categoriaId = null, string? tipoTransaccion = null, DateTime? fechaInicio = null, DateTime? fechaFin = null, decimal? montoMinimo = null, decimal? montoMaximo = null, string? busquedaTexto = null, bool? soloConciliadas = null, int pagina = 1, int tamanoPagina = 50, string ordenarPor = "fecha_desc")
        {
            using var connection = new SqlConnection(_connectionString!);
            
            // Convertir fechas a UTC si no son null
            DateTime? fechaInicioUtc = fechaInicio?.ToUniversalTime();
            DateTime? fechaFinUtc = fechaFin?.ToUniversalTime();
            
            var result = await connection.QueryAsync<TransaccionResponseDTO>(
                "Transacciones_SelectByUser",
                new
                {
                    UsuarioId = usuarioId,
                    CuentaId = cuentaId,
                    CategoriaId = categoriaId,
                    TipoTransaccion = tipoTransaccion,
                    FechaInicio = fechaInicioUtc,
                    FechaFin = fechaFinUtc,
                    MontoMinimo = montoMinimo,
                    MontoMaximo = montoMaximo,
                    BusquedaTexto = busquedaTexto,
                    SoloConciliadas = soloConciliadas,
                    Pagina = pagina,
                    TamanoPagina = tamanoPagina,
                    OrdenarPor = ordenarPor
                },
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

        public string[] ObtenerTiposTransaccion()
        {
            return new[] { "ingreso", "gasto", "transferencia" };
        }

        public string ObtenerColorPorTipo(string tipoTransaccion)
        {
            return tipoTransaccion switch
            {
                "ingreso" => "text-green-600",
                "gasto" => "text-red-600",
                "transferencia" => "text-blue-600",
                _ => "text-gray-600"
            };
        }
    }
} 