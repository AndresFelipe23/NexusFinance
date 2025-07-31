using System;
using Microsoft.AspNetCore.Http;

namespace NexusFinance.API.Models.DTOs
{
    public class SubirDocumentoViajeArchivoDTO
    {
        public Guid PlanId { get; set; }
        public string TipoDocumento { get; set; } = null!;
        public IFormFile Archivo { get; set; } = null!;
    }
} 