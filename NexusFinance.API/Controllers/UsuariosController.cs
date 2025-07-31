using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Services;
using NexusFinance.API.Models.DTOs;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly IConfiguration _configuration;

        public UsuariosController(UsuarioService usuarioService, IConfiguration configuration)
        {
            _usuarioService = usuarioService;
            _configuration = configuration;
        }

        /// <summary>
        /// Registra un nuevo usuario
        /// </summary>
        /// <param name="dto"></param>
        /// <returns></returns>
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar([FromBody] RegistroUsuarioDTO dto)
        {
            // Validar que el email no exista
            var existente = await _usuarioService.ObtenerUsuarioPorEmailAsync(dto.Email);
            if (existente != null)
                return BadRequest("El email ya está registrado.");

            string claveHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            var result = await _usuarioService.RegistrarUsuarioAsync(
                dto.Nombre, dto.Apellido, dto.Email, claveHash, dto.Moneda, dto.ZonaHoraria);
            return Ok(result);
        }

        /// <summary>
        /// Inicia sesión
        /// </summary>
        /// <param name="dto"></param>
        /// <returns></returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUsuarioDTO dto)
        {
            var usuario = await _usuarioService.ObtenerUsuarioPorEmailAsync(dto.Email);
            if (usuario == null || !usuario.EstaActivo)
                return Unauthorized("Usuario o contraseña incorrectos.");

            bool passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, (string)usuario.ClaveHash);
            if (!passwordOk)
                return Unauthorized("Usuario o contraseña incorrectos.");

            // Generar JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.UsuarioId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                new Claim("nombre", usuario.Nombre ?? ""),
                new Claim("apellido", usuario.Apellido ?? "")
            };
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return Ok(new
            {
                token = jwt,
                usuario = new
                {
                    usuario.UsuarioId,
                    usuario.Nombre,
                    usuario.Apellido,
                    usuario.Email,
                    usuario.Moneda,
                    usuario.ZonaHoraria
                }
            });
        }


    }
} 