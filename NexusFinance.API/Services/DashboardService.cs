using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Models.Entities;
using System.Data;

namespace NexusFinance.API.Services;

public interface IDashboardService
{
    Task<DashboardCompletoDTO> ObtenerDashboardCompletoAsync(Guid usuarioId);
    Task<EstadisticasGeneralesDTO> ObtenerEstadisticasGeneralesAsync(Guid usuarioId);
    Task<List<TransaccionPorCategoriaDTO>> ObtenerTransaccionesPorCategoriaAsync(Guid usuarioId, string? tipo = null);
    Task<List<TendenciaMensualDTO>> ObtenerTendenciasMensualesAsync(Guid usuarioId);
    Task<List<MetaResumenDTO>> ObtenerResumenMetasAsync(Guid usuarioId, int limite = 5);
    Task<List<CuentaResumenDTO>> ObtenerResumenCuentasAsync(Guid usuarioId, int limite = 6);
    Task<List<TransaccionRecienteDTO>> ObtenerTransaccionesRecientesAsync(Guid usuarioId, int limite = 10);
}

public class DashboardService : IDashboardService
{
    private readonly NexusFinanceContext _context;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(NexusFinanceContext context, ILogger<DashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardCompletoDTO> ObtenerDashboardCompletoAsync(Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Obteniendo dashboard completo para usuario: {UsuarioId}", usuarioId);

            var dashboard = new DashboardCompletoDTO();

            // Obtener datos de forma secuencial para mejor debugging
            _logger.LogInformation("Obteniendo estadísticas generales...");
            dashboard.Estadisticas = await ObtenerEstadisticasGeneralesAsync(usuarioId);
            
            _logger.LogInformation("Obteniendo gastos por categoría...");
            dashboard.GastosPorCategoria = await ObtenerTransaccionesPorCategoriaAsync(usuarioId, "gasto");
            
            _logger.LogInformation("Obteniendo ingresos por categoría...");
            dashboard.IngresosPorCategoria = await ObtenerTransaccionesPorCategoriaAsync(usuarioId, "ingreso");
            
            _logger.LogInformation("Obteniendo tendencias mensuales...");
            dashboard.TendenciasMensuales = await ObtenerTendenciasMensualesAsync(usuarioId);
            
            _logger.LogInformation("Obteniendo resumen de metas...");
            dashboard.MetasResumen = await ObtenerResumenMetasAsync(usuarioId);
            
            _logger.LogInformation("Obteniendo resumen de cuentas...");
            dashboard.CuentasResumen = await ObtenerResumenCuentasAsync(usuarioId);
            
            _logger.LogInformation("Obteniendo transacciones recientes...");
            dashboard.TransaccionesRecientes = await ObtenerTransaccionesRecientesAsync(usuarioId);

            _logger.LogInformation("Dashboard completo obtenido exitosamente para usuario: {UsuarioId}", usuarioId);
            return dashboard;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener dashboard completo para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }

    public async Task<EstadisticasGeneralesDTO> ObtenerEstadisticasGeneralesAsync(Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de estadísticas generales para usuario: {UsuarioId}", usuarioId);
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }
            
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerEstadisticasGenerales", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);

            using var reader = await command.ExecuteReaderAsync();
            
            if (await reader.ReadAsync())
            {
                return new EstadisticasGeneralesDTO
                {
                    TotalIngresos = reader.GetDecimal("TotalIngresos"),
                    TotalGastos = reader.GetDecimal("TotalGastos"),
                    Balance = reader.GetDecimal("Balance"),
                    TransaccionesCount = reader.GetInt32("TransaccionesCount"),
                    CuentasCount = reader.GetInt32("CuentasCount"),
                    MetasCount = reader.GetInt32("MetasCount"),
                    MetasCompletadas = reader.GetInt32("MetasCompletadas"),
                    PresupuestosCount = reader.GetInt32("PresupuestosCount")
                };
            }

            return new EstadisticasGeneralesDTO();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener estadísticas generales para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }

    public async Task<List<TransaccionPorCategoriaDTO>> ObtenerTransaccionesPorCategoriaAsync(Guid usuarioId, string? tipo = null)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de transacciones por categoría para usuario: {UsuarioId}, tipo: {Tipo}", usuarioId, tipo);

            var resultado = new List<TransaccionPorCategoriaDTO>();
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerTransaccionesPorCategoria", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);
            command.Parameters.AddWithValue("@Tipo", (object?)tipo ?? DBNull.Value);

            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                resultado.Add(new TransaccionPorCategoriaDTO
                {
                    CategoriaId = reader.GetGuid("CategoriaId"),
                    NombreCategoria = reader.GetString("NombreCategoria"),
                    TipoCategoria = reader.GetString("TipoCategoria"),
                    IconoCategoria = reader.IsDBNull("IconoCategoria") ? "📊" : reader.GetString("IconoCategoria"),
                    Color = reader.IsDBNull("Color") ? "#6B7280" : reader.GetString("Color"),
                    MontoTotal = reader.GetDecimal("MontoTotal"),
                    TransaccionesCount = reader.GetInt32("TransaccionesCount")
                });
            }

            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener transacciones por categoría para usuario: {UsuarioId}, tipo: {Tipo}", usuarioId, tipo);
            throw;
        }
    }

    public async Task<List<TendenciaMensualDTO>> ObtenerTendenciasMensualesAsync(Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de tendencias mensuales para usuario: {UsuarioId}", usuarioId);

            var resultado = new List<TendenciaMensualDTO>();
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerTendenciasMensuales", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);

            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                resultado.Add(new TendenciaMensualDTO
                {
                    MesNombre = reader.GetString("MesNombre"),
                    Anio = reader.GetInt32("Anio"),
                    Mes = reader.GetInt32("Mes"),
                    Ingresos = reader.GetDecimal("Ingresos"),
                    Gastos = reader.GetDecimal("Gastos"),
                    Balance = reader.GetDecimal("Balance")
                });
            }

            _logger.LogInformation("Se obtuvieron {Count} tendencias mensuales para el usuario {UsuarioId}", resultado.Count, usuarioId);
            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener tendencias mensuales para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }

    public async Task<List<MetaResumenDTO>> ObtenerResumenMetasAsync(Guid usuarioId, int limite = 5)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de resumen de metas para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            var resultado = new List<MetaResumenDTO>();
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerResumenMetas", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);
            command.Parameters.AddWithValue("@Limit", limite);

            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                resultado.Add(new MetaResumenDTO
                {
                    MetaId = reader.GetGuid("MetaId"),
                    NombreMeta = reader.GetString("NombreMeta"),
                    MontoObjetivo = reader.GetDecimal("MontoObjetivo"),
                    MontoActual = reader.GetDecimal("MontoActual"),
                    PorcentajeProgreso = reader.GetDecimal("PorcentajeProgreso"),
                    DiasRestantes = reader.IsDBNull("DiasRestantes") ? null : reader.GetInt32("DiasRestantes"),
                    EstaCompletada = reader.GetBoolean("EstaCompletada"),
                    FechaObjetivo = reader.IsDBNull("FechaObjetivo") ? null : reader.GetDateTime("FechaObjetivo")
                });
            }

            _logger.LogInformation("Se obtuvieron {Count} metas para el usuario {UsuarioId}", resultado.Count, usuarioId);
            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener resumen de metas para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }

    public async Task<List<CuentaResumenDTO>> ObtenerResumenCuentasAsync(Guid usuarioId, int limite = 6)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de resumen de cuentas para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            var resultado = new List<CuentaResumenDTO>();
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerResumenCuentas", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);
            command.Parameters.AddWithValue("@Limit", limite);

            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                resultado.Add(new CuentaResumenDTO
                {
                    CuentaId = reader.GetGuid("CuentaId"),
                    NombreCuenta = reader.GetString("NombreCuenta"),
                    TipoCuenta = reader.GetString("TipoCuenta"),
                    Saldo = reader.GetDecimal("Saldo"),
                    NombreBanco = reader.IsDBNull("NombreBanco") ? null : reader.GetString("NombreBanco"),
                    Moneda = reader.GetString("Moneda")
                });
            }

            _logger.LogInformation("Se obtuvieron {Count} cuentas para el usuario {UsuarioId}", resultado.Count, usuarioId);
            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener resumen de cuentas para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }

    public async Task<List<TransaccionRecienteDTO>> ObtenerTransaccionesRecientesAsync(Guid usuarioId, int limite = 10)
    {
        try
        {
            _logger.LogInformation("Ejecutando SP de transacciones recientes para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            var resultado = new List<TransaccionRecienteDTO>();
            
            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión no está configurada en el contexto");
            }

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("sp_ObtenerTransaccionesRecientes", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@UsuarioId", usuarioId);
            command.Parameters.AddWithValue("@Limit", limite);

            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                resultado.Add(new TransaccionRecienteDTO
                {
                    TransaccionId = reader.GetGuid("TransaccionId"),
                    Monto = reader.GetDecimal("Monto"),
                    TipoTransaccion = reader.GetString("TipoTransaccion"),
                    Descripcion = reader.IsDBNull("Descripcion") ? null : reader.GetString("Descripcion"),
                    FechaTransaccion = reader.GetDateTime("FechaTransaccion"),
                    NombreCategoria = reader.GetString("NombreCategoria"),
                    TipoCategoria = reader.GetString("TipoCategoria"),
                    IconoCategoria = reader.IsDBNull("IconoCategoria") ? "📊" : reader.GetString("IconoCategoria"),
                    Color = reader.IsDBNull("Color") ? "#6B7280" : reader.GetString("Color"),
                    NombreCuenta = reader.GetString("NombreCuenta"),
                    TipoCuenta = reader.GetString("TipoCuenta"),
                    NombreBanco = reader.IsDBNull("NombreBanco") ? null : reader.GetString("NombreBanco")
                });
            }

            _logger.LogInformation("Se obtuvieron {Count} transacciones recientes para el usuario {UsuarioId}", resultado.Count, usuarioId);
            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener transacciones recientes para usuario: {UsuarioId}", usuarioId);
            throw;
        }
    }
}