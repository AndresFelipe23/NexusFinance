-- =============================================
-- Procedimientos Almacenados para Tabla CHECKLISTVIAJE - ACTUALIZADO
-- NexusFinance
-- Se ha modificado la columna FechaLimite a DATETIME2.
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: ChecklistViaje_Insert
-- Descripcin: Inserta un nuevo item del checklist de viaje
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_Insert
    @PlanId UNIQUEIDENTIFIER,
    @Item NVARCHAR(300),
    @Descripcion NVARCHAR(500) = NULL,
    @CategoriaChecklist NVARCHAR(50) = 'general',
    @FechaLimite DATETIME2 = NULL,
    @Prioridad NVARCHAR(20) = 'media',
    @OrdenVisualizacion INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ChecklistId UNIQUEIDENTIFIER = NEWID(); -- ¡DECLARACIÓN DE LA VARIABLE CORREGIDA!
    
    BEGIN TRY
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END

        -- Insertar item
        INSERT INTO ChecklistViaje (
            ChecklistId, PlanId, Item, Descripcion, CategoriaChecklist,
            EstaCompletado, FechaLimite, Prioridad, OrdenVisualizacion,
            FechaCreacion, FechaCompletado
        )
        VALUES (
            @ChecklistId, @PlanId, @Item, @Descripcion, @CategoriaChecklist,
            0, @FechaLimite, @Prioridad, @OrdenVisualizacion,
            GETUTCDATE(), NULL
        );
        
        -- Retornar el item creado
        SELECT * FROM ChecklistViaje WHERE ChecklistId = @ChecklistId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_Update
-- Descripcin: Actualiza un item del checklist de viaje
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_Update
    @ChecklistId UNIQUEIDENTIFIER,
    @Item NVARCHAR(300) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @CategoriaChecklist NVARCHAR(50) = NULL,
    @EstaCompletado BIT = NULL,
    @FechaLimite DATETIME2 = NULL,
    @Prioridad NVARCHAR(20) = NULL,
    @OrdenVisualizacion INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ChecklistViaje WHERE ChecklistId = @ChecklistId)
        BEGIN
            RAISERROR('El item del checklist no existe.', 16, 1);
            RETURN;
        END

        -- Actualizar el registro
        UPDATE ChecklistViaje 
        SET 
            Item = ISNULL(@Item, Item),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            CategoriaChecklist = ISNULL(@CategoriaChecklist, CategoriaChecklist),
            EstaCompletado = ISNULL(@EstaCompletado, EstaCompletado),
            FechaLimite = ISNULL(@FechaLimite, FechaLimite),
            Prioridad = ISNULL(@Prioridad, Prioridad),
            OrdenVisualizacion = ISNULL(@OrdenVisualizacion, OrdenVisualizacion),
            -- Actualizar FechaCompletado automáticamente
            FechaCompletado = CASE 
                WHEN @EstaCompletado = 1 AND FechaCompletado IS NULL THEN GETUTCDATE()
                WHEN @EstaCompletado = 0 THEN NULL
                ELSE FechaCompletado
            END
        WHERE ChecklistId = @ChecklistId;
        
        SELECT * FROM ChecklistViaje WHERE ChecklistId = @ChecklistId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_Delete
-- Descripcin: Elimina un item del checklist de viaje
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_Delete
    @ChecklistId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ChecklistViaje WHERE ChecklistId = @ChecklistId)
        BEGIN
            RAISERROR('El item del checklist no existe.', 16, 1);
            RETURN;
        END
        
        DELETE FROM ChecklistViaje WHERE ChecklistId = @ChecklistId;
        
        SELECT 'Item del checklist eliminado exitosamente' AS Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_Select
-- Descripcin: Obtiene un item del checklist por ID
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_Select
    @ChecklistId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM ChecklistViaje WHERE ChecklistId = @ChecklistId;
END;
GO

-- =============================================
-- SP: ChecklistViaje_SelectByPlan
-- Descripcin: Obtiene todos los items del checklist de un plan con filtros opcionales
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_SelectByPlan
    @PlanId UNIQUEIDENTIFIER,
    @CategoriaChecklist NVARCHAR(50) = NULL,
    @EstadoCompletado BIT = NULL,
    @SoloVencidos BIT = 0,
    @SoloProximosVencer BIT = 0,
    @OrdenarPor NVARCHAR(50) = 'Categoria'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END

        -- Declarar variables para filtros de fecha
        DECLARE @FechaHoy DATETIME2 = GETUTCDATE();
        DECLARE @FechaEn7Dias DATETIME2 = DATEADD(DAY, 7, @FechaHoy);
        
        SELECT 
            ChecklistId,
            PlanId,
            Item,
            Descripcion,
            CategoriaChecklist,
            EstaCompletado,
            FechaLimite,
            Prioridad,
            OrdenVisualizacion,
            FechaCreacion,
            FechaCompletado
        FROM ChecklistViaje 
        WHERE PlanId = @PlanId
            -- Filtro por categoría (opcional)
            AND (@CategoriaChecklist IS NULL OR CategoriaChecklist = @CategoriaChecklist)
            -- Filtro por estado completado (opcional)
            AND (@EstadoCompletado IS NULL OR EstaCompletado = @EstadoCompletado)
            -- Filtro solo vencidos
            AND (@SoloVencidos = 0 OR (
                FechaLimite IS NOT NULL 
                AND FechaLimite < @FechaHoy 
                AND EstaCompletado = 0
            ))
            -- Filtro solo próximos a vencer (en los próximos 7 días)
            AND (@SoloProximosVencer = 0 OR (
                FechaLimite IS NOT NULL 
                AND FechaLimite >= @FechaHoy 
                AND FechaLimite <= @FechaEn7Dias 
                AND EstaCompletado = 0
            ))
        ORDER BY 
            CASE 
                WHEN @OrdenarPor = 'Categoria' THEN CategoriaChecklist
                WHEN @OrdenarPor = 'Prioridad' THEN 
                    CASE Prioridad 
                        WHEN 'alta' THEN '1'
                        WHEN 'media' THEN '2'
                        WHEN 'baja' THEN '3'
                        ELSE '9'
                    END
                WHEN @OrdenarPor = 'FechaLimite' THEN CONVERT(NVARCHAR(50), FechaLimite, 121)
                ELSE CategoriaChecklist
            END,
            OrdenVisualizacion ASC,
            Item ASC;
            
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_MarcarCompletado
-- Descripcin: Marca un item del checklist como completado o no completado
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_MarcarCompletado
    @ChecklistId UNIQUEIDENTIFIER,
    @EstaCompletado BIT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM ChecklistViaje WHERE ChecklistId = @ChecklistId)
        BEGIN
            RAISERROR('El item del checklist no existe.', 16, 1);
            RETURN;
        END

        UPDATE ChecklistViaje 
        SET 
            EstaCompletado = @EstaCompletado,
            FechaCompletado = CASE 
                WHEN @EstaCompletado = 1 AND FechaCompletado IS NULL THEN GETUTCDATE()
                WHEN @EstaCompletado = 0 THEN NULL
                ELSE FechaCompletado
            END
        WHERE ChecklistId = @ChecklistId;
        
        SELECT * FROM ChecklistViaje WHERE ChecklistId = @ChecklistId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_GetResumen
-- Descripcin: Obtiene un resumen completo del checklist de un plan
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_GetResumen
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @FechaHoy DATETIME2 = GETUTCDATE();
    DECLARE @FechaEn7Dias DATETIME2 = DATEADD(DAY, 7, @FechaHoy);
    
    BEGIN TRY
        -- Validar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END

        -- Resumen General
        SELECT 
            COUNT(*) AS TotalItems,
            SUM(CASE WHEN EstaCompletado = 1 THEN 1 ELSE 0 END) AS Completados,
            SUM(CASE WHEN EstaCompletado = 0 THEN 1 ELSE 0 END) AS Pendientes,
            SUM(CASE WHEN EstaCompletado = 0 AND FechaLimite IS NOT NULL AND FechaLimite < @FechaHoy THEN 1 ELSE 0 END) AS Vencidos,
            SUM(CASE WHEN EstaCompletado = 0 AND FechaLimite IS NOT NULL AND FechaLimite >= @FechaHoy AND FechaLimite <= @FechaEn7Dias THEN 1 ELSE 0 END) AS PorVencer
        FROM ChecklistViaje 
        WHERE PlanId = @PlanId;

        -- Resumen por Categorías
        SELECT 
            CategoriaChecklist,
            COUNT(*) AS TotalItems,
            SUM(CASE WHEN EstaCompletado = 1 THEN 1 ELSE 0 END) AS Completados,
            SUM(CASE WHEN EstaCompletado = 0 THEN 1 ELSE 0 END) AS Pendientes,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((SUM(CASE WHEN EstaCompletado = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2)
                ELSE 0 
            END AS PorcentajeCompletado
        FROM ChecklistViaje 
        WHERE PlanId = @PlanId
        GROUP BY CategoriaChecklist
        ORDER BY CategoriaChecklist;

        -- Items Urgentes (vencidos o próximos a vencer)
        SELECT 
            ChecklistId,
            Item,
            Descripcion,
            CategoriaChecklist,
            Prioridad,
            FechaLimite,
            CASE 
                WHEN FechaLimite < @FechaHoy THEN 'Vencido'
                WHEN FechaLimite <= @FechaEn7Dias THEN 'Por Vencer'
                ELSE 'Normal'
            END AS EstadoFecha,
            DATEDIFF(DAY, @FechaHoy, FechaLimite) AS DiasRestantes
        FROM ChecklistViaje 
        WHERE PlanId = @PlanId 
            AND EstaCompletado = 0 
            AND FechaLimite IS NOT NULL
            AND (FechaLimite < @FechaHoy OR FechaLimite <= @FechaEn7Dias)
        ORDER BY FechaLimite ASC;
            
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_CrearChecklistBasico
-- Descripcin: Crea un checklist básico predefinido para un plan
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_CrearChecklistBasico
    @PlanId UNIQUEIDENTIFIER,
    @EsViajeInternacional BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ChecklistId UNIQUEIDENTIFIER;
    DECLARE @Item NVARCHAR(300);
    DECLARE @Descripcion NVARCHAR(500);
    DECLARE @CategoriaChecklist NVARCHAR(50);
    DECLARE @Prioridad NVARCHAR(20);
    DECLARE @OrdenVisualizacion INT = 0;
    
    BEGIN TRY
        -- Validar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END

        -- Verificar si ya existe un checklist para este plan
        IF EXISTS (SELECT 1 FROM ChecklistViaje WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('Ya existe un checklist para este plan de vacaciones.', 16, 1);
            RETURN;
        END

        -- Items básicos para viaje nacional
        DECLARE @ItemsBasicos TABLE (
            Item NVARCHAR(300),
            Descripcion NVARCHAR(500),
            CategoriaChecklist NVARCHAR(50),
            Prioridad NVARCHAR(20),
            OrdenVisualizacion INT
        );

        -- Insertar items básicos
        INSERT INTO @ItemsBasicos VALUES
        -- Documentos
        ('Cédula de ciudadanía', 'Documento de identidad vigente', 'documentos', 'alta', 1),
        ('Reservas de hotel', 'Confirmación de reservas de alojamiento', 'documentos', 'alta', 2),
        ('Boletos de transporte', 'Boletos de avión, bus o tren', 'documentos', 'alta', 3),
        ('Seguro de viaje', 'Póliza de seguro de viaje', 'documentos', 'media', 4),
        
        -- Equipaje
        ('Ropa para el clima del destino', 'Ropa apropiada para el clima', 'equipaje', 'alta', 10),
        ('Zapatos cómodos', 'Calzado cómodo para caminar', 'equipaje', 'media', 11),
        ('Artículos de aseo personal', 'Productos de higiene personal', 'equipaje', 'alta', 12),
        ('Cargadores de dispositivos', 'Cargadores y cables', 'equipaje', 'media', 13),
        
        -- Salud
        ('Medicamentos personales', 'Medicamentos que toma regularmente', 'salud', 'alta', 20),
        ('Botiquín básico', 'Botiquín de primeros auxilios', 'salud', 'media', 21),
        
        -- Finanzas
        ('Dinero en efectivo local', 'Efectivo en la moneda del destino', 'finanzas', 'alta', 30),
        ('Tarjetas bancarias', 'Tarjetas de crédito y débito', 'finanzas', 'alta', 31),
        ('Informar al banco sobre el viaje', 'Notificar al banco sobre el viaje', 'finanzas', 'media', 32),
        
        -- General
        ('Revisar el clima del destino', 'Consultar pronóstico del tiempo', 'general', 'media', 40),
        ('Confirmar todas las reservas', 'Verificar todas las reservas', 'general', 'alta', 41);

        -- Si es viaje internacional, agregar items adicionales
        IF @EsViajeInternacional = 1
        BEGIN
            INSERT INTO @ItemsBasicos VALUES
            ('Pasaporte vigente', 'Pasaporte con vigencia mínima de 6 meses', 'documentos', 'alta', 0),
            ('Visa (si es requerida)', 'Visa del país de destino', 'documentos', 'alta', 1),
            ('Vacunas requeridas', 'Vacunas obligatorias del destino', 'salud', 'alta', 19),
            ('Cambio de moneda', 'Cambiar moneda local', 'finanzas', 'media', 29),
            ('Adaptadores de corriente', 'Adaptadores para enchufes del destino', 'equipaje', 'media', 14);
        END

        -- Insertar todos los items en el checklist
        DECLARE item_cursor CURSOR FOR 
        SELECT Item, Descripcion, CategoriaChecklist, Prioridad, OrdenVisualizacion 
        FROM @ItemsBasicos 
        ORDER BY OrdenVisualizacion;

        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @Item, @Descripcion, @CategoriaChecklist, @Prioridad, @OrdenVisualizacion;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @ChecklistId = NEWID();
            
            INSERT INTO ChecklistViaje (
                ChecklistId, PlanId, Item, Descripcion, CategoriaChecklist,
                EstaCompletado, FechaLimite, Prioridad, OrdenVisualizacion,
                FechaCreacion, FechaCompletado
            )
            VALUES (
                @ChecklistId, @PlanId, @Item, @Descripcion, @CategoriaChecklist,
                0, NULL, @Prioridad, @OrdenVisualizacion,
                GETUTCDATE(), NULL
            );

            FETCH NEXT FROM item_cursor INTO @Item, @Descripcion, @CategoriaChecklist, @Prioridad, @OrdenVisualizacion;
        END

        CLOSE item_cursor;
        DEALLOCATE item_cursor;

        SELECT 'Checklist básico creado exitosamente' AS Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: ChecklistViaje_ReordenarItems
-- Descripcin: Reordena los items de una categoría específica
-- =============================================
CREATE OR ALTER PROCEDURE ChecklistViaje_ReordenarItems
    @PlanId UNIQUEIDENTIFIER,
    @CategoriaChecklist NVARCHAR(50),
    @ListaItems NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END

        -- Crear tabla temporal para el nuevo orden
        DECLARE @NuevoOrden TABLE (
            ChecklistId UNIQUEIDENTIFIER,
            NuevoOrden INT
        );

        -- Parsear la lista de items (formato: "id1,id2,id3,...")
        DECLARE @Pos INT = 1;
        DECLARE @ItemId NVARCHAR(50);
        DECLARE @ListaTemp NVARCHAR(MAX) = @ListaItems;

        WHILE LEN(@ListaTemp) > 0
        BEGIN
            SET @Pos = CHARINDEX(',', @ListaTemp);
            IF @Pos = 0
            BEGIN
                SET @ItemId = @ListaTemp;
                SET @ListaTemp = '';
            END
            ELSE
            BEGIN
                SET @ItemId = LEFT(@ListaTemp, @Pos - 1);
                SET @ListaTemp = SUBSTRING(@ListaTemp, @Pos + 1, LEN(@ListaTemp));
            END

            IF @ItemId != ''
            BEGIN
                INSERT INTO @NuevoOrden (ChecklistId, NuevoOrden)
                VALUES (CAST(@ItemId AS UNIQUEIDENTIFIER), (SELECT COUNT(*) FROM @NuevoOrden) + 1);
            END
        END

        -- Actualizar el orden de los items
        UPDATE cv
        SET OrdenVisualizacion = no.NuevoOrden
        FROM ChecklistViaje cv
        INNER JOIN @NuevoOrden no ON cv.ChecklistId = no.ChecklistId
        WHERE cv.PlanId = @PlanId AND cv.CategoriaChecklist = @CategoriaChecklist;

        SELECT 'Items reordenados exitosamente' AS Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados para CHECKLISTVIAJE actualizados exitosamente.';