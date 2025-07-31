namespace NexusFinance.API.Models.DTOs
{
    public class RegistroUsuarioDTO
    {
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Moneda { get; set; } = "USD";
        public string ZonaHoraria { get; set; } = "UTC";
    }

    public class LoginUsuarioDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
} 