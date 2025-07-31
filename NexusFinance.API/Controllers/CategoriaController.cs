using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriaController : ControllerBase
    {
        private readonly CategoriaService _categoriaService;

        public CategoriaController(CategoriaService categoriaService)
        {
            _categoriaService = categoriaService;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearCategoriaDTO dto)
        {
            var result = await _categoriaService.CrearCategoriaAsync(
                dto.UsuarioId, dto.NombreCategoria, dto.TipoCategoria, dto.CategoriaIdPadre, dto.Color, dto.Icono);
            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar([FromBody] ActualizarCategoriaDTO dto)
        {
            // Log del DTO recibido
            Console.WriteLine($"[CategoriaController] DTO recibido: {System.Text.Json.JsonSerializer.Serialize(dto)}");
            
            var result = await _categoriaService.ActualizarCategoriaAsync(
                dto.CategoriaId, dto.NombreCategoria, dto.CategoriaIdPadre, dto.Color, dto.Icono, dto.EstaActivo, dto.CambiarPadre);
            
            Console.WriteLine($"[CategoriaController] Resultado: {System.Text.Json.JsonSerializer.Serialize(result)}");
            return Ok(result);
        }

        [HttpDelete("{categoriaId}")]
        public async Task<IActionResult> Eliminar(Guid categoriaId, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _categoriaService.EliminarCategoriaAsync(categoriaId, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{categoriaId}")]
        public async Task<IActionResult> ObtenerPorId(Guid categoriaId)
        {
            var result = await _categoriaService.ObtenerCategoriaPorIdAsync(categoriaId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(Guid usuarioId, [FromQuery] string? tipoCategoria = null, [FromQuery] bool soloActivas = true, [FromQuery] bool incluirJerarquia = true)
        {
            var result = await _categoriaService.ObtenerCategoriasPorUsuarioAsync(usuarioId, tipoCategoria, soloActivas, incluirJerarquia);
            return Ok(result);
        }

        [HttpGet("tipos")]
        public IActionResult ObtenerTiposCategoria()
        {
            var tipos = new[]
            {
                new { valor = "ingreso", nombre = "Ingreso", descripcion = "Dinero que entra", color = "#10B981", icono = "trending-up" },
                new { valor = "gasto", nombre = "Gasto", descripcion = "Dinero que sale", color = "#EF4444", icono = "trending-down" },
                new { valor = "transferencia", nombre = "Transferencia", descripcion = "Movimientos entre cuentas", color = "#3B82F6", icono = "repeat" },
                new { valor = "inversion", nombre = "Inversión", descripcion = "Inversiones y activos", color = "#8B5CF6", icono = "trending-up" },
                new { valor = "ahorro", nombre = "Ahorro", descripcion = "Ahorros específicos", color = "#06B6D4", icono = "piggy-bank" },
                new { valor = "credito", nombre = "Crédito", descripcion = "Préstamos recibidos", color = "#84CC16", icono = "plus-circle" },
                new { valor = "deuda", nombre = "Deuda", descripcion = "Préstamos a pagar", color = "#F59E0B", icono = "minus-circle" }
            };
            return Ok(tipos);
        }
    }
} 