using System.Data;
using System.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace NexusFinance.API.Services
{
    public class CategoriaService
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public CategoriaService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> CrearCategoriaAsync(Guid usuarioId, string nombreCategoria, string tipoCategoria, Guid? categoriaIdPadre, string color, string icono)
        {
            // Validación adicional en el servicio
            var tiposPermitidos = new[] { "ingreso", "gasto", "transferencia", "inversion", "ahorro", "credito", "deuda" };
            if (!tiposPermitidos.Contains(tipoCategoria.ToLower()))
            {
                throw new ArgumentException($"Tipo de categoría '{tipoCategoria}' no es válido. Tipos permitidos: {string.Join(", ", tiposPermitidos)}");
            }

            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Categorias_Insert",
                new
                {
                    UsuarioId = usuarioId,
                    NombreCategoria = nombreCategoria,
                    TipoCategoria = tipoCategoria,
                    CategoriaIdPadre = categoriaIdPadre,
                    Color = color,
                    Icono = icono
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ActualizarCategoriaAsync(Guid categoriaId, string? nombreCategoria, Guid? categoriaIdPadre, string? color, string? icono, bool? estaActivo, bool cambiarPadre)
        {
            // Log de los parámetros recibidos
            Console.WriteLine($"[CategoriaService] Actualizando categoría {categoriaId}");
            Console.WriteLine($"[CategoriaService] NombreCategoria: {nombreCategoria}");
            Console.WriteLine($"[CategoriaService] CategoriaIdPadre: {categoriaIdPadre}");
            Console.WriteLine($"[CategoriaService] Color: {color}");
            Console.WriteLine($"[CategoriaService] Icono: {icono}");
            Console.WriteLine($"[CategoriaService] EstaActivo: {estaActivo}");
            Console.WriteLine($"[CategoriaService] CambiarPadre: {cambiarPadre}");
            
            using var connection = new SqlConnection(_connectionString);
            var parameters = new
            {
                CategoriaId = categoriaId,
                NombreCategoria = nombreCategoria,
                CategoriaIdPadre = categoriaIdPadre,
                Color = color,
                Icono = icono,
                EstaActivo = estaActivo,
                CambiarPadre = cambiarPadre
            };
            
            Console.WriteLine($"[CategoriaService] Parámetros enviados al SP: {System.Text.Json.JsonSerializer.Serialize(parameters)}");
            
            var result = await connection.QueryFirstOrDefaultAsync(
                "Categorias_Update",
                parameters,
                commandType: CommandType.StoredProcedure
            );
            
            Console.WriteLine($"[CategoriaService] Resultado: {System.Text.Json.JsonSerializer.Serialize(result)}");
            return result;
        }

        public async Task<dynamic> EliminarCategoriaAsync(Guid categoriaId, bool eliminacionFisica)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Categorias_Delete",
                new
                {
                    CategoriaId = categoriaId,
                    EliminacionFisica = eliminacionFisica
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ObtenerCategoriaPorIdAsync(Guid categoriaId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Categorias_Select",
                new { CategoriaId = categoriaId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<IEnumerable<dynamic>> ObtenerCategoriasPorUsuarioAsync(Guid usuarioId, string? tipoCategoria, bool soloActivas, bool incluirJerarquia)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync(
                "Categorias_SelectByUser",
                new
                {
                    UsuarioId = usuarioId,
                    TipoCategoria = tipoCategoria,
                    SoloActivas = soloActivas,
                    IncluirJerarquia = incluirJerarquia
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 