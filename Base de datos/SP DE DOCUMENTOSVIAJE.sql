-- =============================================
-- Procedimientos Almacenados para Tabla DOCUMENTOSVIAJE - ACTUALIZADO
-- NexusFinance
-- Se han modificado las columnas de fecha a DATETIME2.
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: DocumentosViaje_Insert
-- Descripcin: Inserta un nuevo documento de viaje
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_Insert
    @PlanId UNIQUEIDENTIFIER,
    @TipoDocumento NVARCHAR(50),
    @NombreDocumento NVARCHAR(200),
    @NumeroDocumento NVARCHAR(100) = NULL,
    @FechaExpedicion DATETIME2 = NULL,
    @FechaVencimiento DATETIME2 = NULL,
    @UrlArchivo NVARCHAR(500) = NULL,
    @Notas NVARCHAR(500) = NULL,
    @EsObligatorio BIT = 0,
    @EstaVerificado BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DocumentoId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        IF @FechaExpedicion IS NOT NULL AND @FechaVencimiento IS NOT NULL AND @FechaVencimiento <= @FechaExpedicion
        BEGIN
            RAISERROR('La fecha de vencimiento debe ser posterior a la fecha de expedicin.', 16, 1);
            RETURN;
        END
        
        -- Insertar documento
        INSERT INTO DocumentosViaje (
            DocumentoId, PlanId, TipoDocumento, NombreDocumento, NumeroDocumento,
            FechaExpedicion, FechaVencimiento, UrlArchivo, Notas, EsObligatorio,
            EstaVerificado, FechaCreacion, FechaActualizacion
        )
        VALUES (
            @DocumentoId, @PlanId, @TipoDocumento, @NombreDocumento, @NumeroDocumento,
            @FechaExpedicion, @FechaVencimiento, @UrlArchivo, @Notas, @EsObligatorio,
            @EstaVerificado, GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar el documento creado
        SELECT 
            DocumentoId as documentoId,
            PlanId as planId,
            TipoDocumento as tipoDocumento,
            NombreDocumento as nombreDocumento,
            NumeroDocumento as numeroDocumento,
            FechaExpedicion as fechaExpedicion,
            FechaVencimiento as fechaVencimiento,
            UrlArchivo as urlArchivo,
            Notas as notas,
            ISNULL(EsObligatorio, 0) as esObligatorio,
            ISNULL(EstaVerificado, 0) as estaVerificado,
            FechaCreacion as fechaCreacion,
            FechaActualizacion as fechaActualizacion
        FROM DocumentosViaje WHERE DocumentoId = @DocumentoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: DocumentosViaje_Update
-- Descripcin: Actualiza un documento de viaje existente
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_Update
    @DocumentoId UNIQUEIDENTIFIER,
    @TipoDocumento NVARCHAR(50) = NULL,
    @NombreDocumento NVARCHAR(200) = NULL,
    @NumeroDocumento NVARCHAR(100) = NULL,
    @FechaExpedicion DATETIME2 = NULL,
    @FechaVencimiento DATETIME2 = NULL,
    @UrlArchivo NVARCHAR(500) = NULL,
    @Notas NVARCHAR(500) = NULL,
    @EsObligatorio BIT = NULL,
    @EstaVerificado BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DocumentosViaje WHERE DocumentoId = @DocumentoId)
        BEGIN
            RAISERROR('El documento de viaje no existe.', 16, 1);
            RETURN;
        END
        
        UPDATE DocumentosViaje 
        SET 
            TipoDocumento = ISNULL(@TipoDocumento, TipoDocumento),
            NombreDocumento = ISNULL(@NombreDocumento, NombreDocumento),
            NumeroDocumento = ISNULL(@NumeroDocumento, NumeroDocumento),
            FechaExpedicion = ISNULL(@FechaExpedicion, FechaExpedicion),
            FechaVencimiento = ISNULL(@FechaVencimiento, FechaVencimiento),
            UrlArchivo = ISNULL(@UrlArchivo, UrlArchivo),
            Notas = ISNULL(@Notas, Notas),
            EsObligatorio = ISNULL(@EsObligatorio, EsObligatorio),
            EstaVerificado = ISNULL(@EstaVerificado, EstaVerificado),
            FechaActualizacion = GETUTCDATE()
        WHERE DocumentoId = @DocumentoId;
        
        SELECT 
            DocumentoId as documentoId,
            PlanId as planId,
            TipoDocumento as tipoDocumento,
            NombreDocumento as nombreDocumento,
            NumeroDocumento as numeroDocumento,
            FechaExpedicion as fechaExpedicion,
            FechaVencimiento as fechaVencimiento,
            UrlArchivo as urlArchivo,
            Notas as notas,
            ISNULL(EsObligatorio, 0) as esObligatorio,
            ISNULL(EstaVerificado, 0) as estaVerificado,
            FechaCreacion as fechaCreacion,
            FechaActualizacion as fechaActualizacion
        FROM DocumentosViaje WHERE DocumentoId = @DocumentoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: DocumentosViaje_Delete
-- Descripcin: Elimina un documento de viaje
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_Delete
    @DocumentoId UNIQUEIDENTIFIER
AS
BEGIN
    DECLARE @FilasAfectadas INT;
    
    DELETE FROM DocumentosViaje WHERE DocumentoId = @DocumentoId;
    SET @FilasAfectadas = @@ROWCOUNT;
    
    SELECT @FilasAfectadas AS FilasAfectadas;
END;
GO

-- =============================================
-- SP: DocumentosViaje_Select
-- Descripcin: Obtiene un documento de viaje por ID
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_Select
    @DocumentoId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        DocumentoId as documentoId,
        PlanId as planId,
        TipoDocumento as tipoDocumento,
        NombreDocumento as nombreDocumento,
        NumeroDocumento as numeroDocumento,
        FechaExpedicion as fechaExpedicion,
        FechaVencimiento as fechaVencimiento,
        UrlArchivo as urlArchivo,
        Notas as notas,
        ISNULL(EsObligatorio, 0) as esObligatorio,
        ISNULL(EstaVerificado, 0) as estaVerificado,
        FechaCreacion as fechaCreacion,
        FechaActualizacion as fechaActualizacion
    FROM DocumentosViaje WHERE DocumentoId = @DocumentoId;
END;
GO

-- =============================================
-- SP: DocumentosViaje_SelectByPlan
-- Descripcin: Obtiene todos los documentos de un plan de viaje con filtros
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_SelectByPlan
    @PlanId UNIQUEIDENTIFIER,
    @TipoDocumento NVARCHAR(50) = NULL,
    @EstadoVerificacion BIT = NULL,
    @SoloObligatorios BIT = 0,
    @SoloVencidos BIT = 0,
    @SoloProximosVencer BIT = 0,
    @OrdenarPor NVARCHAR(50) = 'Tipo'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FechaActual DATETIME2 = GETUTCDATE();
    DECLARE @FechaProximoVencer DATETIME2 = DATEADD(DAY, 30, @FechaActual);
    
    SELECT 
        DocumentoId as documentoId,
        PlanId as planId,
        TipoDocumento as tipoDocumento,
        NombreDocumento as nombreDocumento,
        NumeroDocumento as numeroDocumento,
        FechaExpedicion as fechaExpedicion,
        FechaVencimiento as fechaVencimiento,
        UrlArchivo as urlArchivo,
        Notas as notas,
        ISNULL(EsObligatorio, 0) as esObligatorio,
        ISNULL(EstaVerificado, 0) as estaVerificado,
        FechaCreacion as fechaCreacion,
        FechaActualizacion as fechaActualizacion,
        CASE 
            WHEN FechaVencimiento IS NOT NULL AND FechaVencimiento < @FechaActual THEN 1
            ELSE 0
        END AS estaVencido,
        CASE 
            WHEN FechaVencimiento IS NOT NULL AND FechaVencimiento BETWEEN @FechaActual AND @FechaProximoVencer THEN 1
            ELSE 0
        END AS proximoAVencer
    FROM DocumentosViaje 
    WHERE PlanId = @PlanId
        AND (@TipoDocumento IS NULL OR TipoDocumento = @TipoDocumento)
        AND (@EstadoVerificacion IS NULL OR EstaVerificado = @EstadoVerificacion)
        AND (@SoloObligatorios = 0 OR EsObligatorio = 1)
        AND (@SoloVencidos = 0 OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < @FechaActual))
        AND (@SoloProximosVencer = 0 OR (FechaVencimiento IS NOT NULL AND FechaVencimiento BETWEEN @FechaActual AND @FechaProximoVencer))
    ORDER BY 
        CASE 
            WHEN @OrdenarPor = 'Tipo' THEN TipoDocumento
            WHEN @OrdenarPor = 'Nombre' THEN NombreDocumento
            WHEN @OrdenarPor = 'FechaVencimiento' THEN CAST(FechaVencimiento AS NVARCHAR(50))
            WHEN @OrdenarPor = 'FechaCreacion' THEN CAST(FechaCreacion AS NVARCHAR(50))
            ELSE TipoDocumento
        END,
        NombreDocumento;
END;
GO

-- =============================================
-- SP: DocumentosViaje_MarcarVerificado
-- Descripcin: Marca un documento como verificado o no verificado
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_MarcarVerificado
    @DocumentoId UNIQUEIDENTIFIER,
    @EstaVerificado BIT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DocumentosViaje WHERE DocumentoId = @DocumentoId)
        BEGIN
            RAISERROR('El documento de viaje no existe.', 16, 1);
            RETURN;
        END
        
        UPDATE DocumentosViaje 
        SET 
            EstaVerificado = @EstaVerificado,
            FechaActualizacion = GETUTCDATE()
        WHERE DocumentoId = @DocumentoId;
        
        SELECT 
            DocumentoId as documentoId,
            PlanId as planId,
            TipoDocumento as tipoDocumento,
            NombreDocumento as nombreDocumento,
            NumeroDocumento as numeroDocumento,
            FechaExpedicion as fechaExpedicion,
            FechaVencimiento as fechaVencimiento,
            UrlArchivo as urlArchivo,
            Notas as notas,
            ISNULL(EsObligatorio, 0) as esObligatorio,
            ISNULL(EstaVerificado, 0) as estaVerificado,
            FechaCreacion as fechaCreacion,
            FechaActualizacion as fechaActualizacion
        FROM DocumentosViaje WHERE DocumentoId = @DocumentoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: DocumentosViaje_GetResumen
-- Descripcin: Obtiene resumen de documentos de un plan de viaje
-- =============================================
CREATE OR ALTER PROCEDURE DocumentosViaje_GetResumen
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FechaActual DATETIME2 = GETUTCDATE();
    DECLARE @FechaProximoVencer DATETIME2 = DATEADD(DAY, 30, @FechaActual);
    
    -- Resumen general
    SELECT 
        COUNT(*) as TotalDocumentos,
        SUM(CASE WHEN EsObligatorio = 1 THEN 1 ELSE 0 END) as DocumentosObligatorios,
        SUM(CASE WHEN EstaVerificado = 1 THEN 1 ELSE 0 END) as DocumentosVerificados,
        SUM(CASE WHEN FechaVencimiento IS NOT NULL AND FechaVencimiento < @FechaActual THEN 1 ELSE 0 END) as DocumentosVencidos,
        SUM(CASE WHEN FechaVencimiento IS NOT NULL AND FechaVencimiento BETWEEN @FechaActual AND @FechaProximoVencer THEN 1 ELSE 0 END) as DocumentosProximosVencer
    FROM DocumentosViaje 
    WHERE PlanId = @PlanId;
    
    -- Resumen por tipo
    SELECT 
        TipoDocumento,
        COUNT(*) as Total,
        SUM(CASE WHEN EstaVerificado = 1 THEN 1 ELSE 0 END) as Verificados,
        SUM(CASE WHEN EsObligatorio = 1 THEN 1 ELSE 0 END) as Obligatorios
    FROM DocumentosViaje 
    WHERE PlanId = @PlanId
    GROUP BY TipoDocumento
    ORDER BY TipoDocumento;
    
    -- Documentos urgentes (vencidos o próximos a vencer)
    SELECT 
        DocumentoId,
        TipoDocumento,
        NombreDocumento,
        FechaVencimiento,
        EstaVerificado,
        EsObligatorio,
        CASE 
            WHEN FechaVencimiento < @FechaActual THEN 'Vencido'
            WHEN FechaVencimiento BETWEEN @FechaActual AND @FechaProximoVencer THEN 'Próximo a vencer'
            ELSE 'Normal'
        END as Estado
    FROM DocumentosViaje 
    WHERE PlanId = @PlanId
        AND FechaVencimiento IS NOT NULL
        AND (FechaVencimiento < @FechaProximoVencer)
    ORDER BY FechaVencimiento ASC;
END;
GO


PRINT 'Procedimientos almacenados para DOCUMENTOSVIAJE actualizados exitosamente.';
