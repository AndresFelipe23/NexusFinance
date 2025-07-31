using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Linq;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransaccioneController : ControllerBase
    {
        private readonly TransaccioneService _service;
        private readonly CategoriasPresupuestoService _categoriasPresupuestoService;

        public TransaccioneController(TransaccioneService service, CategoriasPresupuestoService categoriasPresupuestoService)
        {
            _service = service;
            _categoriasPresupuestoService = categoriasPresupuestoService;
        }

        private Guid GetCurrentUserId()
        {
            // Intentar obtener el userId del claim "sub" (subject) que es el estándar JWT
            var userIdClaim = User.FindFirst("sub")?.Value;
            
            // Si no está en "sub", intentar con NameIdentifier
            if (string.IsNullOrEmpty(userIdClaim))
            {
                userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            
            // Si aún no está, intentar con "nameid"
            if (string.IsNullOrEmpty(userIdClaim))
            {
                userIdClaim = User.FindFirst("nameid")?.Value;
            }
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                // Debug: mostrar todos los claims disponibles
                var claims = User.Claims.Select(c => $"{c.Type}: {c.Value}").ToList();
                throw new UnauthorizedAccessException($"Usuario no autenticado. Claims disponibles: {string.Join(", ", claims)}");
            }
            return userId;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearTransaccionDTO dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (dto.UsuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.CrearTransaccionAsync(
                    dto.UsuarioId, dto.CuentaId, dto.CategoriaId, dto.Monto, 
                    dto.TipoTransaccion, dto.Descripcion, dto.Notas, dto.FechaTransaccion, 
                    dto.TransaccionRecurrenteId, dto.UrlRecibo, dto.EstaConciliado
                );

                // Si la transacción es un gasto, actualizar el monto gastado en la categoría de presupuesto
                if (dto.TipoTransaccion == "gasto" && dto.CategoriaId.HasValue)
                {
                    await _categoriasPresupuestoService.ActualizarMontoGastadoAsync(null, dto.CategoriaId.Value);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarTransaccionDTO dto)
        {
            try
            {
                if (id != dto.TransaccionId)
                    return BadRequest("El id de la ruta no coincide con el del cuerpo.");

                // Obtener información de la transacción anterior para comparar cambios
                var transaccionAnterior = await _service.ObtenerTransaccionPorIdAsync(id);
                if (transaccionAnterior.TransaccionId == Guid.Empty) return NotFound();

                var result = await _service.ActualizarTransaccionAsync(
                    dto.TransaccionId, dto.CuentaId, dto.CategoriaId, dto.Monto, 
                    dto.Descripcion, dto.Notas, dto.FechaTransaccion, dto.UrlRecibo, dto.EstaConciliado
                );

                // Actualizar presupuestos si la transacción era o es un gasto
                if (transaccionAnterior.TipoTransaccion == "gasto")
                {
                    // Actualizar la categoría anterior (en caso de que haya cambiado)
                    await _categoriasPresupuestoService.ActualizarMontoGastadoAsync(null, transaccionAnterior.CategoriaId);
                    
                    // Si cambió la categoría, actualizar también la nueva
                    if (dto.CategoriaId.HasValue && dto.CategoriaId.Value != transaccionAnterior.CategoriaId)
                    {
                        await _categoriasPresupuestoService.ActualizarMontoGastadoAsync(null, dto.CategoriaId.Value);
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool validarSaldo = true)
        {
            try
            {
                // Obtener información de la transacción antes de eliminarla para actualizar presupuesto
                var transaccionAnterior = await _service.ObtenerTransaccionPorIdAsync(id);
                if (transaccionAnterior.TransaccionId == Guid.Empty) return NotFound();
                
                var result = await _service.EliminarTransaccionAsync(id, validarSaldo);
                if (!result) return NotFound();
                
                // Si la transacción eliminada era un gasto, actualizar el monto gastado en la categoría de presupuesto
                if (transaccionAnterior.TipoTransaccion == "gasto")
                {
                    await _categoriasPresupuestoService.ActualizarMontoGastadoAsync(null, transaccionAnterior.CategoriaId);
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            try
            {
                var result = await _service.ObtenerTransaccionPorIdAsync(id);
                if (result.TransaccionId == Guid.Empty) return NotFound();
                
                var currentUserId = GetCurrentUserId();
                if (result.UsuarioId != currentUserId)
                {
                    return Forbid();
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(
            Guid usuarioId,
            [FromQuery] Guid? cuentaId = null,
            [FromQuery] Guid? categoriaId = null,
            [FromQuery] string? tipoTransaccion = null,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] decimal? montoMinimo = null,
            [FromQuery] decimal? montoMaximo = null,
            [FromQuery] string? busquedaTexto = null,
            [FromQuery] bool? soloConciliadas = null,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanoPagina = 50,
            [FromQuery] string ordenarPor = "fecha_desc")
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (usuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.ObtenerTransaccionesPorUsuarioAsync(
                    usuarioId, cuentaId, categoriaId, tipoTransaccion, fechaInicio, fechaFin, 
                    montoMinimo, montoMaximo, busquedaTexto, soloConciliadas, pagina, tamanoPagina, ordenarPor
                );
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("tipos")]
        public IActionResult ObtenerTiposTransaccion()
        {
            try
            {
                var tipos = _service.ObtenerTiposTransaccion();
                return Ok(tipos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 