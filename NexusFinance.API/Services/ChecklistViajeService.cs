using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace NexusFinance.API.Services
{
    public class ChecklistViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;

        public ChecklistViajeService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<dynamic> CrearChecklistViajeAsync(Guid planId, string item, string? descripcion, string? categoriaChecklist, DateTime? fechaLimite, string? prioridad, int? ordenVisualizacion)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_Insert",
                new
                {
                    PlanId = planId,
                    Item = item,
                    Descripcion = descripcion,
                    CategoriaChecklist = categoriaChecklist,
                    FechaLimite = fechaLimite,
                    Prioridad = prioridad,
                    OrdenVisualizacion = ordenVisualizacion
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ActualizarChecklistViajeAsync(Guid checklistId, string? item, string? descripcion, string? categoriaChecklist, bool? estaCompletado, DateTime? fechaLimite, string? prioridad, int? ordenVisualizacion)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_Update",
                new
                {
                    ChecklistId = checklistId,
                    Item = item,
                    Descripcion = descripcion,
                    CategoriaChecklist = categoriaChecklist,
                    EstaCompletado = estaCompletado,
                    FechaLimite = fechaLimite,
                    Prioridad = prioridad,
                    OrdenVisualizacion = ordenVisualizacion
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> EliminarChecklistViajeAsync(Guid checklistId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_Delete",
                new { ChecklistId = checklistId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> ObtenerChecklistViajePorIdAsync(Guid checklistId)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_Select",
                new { ChecklistId = checklistId },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ObtenerChecklistPorPlanAsync(Guid planId, string? categoriaChecklist = null, bool? estadoCompletado = null, bool soloVencidos = false, bool soloProximosVencer = false, string ordenarPor = "Categoria")
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "ChecklistViaje_SelectByPlan",
                new
                {
                    PlanId = planId,
                    CategoriaChecklist = categoriaChecklist,
                    EstadoCompletado = estadoCompletado,
                    SoloVencidos = soloVencidos,
                    SoloProximosVencer = soloProximosVencer,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> MarcarCompletadoAsync(Guid checklistId, bool estaCompletado)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_MarcarCompletado",
                new
                {
                    ChecklistId = checklistId,
                    EstaCompletado = estaCompletado
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<dynamic> GetResumenAsync(Guid planId)
        {
            using var connection = new SqlConnection(_connectionString!);
            using var multi = await connection.QueryMultipleAsync(
                "ChecklistViaje_GetResumen",
                new { PlanId = planId },
                commandType: CommandType.StoredProcedure
            );
            var resumenGeneral = await multi.ReadFirstOrDefaultAsync() ?? new { };
            var resumenCategorias = (await multi.ReadAsync()).AsList();
            var itemsUrgentes = (await multi.ReadAsync()).AsList();
            return new { ResumenGeneral = resumenGeneral, ResumenCategorias = resumenCategorias, ItemsUrgentes = itemsUrgentes };
        }

        public async Task<dynamic> CrearChecklistBasicoAsync(Guid planId, bool esViajeInternacional = false)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryFirstOrDefaultAsync(
                "ChecklistViaje_CrearChecklistBasico",
                new
                {
                    PlanId = planId,
                    EsViajeInternacional = esViajeInternacional
                },
                commandType: CommandType.StoredProcedure
            );
            return result ?? new { };
        }

        public async Task<IEnumerable<dynamic>> ReordenarItemsAsync(Guid planId, string categoriaChecklist, string listaItems)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.QueryAsync(
                "ChecklistViaje_ReordenarItems",
                new
                {
                    PlanId = planId,
                    CategoriaChecklist = categoriaChecklist,
                    ListaItems = listaItems
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }
    }
} 