using System.Data;
using System.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using AutoMapper;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Models.Entities;

namespace NexusFinance.API.Services
{
    public class ActividadesViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly IMapper _mapper;

        public ActividadesViajeService(IConfiguration configuration, IMapper mapper)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _mapper = mapper;
        }

        public async Task<ActividadViajeResponseDTO> CrearActividadAsync(
            Guid planId, string nombreActividad, string? descripcion, DateTime? fechaHoraInicio,
            DateTime? fechaHoraFin, decimal costoEstimado, string? ubicacion,
            Guid? categoriaViajeId, string prioridad, string? urlReferencia)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<ActividadesViaje>(
                "ActividadesViaje_Insert",
                new
                {
                    PlanId = planId,
                    NombreActividad = nombreActividad,
                    Descripcion = descripcion,
                    FechaHoraInicio = fechaHoraInicio,
                    FechaHoraFin = fechaHoraFin,
                    CostoEstimado = costoEstimado,
                    Ubicacion = ubicacion,
                    CategoriaViajeId = categoriaViajeId,
                    Prioridad = prioridad,
                    UrlReferencia = urlReferencia
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<ActividadViajeResponseDTO>(result);
        }

        public async Task<ActividadViajeResponseDTO> ActualizarActividadAsync(
            Guid actividadId, string? nombreActividad, string? descripcion, DateTime? fechaHoraInicio,
            DateTime? fechaHoraFin, decimal? costoEstimado, decimal? costoReal,
            string? ubicacion, Guid? categoriaViajeId, string? prioridad, string? estadoActividad,
            string? urlReferencia)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<ActividadesViaje>(
                "ActividadesViaje_Update",
                new
                {
                    ActividadId = actividadId,
                    NombreActividad = nombreActividad,
                    Descripcion = descripcion,
                    FechaHoraInicio = fechaHoraInicio,
                    FechaHoraFin = fechaHoraFin,
                    CostoEstimado = costoEstimado,
                    CostoReal = costoReal,
                    Ubicacion = ubicacion,
                    CategoriaViajeId = categoriaViajeId,
                    Prioridad = prioridad,
                    EstadoActividad = estadoActividad,
                    UrlReferencia = urlReferencia
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<ActividadViajeResponseDTO>(result);
        }

        public async Task<object> EliminarActividadAsync(Guid actividadId, bool eliminacionFisica)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ActividadesViaje_Delete",
                new
                {
                    ActividadId = actividadId,
                    EliminacionFisica = eliminacionFisica
                },
                commandType: CommandType.StoredProcedure
            );
            var message = result?.Resultado?.ToString() ?? "Operación completada";
            return new { Message = message };
        }

        public async Task<ActividadViajeResponseDTO> ObtenerActividadPorIdAsync(Guid actividadId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<ActividadesViaje>(
                "ActividadesViaje_Select",
                new { ActividadId = actividadId },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<ActividadViajeResponseDTO>(result);
        }

        public async Task<IEnumerable<ActividadViajeResponseDTO>> ObtenerActividadesPorPlanAsync(
            Guid planId, string? estadoActividad, string? prioridad, Guid? categoriaViajeId,
            DateTime? fechaDesde, DateTime? fechaHasta, bool incluirCanceladas, string ordenarPor)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<ActividadesViaje>(
                "ActividadesViaje_SelectByPlan",
                new
                {
                    PlanId = planId
                },
                commandType: CommandType.StoredProcedure
            );
            return _mapper.Map<IEnumerable<ActividadViajeResponseDTO>>(result);
        }
    }
} 