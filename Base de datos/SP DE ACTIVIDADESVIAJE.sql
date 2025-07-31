-- =============================================
-- Procedimientos Almacenados para Tabla ACTIVIDADESVIAJE - ACTUALIZADO
-- NexusFinance
-- Se han modificado las columnas de fecha y hora a DATETIME2.
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: ActividadesViaje_Insert
-- Descripcin: Inserta una nueva actividad de viaje usando DATETIME2
-- =============================================
CREATE OR ALTER PROCEDURE ActividadesViaje_Insert
    @PlanId UNIQUEIDENTIFIER,
    @NombreActividad NVARCHAR(200),
    @Descripcion NVARCHAR(1000) = NULL,
    @FechaHoraInicio DATETIME2 = NULL,
    @FechaHoraFin DATETIME2 = NULL,
    @CostoEstimado DECIMAL(18,2) = 0.00,
    @Ubicacion NVARCHAR(300) = NULL,
    @CategoriaViajeId UNIQUEIDENTIFIER = NULL,
    @Prioridad NVARCHAR(20) = 'media',
    @UrlReferencia NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ActividadId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        IF @FechaHoraInicio IS NOT NULL AND @FechaHoraFin IS NOT NULL AND @FechaHoraFin <= @FechaHoraInicio
        BEGIN
            RAISERROR('La fecha y hora de fin debe ser posterior a la de inicio.', 16, 1);
            RETURN;
        END

        IF @FechaHoraInicio IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM PlanesVacaciones 
                WHERE PlanId = @PlanId 
                  AND CAST(@FechaHoraInicio AS DATE) BETWEEN FechaInicio AND FechaFin
            )
            BEGIN
                RAISERROR('La fecha de la actividad debe estar dentro del rango de fechas del viaje.', 16, 1);
                RETURN;
            END
        END
        
        -- Insertar actividad
        PRINT 'Fechas recibidas en SP:';
        PRINT 'FechaHoraInicio: ' + ISNULL(CONVERT(NVARCHAR, @FechaHoraInicio, 120), 'NULL');
        PRINT 'FechaHoraFin: ' + ISNULL(CONVERT(NVARCHAR, @FechaHoraFin, 120), 'NULL');
        
        INSERT INTO ActividadesViaje (
            ActividadId, PlanId, NombreActividad, Descripcion, FechaHoraInicio,
            FechaHoraFin, CostoEstimado, CostoReal, Ubicacion,
            CategoriaViajeId, Prioridad, EstadoActividad, UrlReferencia,
            FechaCreacion, FechaActualizacion
        )
        VALUES (
            @ActividadId, @PlanId, @NombreActividad, @Descripcion, @FechaHoraInicio,
            @FechaHoraFin, @CostoEstimado, 0.00, @Ubicacion,
            @CategoriaViajeId, @Prioridad, 'planificada', @UrlReferencia,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar la actividad creada
        SELECT * FROM ActividadesViaje WHERE ActividadId = @ActividadId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ActividadesViaje_Update
-- Descripcin: Actualiza una actividad de viaje existente usando DATETIME2
-- =============================================
CREATE OR ALTER PROCEDURE ActividadesViaje_Update
    @ActividadId UNIQUEIDENTIFIER,
    @NombreActividad NVARCHAR(200) = NULL,
    @Descripcion NVARCHAR(1000) = NULL,
    @FechaHoraInicio DATETIME2 = NULL,
    @FechaHoraFin DATETIME2 = NULL,
    @CostoEstimado DECIMAL(18,2) = NULL,
    @CostoReal DECIMAL(18,2) = NULL,
    @Ubicacion NVARCHAR(300) = NULL,
    @CategoriaViajeId UNIQUEIDENTIFIER = NULL,
    @Prioridad NVARCHAR(20) = NULL,
    @EstadoActividad NVARCHAR(20) = NULL,
    @UrlReferencia NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que la actividad existe
        IF NOT EXISTS (SELECT 1 FROM ActividadesViaje WHERE ActividadId = @ActividadId)
        BEGIN
            RAISERROR('La actividad de viaje no existe.', 16, 1);
            RETURN;
        END

        -- Actualizar actividad
        UPDATE ActividadesViaje 
        SET 
            NombreActividad = ISNULL(@NombreActividad, NombreActividad),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            FechaHoraInicio = ISNULL(@FechaHoraInicio, FechaHoraInicio),
            FechaHoraFin = ISNULL(@FechaHoraFin, FechaHoraFin),
            CostoEstimado = ISNULL(@CostoEstimado, CostoEstimado),
            CostoReal = ISNULL(@CostoReal, CostoReal),
            Ubicacion = ISNULL(@Ubicacion, Ubicacion),
            CategoriaViajeId = ISNULL(@CategoriaViajeId, CategoriaViajeId),
            Prioridad = ISNULL(@Prioridad, Prioridad),
            EstadoActividad = ISNULL(@EstadoActividad, EstadoActividad),
            UrlReferencia = ISNULL(@UrlReferencia, UrlReferencia),
            FechaActualizacion = GETUTCDATE()
        WHERE ActividadId = @ActividadId;
        
        -- Retornar la actividad actualizada
        SELECT * FROM ActividadesViaje WHERE ActividadId = @ActividadId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ActividadesViaje_Delete
-- Descripcin: Elimina (lgica o fsicamente) una actividad de viaje
-- =============================================
CREATE OR ALTER PROCEDURE ActividadesViaje_Delete
    @ActividadId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ActividadesViaje WHERE ActividadId = @ActividadId)
        BEGIN
            RAISERROR('La actividad de viaje no existe.', 16, 1);
            RETURN;
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            DELETE FROM ActividadesViaje WHERE ActividadId = @ActividadId;
            SELECT 'Actividad eliminada fsicamente' AS Resultado;
        END
        ELSE
        BEGIN
            UPDATE ActividadesViaje 
            SET EstadoActividad = 'cancelada', FechaActualizacion = GETUTCDATE()
            WHERE ActividadId = @ActividadId;
            SELECT 'Actividad cancelada' AS Resultado;
        END
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ActividadesViaje_Select
-- Descripcin: Obtiene una actividad de viaje por ID
-- =============================================
CREATE OR ALTER PROCEDURE ActividadesViaje_Select
    @ActividadId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        av.*,
        cgv.NombreCategoria,
        DATEDIFF(MINUTE, av.FechaHoraInicio, av.FechaHoraFin) AS DuracionMinutos
    FROM ActividadesViaje av
    LEFT JOIN CategoriasGastosViaje cgv ON av.CategoriaViajeId = cgv.CategoriaViajeId
    WHERE av.ActividadId = @ActividadId;
END;
GO

-- =============================================
-- SP: ActividadesViaje_SelectByPlan
-- Descripcin: Obtiene todas las actividades de un plan de viaje
-- =============================================
CREATE OR ALTER PROCEDURE ActividadesViaje_SelectByPlan
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        av.*,
        cgv.NombreCategoria
    FROM ActividadesViaje av
    LEFT JOIN CategoriasGastosViaje cgv ON av.CategoriaViajeId = cgv.CategoriaViajeId
    WHERE av.PlanId = @PlanId
    ORDER BY av.FechaHoraInicio;
END;
GO

PRINT 'Procedimientos almacenados para ACTIVIDADESVIAJE actualizados exitosamente.';
