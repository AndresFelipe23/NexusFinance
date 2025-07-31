using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.IO;
using System.Threading.Tasks;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentosViajeController : ControllerBase
    {
        private readonly DocumentosViajeService _service;

        public DocumentosViajeController(DocumentosViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearDocumentoViajeDTO dto)
        {
            var result = await _service.CrearDocumentoViajeAsync(
                dto.PlanId, dto.TipoDocumento, dto.NombreDocumento, dto.NumeroDocumento, dto.FechaExpedicion, dto.FechaVencimiento, dto.UrlArchivo, dto.Notas, dto.EsObligatorio, dto.EstaVerificado
            );
            return Ok(result);
        }

        [HttpPost("subir-archivo")]
        public async Task<IActionResult> SubirArchivo([FromForm] SubirDocumentoViajeArchivoDTO dto)
        {
            if (dto.Archivo == null || dto.Archivo.Length == 0)
                return BadRequest("Archivo no proporcionado");

            var nombreArchivo = Guid.NewGuid() + Path.GetExtension(dto.Archivo.FileName);
            var carpetaDestino = $"documentos-viaje/{dto.PlanId}/{dto.TipoDocumento}";
            using var stream = dto.Archivo.OpenReadStream();
            var url = await _service.SubirArchivoAsync(stream, nombreArchivo, carpetaDestino);
            return Ok(new { UrlArchivo = url });
        }

        [HttpGet("plan/{planId}")]
        public async Task<IActionResult> ObtenerPorPlan(Guid planId, [FromQuery] string? tipoDocumento = null, [FromQuery] bool? estadoVerificacion = null, [FromQuery] bool soloObligatorios = false, [FromQuery] bool soloVencidos = false, [FromQuery] bool soloProximosVencer = false, [FromQuery] string ordenarPor = "Tipo")
        {
            var result = await _service.ObtenerDocumentosPorPlanAsync(planId, tipoDocumento, estadoVerificacion, soloObligatorios, soloVencidos, soloProximosVencer, ordenarPor);
            return Ok(result);
        }

        [HttpGet("{documentoId}")]
        public async Task<IActionResult> ObtenerPorId(Guid documentoId)
        {
            var result = await _service.ObtenerDocumentoPorIdAsync(documentoId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar([FromBody] ActualizarDocumentoViajeDTO dto)
        {
            var result = await _service.ActualizarDocumentoViajeAsync(
                dto.DocumentoId, dto.TipoDocumento, dto.NombreDocumento, dto.NumeroDocumento, dto.FechaExpedicion, dto.FechaVencimiento, dto.UrlArchivo, dto.Notas, dto.EsObligatorio, dto.EstaVerificado
            );
            return Ok(result);
        }

        [HttpDelete("{documentoId}")]
        public async Task<IActionResult> Eliminar(Guid documentoId)
        {
            try
            {
                Console.WriteLine($"[CONTROLLER] Iniciando eliminación de documento: {documentoId}");
                Console.WriteLine($"[CONTROLLER] DocumentoId es válido: {documentoId != Guid.Empty}");
                
                var result = await _service.EliminarDocumentoViajeAsync(documentoId);
                Console.WriteLine($"[CONTROLLER] Resultado del servicio: {result}");
                
                if (!result) 
                {
                    Console.WriteLine($"[CONTROLLER] Devolviendo NotFound para documento: {documentoId}");
                    return NotFound($"Documento con ID {documentoId} no encontrado o no se pudo eliminar");
                }
                
                Console.WriteLine($"[CONTROLLER] Devolviendo NoContent para documento: {documentoId}");
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTROLLER] Error eliminando documento {documentoId}: {ex.Message}");
                Console.WriteLine($"[CONTROLLER] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("archivo")]
        public async Task<IActionResult> EliminarArchivo([FromQuery] string urlArchivo)
        {
            if (string.IsNullOrEmpty(urlArchivo))
                return BadRequest("URL del archivo no proporcionada");

            var result = await _service.EliminarArchivoAsync(urlArchivo);
            return Ok(new { Eliminado = result });
        }

        [HttpPost("marcar-verificado/{documentoId}")]
        public async Task<IActionResult> MarcarVerificado(Guid documentoId, [FromQuery] bool estaVerificado)
        {
            var result = await _service.MarcarVerificadoAsync(documentoId, estaVerificado);
            return Ok(result);
        }

        [HttpGet("resumen/{planId}")]
        public async Task<IActionResult> ObtenerResumen(Guid planId)
        {
            var result = await _service.ObtenerResumenDocumentosAsync(planId);
            return Ok(result);
        }
    }
} 