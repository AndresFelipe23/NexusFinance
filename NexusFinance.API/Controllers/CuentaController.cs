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
    public class CuentaController : ControllerBase
    {
        private readonly CuentaService _service;

        public CuentaController(CuentaService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearCuentaDTO dto)
        {
            var result = await _service.CrearCuentaAsync(dto.UsuarioId, dto.NombreCuenta, dto.TipoCuenta, dto.Saldo, dto.Moneda, dto.NombreBanco, dto.NumeroCuenta);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarCuentaDTO dto)
        {
            if (id != dto.CuentaId) return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarCuentaAsync(dto.CuentaId, dto.NombreCuenta, dto.TipoCuenta, dto.Moneda, dto.NombreBanco, dto.NumeroCuenta, dto.EstaActivo);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarCuentaAsync(id, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerCuentaPorIdAsync(id);
            return Ok(result);
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(Guid usuarioId, [FromQuery] bool soloActivas = true)
        {
            var result = await _service.ObtenerCuentasPorUsuarioAsync(usuarioId, soloActivas);
            return Ok(result);
        }
    }
} 