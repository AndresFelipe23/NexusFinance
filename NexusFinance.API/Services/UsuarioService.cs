using System.Data;
using System.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace NexusFinance.API.Services
{
    public class UsuarioService
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public UsuarioService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<dynamic> RegistrarUsuarioAsync(string nombre, string apellido, string email, string claveHash, string moneda = "USD", string zonaHoraria = "UTC")
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Usuarios_Insert",
                new
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Email = email,
                    ClaveHash = claveHash,
                    Moneda = moneda,
                    ZonaHoraria = zonaHoraria
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ObtenerUsuarioPorEmailAsync(string email)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "Usuarios_SelectByEmail",
                new { Email = email },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 