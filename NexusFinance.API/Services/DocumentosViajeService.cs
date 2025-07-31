using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using Firebase.Storage;
using System.IO;

namespace NexusFinance.API.Services
{
    public class DocumentosViajeService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;
        private readonly string? _firebaseBucket;
        private readonly string? _firebaseApiKey;
        private readonly string? _firebaseAuthEmail;
        private readonly string? _firebaseAuthPassword;

        public DocumentosViajeService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _firebaseBucket = _configuration["Firebase:Bucket"];
            _firebaseApiKey = _configuration["Firebase:ApiKey"];
            _firebaseAuthEmail = _configuration["Firebase:AuthEmail"];
            _firebaseAuthPassword = _configuration["Firebase:AuthPassword"];
        }

        public async Task<dynamic> CrearDocumentoViajeAsync(Guid planId, string tipoDocumento, string nombreDocumento, string? numeroDocumento, DateTime? fechaExpedicion, DateTime? fechaVencimiento, string? urlArchivo, string? notas, bool? esObligatorio, bool? estaVerificado)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "DocumentosViaje_Insert",
                new
                {
                    PlanId = planId,
                    TipoDocumento = tipoDocumento,
                    NombreDocumento = nombreDocumento,
                    NumeroDocumento = numeroDocumento,
                    FechaExpedicion = fechaExpedicion,
                    FechaVencimiento = fechaVencimiento,
                    UrlArchivo = urlArchivo,
                    Notas = notas,
                    EsObligatorio = esObligatorio ?? false,
                    EstaVerificado = estaVerificado ?? false
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<string?> SubirArchivoAsync(Stream archivoStream, string nombreArchivo, string carpetaDestino)
        {
            if (string.IsNullOrEmpty(_firebaseBucket))
                throw new Exception("Configuración de Firebase Storage incompleta");

            try
            {
                // Usar Firebase Storage sin autenticación si las reglas de seguridad lo permiten
                // O configurar correctamente la autenticación
                var task = new FirebaseStorage(_firebaseBucket)
                .Child(carpetaDestino)
                .Child(nombreArchivo)
                .PutAsync(archivoStream);

                var downloadUrl = await task;
                return downloadUrl;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al subir archivo a Firebase Storage: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<dynamic>> ObtenerDocumentosPorPlanAsync(Guid planId, string? tipoDocumento = null, bool? estadoVerificacion = null, bool soloObligatorios = false, bool soloVencidos = false, bool soloProximosVencer = false, string ordenarPor = "Tipo")
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryAsync<dynamic>(
                "DocumentosViaje_SelectByPlan",
                new
                {
                    PlanId = planId,
                    TipoDocumento = tipoDocumento,
                    EstadoVerificacion = estadoVerificacion,
                    SoloObligatorios = soloObligatorios,
                    SoloVencidos = soloVencidos,
                    SoloProximosVencer = soloProximosVencer,
                    OrdenarPor = ordenarPor
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ObtenerDocumentoPorIdAsync(Guid documentoId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                "DocumentosViaje_Select",
                new { DocumentoId = documentoId },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ActualizarDocumentoViajeAsync(Guid documentoId, string? tipoDocumento, string? nombreDocumento, string? numeroDocumento, DateTime? fechaExpedicion, DateTime? fechaVencimiento, string? urlArchivo, string? notas, bool? esObligatorio, bool? estaVerificado)
        {
            using var connection = new SqlConnection(_connectionString!);
            var result = await connection.ExecuteScalarAsync<dynamic>(
                "DocumentosViaje_Update",
                new
                {
                    DocumentoId = documentoId,
                    TipoDocumento = tipoDocumento,
                    NombreDocumento = nombreDocumento,
                    NumeroDocumento = numeroDocumento,
                    FechaExpedicion = fechaExpedicion,
                    FechaVencimiento = fechaVencimiento,
                    UrlArchivo = urlArchivo,
                    Notas = notas,
                    EsObligatorio = esObligatorio,
                    EstaVerificado = estaVerificado
                },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<bool> EliminarDocumentoViajeAsync(Guid documentoId)
        {
            using var connection = new SqlConnection(_connectionString);
            
            try
            {
                Console.WriteLine($"[DEBUG] Iniciando eliminación de documento: {documentoId}");
                
                // Primero obtener la URL del archivo antes de eliminar el registro
                Console.WriteLine($"[DEBUG] Buscando documento en BD con ID: {documentoId}");
                var documento = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "DocumentosViaje_Select",
                    new { DocumentoId = documentoId },
                    commandType: CommandType.StoredProcedure
                );

                Console.WriteLine($"[DEBUG] Documento encontrado: {documento != null}");
                if (documento != null)
                {
                    Console.WriteLine($"[DEBUG] URL del archivo: {documento.UrlArchivo}");
                    Console.WriteLine($"[DEBUG] Nombre del documento: {documento.nombreDocumento}");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Documento NO encontrado en la base de datos");
                }

                // Eliminar el registro de la base de datos
                var resultado = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    "DocumentosViaje_Delete",
                    new { DocumentoId = documentoId },
                    commandType: CommandType.StoredProcedure
                );

                var filasAfectadas = resultado?.FilasAfectadas ?? 0;
                Console.WriteLine($"[DEBUG] Filas afectadas por DELETE: {filasAfectadas}");

                // Si se eliminó al menos una fila, considerar la operación exitosa
                var fueEliminado = filasAfectadas > 0;
                Console.WriteLine($"[DEBUG] Documento eliminado: {fueEliminado}");

                // Si se eliminó el registro y hay una URL de archivo, intentar eliminar el archivo de Firebase
                if (fueEliminado && documento != null && !string.IsNullOrEmpty(documento.UrlArchivo))
                {
                    Console.WriteLine($"[DEBUG] Eliminando archivo de Firebase...");
                    await EliminarArchivoAsync(documento.UrlArchivo);
                }

                Console.WriteLine($"[DEBUG] Resultado final: {fueEliminado}");
                return fueEliminado;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Error en eliminación: {ex.Message}");
                throw;
            }
        }

        public async Task<dynamic> MarcarVerificadoAsync(Guid documentoId, bool estaVerificado)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.ExecuteScalarAsync<dynamic>(
                "DocumentosViaje_MarcarVerificado",
                new { DocumentoId = documentoId, EstaVerificado = estaVerificado },
                commandType: CommandType.StoredProcedure
            );
            return result;
        }

        public async Task<dynamic> ObtenerResumenDocumentosAsync(Guid planId)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryMultipleAsync(
                "DocumentosViaje_GetResumen",
                new { PlanId = planId },
                commandType: CommandType.StoredProcedure
            );
            var resumenGeneral = await result.ReadFirstOrDefaultAsync();
            var resumenPorTipo = await result.ReadAsync();
            var urgentes = await result.ReadAsync();
            return new { ResumenGeneral = resumenGeneral, ResumenPorTipo = resumenPorTipo, Urgentes = urgentes };
        }

        public async Task<bool> EliminarArchivoAsync(string urlArchivo)
        {
            if (string.IsNullOrEmpty(urlArchivo) || string.IsNullOrEmpty(_firebaseBucket))
                return false;

            try
            {
                // Extraer la ruta del archivo desde la URL
                var uri = new Uri(urlArchivo);
                var pathSegments = uri.AbsolutePath.Split('/');
                var storagePath = string.Join("/", pathSegments.Skip(3)); // Saltar /o/, /v0/, /b/bucket/

                var task = new FirebaseStorage(_firebaseBucket)
                .Child(storagePath)
                .DeleteAsync();

                await task;
                return true;
            }
            catch (Exception ex)
            {
                // Log del error pero no fallar la operación
                Console.WriteLine($"Error al eliminar archivo de Firebase: {ex.Message}");
                return false;
            }
        }
    }
} 