using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.Threading.Tasks;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MetasFinancieraController : ControllerBase
    {
        private readonly MetasFinancieraService _service;

        public MetasFinancieraController(MetasFinancieraService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearMetaFinancieraDTO dto)
        {
            var result = await _service.CrearMetaAsync(dto.UsuarioId, dto.NombreMeta, dto.Descripcion, dto.MontoObjetivo, dto.MontoActual, dto.FechaObjetivo, dto.TipoMeta, dto.CuentaId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarMetaFinancieraDTO dto)
        {
            try
            {
                Console.WriteLine($"Actualizar llamado con: id={id}, dto.MetaId={dto.MetaId}");
                Console.WriteLine($"DTO recibido: {System.Text.Json.JsonSerializer.Serialize(dto)}");
                
                if (id != dto.MetaId) 
                {
                    Console.WriteLine($"Error: El id de la ruta ({id}) no coincide con el del cuerpo ({dto.MetaId})");
                    return BadRequest("El id de la ruta no coincide con el del cuerpo.");
                }
                
                var result = await _service.ActualizarMetaAsync(dto.MetaId, dto.NombreMeta, dto.Descripcion, dto.MontoObjetivo, dto.MontoActual, dto.FechaObjetivo, dto.TipoMeta, dto.CuentaId, dto.EstaCompletada, dto.FechaComplecion);
                Console.WriteLine($"Actualización exitosa: {System.Text.Json.JsonSerializer.Serialize(result)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en Actualizar: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarMetaAsync(id, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerMetaPorIdAsync(id);
            return Ok(result);
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(Guid usuarioId, [FromQuery] string? tipoMeta = null, [FromQuery] bool soloActivas = true, [FromQuery] string? ordenarPor = "fecha_objetivo")
        {
            try
            {
                Console.WriteLine($"ObtenerPorUsuario llamado con: usuarioId={usuarioId}, tipoMeta={tipoMeta}, soloActivas={soloActivas}, ordenarPor={ordenarPor}");
                var result = await _service.ObtenerMetasPorUsuarioAsync(usuarioId, tipoMeta, soloActivas, ordenarPor);
                Console.WriteLine($"Resultado del servicio: {result?.Count() ?? 0} metas encontradas");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en ObtenerPorUsuario: {ex.Message}");
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("test/{usuarioId}")]
        public async Task<IActionResult> TestEndpoint(Guid usuarioId)
        {
            try
            {
                Console.WriteLine($"TestEndpoint llamado con usuarioId: {usuarioId}");
                // Llamar directamente al SP para verificar
                var result = await _service.ObtenerMetasPorUsuarioAsync(usuarioId, null, true, "fecha_objetivo");
                return Ok(new { 
                    message = "Test exitoso", 
                    usuarioId = usuarioId,
                    metasCount = result?.Count() ?? 0,
                    metas = result
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en TestEndpoint: {ex.Message}");
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
} 