using System.Data;
using System.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using AutoMapper;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Models.Entities;

namespace NexusFinance.API.Services
{
    public class CategoriasGastosViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly IMapper _mapper;

        public CategoriasGastosViajeService(IConfiguration configuration, IMapper mapper)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _mapper = mapper;
        }

        public async Task<CategoriaGastosViajeResponseDTO> CrearCategoriaGastoViajeAsync(string nombreCategoria, string? descripcion, string? icono, string? color, bool? esObligatoria, int? ordenVisualizacion)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<CategoriasGastosViaje>(
                "CategoriasGastosViaje_Insert",
                new
                {
                    NombreCategoria = nombreCategoria,
                    Descripcion = descripcion,
                    Icono = icono,
                    Color = color,
                    EsObligatoria = esObligatoria,
                    OrdenVisualizacion = ordenVisualizacion
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<CategoriaGastosViajeResponseDTO>(result);
        }

        public async Task<CategoriaGastosViajeResponseDTO> ActualizarCategoriaGastoViajeAsync(Guid categoriaViajeId, string? nombreCategoria, string? descripcion, string? icono, string? color, bool? esObligatoria, int? ordenVisualizacion, bool? estaActivo)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<CategoriasGastosViaje>(
                "CategoriasGastosViaje_Update",
                new
                {
                    CategoriaViajeId = categoriaViajeId,
                    NombreCategoria = nombreCategoria,
                    Descripcion = descripcion,
                    Icono = icono,
                    Color = color,
                    EsObligatoria = esObligatoria,
                    OrdenVisualizacion = ordenVisualizacion,
                    EstaActivo = estaActivo
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<CategoriaGastosViajeResponseDTO>(result);
        }

        public async Task<string> EliminarCategoriaGastoViajeAsync(Guid categoriaViajeId, bool eliminacionFisica = false)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasGastosViaje_Delete",
                new
                {
                    CategoriaViajeId = categoriaViajeId,
                    EliminacionFisica = eliminacionFisica
                },
                commandType: CommandType.StoredProcedure
            );
            return result?.Resultado?.ToString() ?? "Operación completada";
        }

        public async Task<CategoriaGastosViajeResponseDTO> ObtenerCategoriaGastoViajePorIdAsync(Guid categoriaViajeId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<CategoriasGastosViaje>(
                "CategoriasGastosViaje_Select",
                new { CategoriaViajeId = categoriaViajeId },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<CategoriaGastosViajeResponseDTO>(result);
        }

        public async Task<IEnumerable<CategoriaGastosViajeResponseDTO>> ObtenerCategoriasGastosViajeAsync(bool soloActivas = true, bool soloObligatorias = false, bool incluirEstadisticas = false, string ordenarPor = "OrdenVisualizacion")
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<CategoriasGastosViaje>(
                "CategoriasGastosViaje_SelectAll",
                new
                {
                    SoloActivas = soloActivas,
                    SoloObligatorias = soloObligatorias,
                    IncluirEstadisticas = incluirEstadisticas,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<IEnumerable<CategoriaGastosViajeResponseDTO>>(result);
        }

        public async Task<IEnumerable<CategoriaGastosViajeResponseDTO>> ReordenarVisualizacionAsync(string listaCategorias)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<CategoriasGastosViaje>(
                "CategoriasGastosViaje_ReordenarVisualizacion",
                new { ListaCategorias = listaCategorias },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<IEnumerable<CategoriaGastosViajeResponseDTO>>(result);
        }

        public async Task<string> InicializarCategoriasAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "CategoriasGastosViaje_InicializarCategorias",
                commandType: CommandType.StoredProcedure
            );
            return result?.Resultado?.ToString() ?? "Categorías inicializadas";
        }
    }
} 