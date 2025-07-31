-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla CATEGORIASGASTOSVIAJE
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: CategoriasGastosViaje_Insert
-- Descripci�n: Inserta una nueva categor�a de gastos de viaje
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_Insert
    @NombreCategoria NVARCHAR(100),
    @Descripcion NVARCHAR(500) = NULL,
    @Icono NVARCHAR(50) = 'travel',
    @Color NVARCHAR(7) = '#3B82F6',
    @EsObligatoria BIT = 0,
    @OrdenVisualizacion INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoriaViajeId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar campos obligatorios
        IF @NombreCategoria IS NULL OR LTRIM(RTRIM(@NombreCategoria)) = ''
        BEGIN
            RAISERROR('El nombre de la categor�a es obligatorio.', 16, 1);
            RETURN;
        END
        
        -- Validar que no exista una categor�a con el mismo nombre
        IF EXISTS (
            SELECT 1 FROM CategoriasGastosViaje 
            WHERE NombreCategoria = @NombreCategoria 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe una categor�a de gastos de viaje con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Validar formato de color hexadecimal
        IF @Color IS NOT NULL AND @Color NOT LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
        BEGIN
            RAISERROR('El color debe ser un c�digo hexadecimal v�lido (ejemplo: #3B82F6).', 16, 1);
            RETURN;
        END
        
        -- Validar orden de visualizaci�n
        IF @OrdenVisualizacion < 0
        BEGIN
            RAISERROR('El orden de visualizaci�n no puede ser negativo.', 16, 1);
            RETURN;
        END
        
        -- Si no se especifica orden, obtener el siguiente disponible
        IF @OrdenVisualizacion = 0
        BEGIN
            SELECT @OrdenVisualizacion = ISNULL(MAX(OrdenVisualizacion), 0) + 10
            FROM CategoriasGastosViaje 
            WHERE EstaActivo = 1;
        END
        
        -- Insertar categor�a de gastos de viaje
        INSERT INTO CategoriasGastosViaje (
            CategoriaViajeId, NombreCategoria, Descripcion, Icono, Color,
            EsObligatoria, OrdenVisualizacion, EstaActivo, FechaCreacion
        )
        VALUES (
            @CategoriaViajeId, @NombreCategoria, @Descripcion, @Icono, @Color,
            @EsObligatoria, @OrdenVisualizacion, 1, GETUTCDATE()
        );
        
        -- Retornar la categor�a creada
        SELECT 
            CategoriaViajeId, NombreCategoria, Descripcion, Icono, Color,
            EsObligatoria, OrdenVisualizacion, EstaActivo, FechaCreacion
        FROM CategoriasGastosViaje 
        WHERE CategoriaViajeId = @CategoriaViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_Update
-- Descripci�n: Actualiza una categor�a de gastos de viaje existente
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_Update
    @CategoriaViajeId UNIQUEIDENTIFIER,
    @NombreCategoria NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @Icono NVARCHAR(50) = NULL,
    @Color NVARCHAR(7) = NULL,
    @EsObligatoria BIT = NULL,
    @OrdenVisualizacion INT = NULL,
    @EstaActivo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la categor�a existe
        IF NOT EXISTS (SELECT 1 FROM CategoriasGastosViaje WHERE CategoriaViajeId = @CategoriaViajeId)
        BEGIN
            RAISERROR('La categor�a de gastos de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar nombre �nico si se est� actualizando
        IF @NombreCategoria IS NOT NULL AND EXISTS (
            SELECT 1 FROM CategoriasGastosViaje 
            WHERE NombreCategoria = @NombreCategoria 
              AND CategoriaViajeId != @CategoriaViajeId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe otra categor�a de gastos de viaje con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Validar formato de color hexadecimal
        IF @Color IS NOT NULL AND @Color NOT LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
        BEGIN
            RAISERROR('El color debe ser un c�digo hexadecimal v�lido (ejemplo: #3B82F6).', 16, 1);
            RETURN;
        END
        
        -- Validar orden de visualizaci�n
        IF @OrdenVisualizacion IS NOT NULL AND @OrdenVisualizacion < 0
        BEGIN
            RAISERROR('El orden de visualizaci�n no puede ser negativo.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE CategoriasGastosViaje 
        SET 
            NombreCategoria = ISNULL(@NombreCategoria, NombreCategoria),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            Icono = ISNULL(@Icono, Icono),
            Color = ISNULL(@Color, Color),
            EsObligatoria = ISNULL(@EsObligatoria, EsObligatoria),
            OrdenVisualizacion = ISNULL(@OrdenVisualizacion, OrdenVisualizacion),
            EstaActivo = ISNULL(@EstaActivo, EstaActivo)
        WHERE CategoriaViajeId = @CategoriaViajeId;
        
        -- Retornar la categor�a actualizada
        SELECT 
            CategoriaViajeId, NombreCategoria, Descripcion, Icono, Color,
            EsObligatoria, OrdenVisualizacion, EstaActivo, FechaCreacion
        FROM CategoriasGastosViaje 
        WHERE CategoriaViajeId = @CategoriaViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_Delete
-- Descripci�n: Elimina (desactiva) una categor�a de gastos de viaje
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_Delete
    @CategoriaViajeId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Soft delete, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la categor�a existe
        IF NOT EXISTS (SELECT 1 FROM CategoriasGastosViaje WHERE CategoriaViajeId = @CategoriaViajeId)
        BEGIN
            RAISERROR('La categor�a de gastos de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene datos relacionados
        DECLARE @TieneRelaciones BIT = 0;
        
        IF EXISTS (SELECT 1 FROM PresupuestoViaje WHERE CategoriaViajeId = @CategoriaViajeId) OR
           EXISTS (SELECT 1 FROM ActividadesViaje WHERE CategoriaViajeId = @CategoriaViajeId) OR
           EXISTS (SELECT 1 FROM GastosViaje WHERE CategoriaViajeId = @CategoriaViajeId)
        BEGIN
            SET @TieneRelaciones = 1;
        END
        
        IF @TieneRelaciones = 1 AND @EliminacionFisica = 1
        BEGIN
            RAISERROR('No se puede eliminar f�sicamente la categor�a porque tiene datos relacionados (presupuestos, actividades o gastos de viaje).', 16, 1);
            RETURN;
        END
        
        -- Verificar si es una categor�a obligatoria
        IF EXISTS (SELECT 1 FROM CategoriasGastosViaje WHERE CategoriaViajeId = @CategoriaViajeId AND EsObligatoria = 1)
        BEGIN
            RAISERROR('No se puede eliminar una categor�a marcada como obligatoria.', 16, 1);
            RETURN;
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminaci�n f�sica
            DELETE FROM CategoriasGastosViaje WHERE CategoriaViajeId = @CategoriaViajeId;
            
            SELECT 'Categor�a de gastos de viaje eliminada f�sicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Eliminaci�n l�gica (soft delete)
            UPDATE CategoriasGastosViaje 
            SET EstaActivo = 0
            WHERE CategoriaViajeId = @CategoriaViajeId;
            
            SELECT 'Categor�a de gastos de viaje desactivada' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_Select
-- Descripci�n: Obtiene una categor�a de gastos de viaje por ID
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_Select
    @CategoriaViajeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cgv.CategoriaViajeId, cgv.NombreCategoria, cgv.Descripcion, 
        cgv.Icono, cgv.Color, cgv.EsObligatoria, cgv.OrdenVisualizacion, 
        cgv.EstaActivo, cgv.FechaCreacion,
        -- Estad�sticas de uso
        (SELECT COUNT(*) FROM PresupuestoViaje WHERE CategoriaViajeId = @CategoriaViajeId) as PlanesConPresupuesto,
        (SELECT COUNT(*) FROM ActividadesViaje WHERE CategoriaViajeId = @CategoriaViajeId) as ActividadesAsociadas,
        (SELECT COUNT(*) FROM GastosViaje WHERE CategoriaViajeId = @CategoriaViajeId) as GastosRegistrados,
        (SELECT SUM(Monto) FROM GastosViaje WHERE CategoriaViajeId = @CategoriaViajeId) as TotalGastado
    FROM CategoriasGastosViaje cgv
    WHERE cgv.CategoriaViajeId = @CategoriaViajeId;
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_SelectAll
-- Descripci�n: Obtiene todas las categor�as de gastos de viaje
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_SelectAll
    @SoloActivas BIT = 1,
    @SoloObligatorias BIT = 0,
    @IncluirEstadisticas BIT = 0,
    @OrdenarPor NVARCHAR(20) = 'OrdenVisualizacion' -- 'OrdenVisualizacion', 'NombreCategoria', 'FechaCreacion'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @IncluirEstadisticas = 1
    BEGIN
        -- Consulta con estad�sticas
        SELECT 
            cgv.CategoriaViajeId, cgv.NombreCategoria, cgv.Descripcion, 
            cgv.Icono, cgv.Color, cgv.EsObligatoria, cgv.OrdenVisualizacion, 
            cgv.EstaActivo, cgv.FechaCreacion,
            -- Estad�sticas de uso
            (SELECT COUNT(*) FROM PresupuestoViaje WHERE CategoriaViajeId = cgv.CategoriaViajeId) as PlanesConPresupuesto,
            (SELECT COUNT(*) FROM ActividadesViaje WHERE CategoriaViajeId = cgv.CategoriaViajeId) as ActividadesAsociadas,
            (SELECT COUNT(*) FROM GastosViaje WHERE CategoriaViajeId = cgv.CategoriaViajeId) as GastosRegistrados,
            ISNULL((SELECT SUM(Monto) FROM GastosViaje WHERE CategoriaViajeId = cgv.CategoriaViajeId), 0) as TotalGastado
        FROM CategoriasGastosViaje cgv
        WHERE (@SoloActivas = 0 OR cgv.EstaActivo = 1)
          AND (@SoloObligatorias = 0 OR cgv.EsObligatoria = 1)
        ORDER BY 
            CASE 
                WHEN @OrdenarPor = 'OrdenVisualizacion' THEN cgv.OrdenVisualizacion
                ELSE 0
            END,
            CASE 
                WHEN @OrdenarPor = 'NombreCategoria' THEN cgv.NombreCategoria
                WHEN @OrdenarPor = 'FechaCreacion' THEN ''
                ELSE cgv.NombreCategoria
            END,
            CASE 
                WHEN @OrdenarPor = 'FechaCreacion' THEN cgv.FechaCreacion
                ELSE cgv.FechaCreacion
            END;
    END
    ELSE
    BEGIN
        -- Consulta simple sin estad�sticas
        SELECT 
            CategoriaViajeId, NombreCategoria, Descripcion, Icono, Color,
            EsObligatoria, OrdenVisualizacion, EstaActivo, FechaCreacion
        FROM CategoriasGastosViaje 
        WHERE (@SoloActivas = 0 OR EstaActivo = 1)
          AND (@SoloObligatorias = 0 OR EsObligatoria = 1)
        ORDER BY 
            CASE 
                WHEN @OrdenarPor = 'OrdenVisualizacion' THEN OrdenVisualizacion
                ELSE 0
            END,
            CASE 
                WHEN @OrdenarPor = 'NombreCategoria' THEN NombreCategoria
                WHEN @OrdenarPor = 'FechaCreacion' THEN ''
                ELSE NombreCategoria
            END,
            CASE 
                WHEN @OrdenarPor = 'FechaCreacion' THEN FechaCreacion
                ELSE FechaCreacion
            END;
    END
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_ReordenarVisualizacion
-- Descripci�n: Reordena las categor�as de gastos de viaje
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_ReordenarVisualizacion
    @ListaCategorias NVARCHAR(MAX) -- Lista de IDs separados por comas en el orden deseado
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @OrdenActual INT = 10;
    DECLARE @CategoriaId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        -- Validar que se proporcion� la lista
        IF @ListaCategorias IS NULL OR LTRIM(RTRIM(@ListaCategorias)) = ''
        BEGIN
            RAISERROR('La lista de categor�as es obligatoria.', 16, 1);
            RETURN;
        END
        
        -- Crear tabla temporal para procesar la lista
        CREATE TABLE #TempCategorias (
            CategoriaViajeId UNIQUEIDENTIFIER,
            NuevoOrden INT
        );
        
        -- Procesar la lista de IDs
        DECLARE @xml XML = CAST('<root><item>' + REPLACE(@ListaCategorias, ',', '</item><item>') + '</item></root>' AS XML);
        
        INSERT INTO #TempCategorias (CategoriaViajeId, NuevoOrden)
        SELECT 
            CAST(item.value('.', 'NVARCHAR(50)') AS UNIQUEIDENTIFIER),
            ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) * 10
        FROM @xml.nodes('/root/item') AS x(item)
        WHERE LTRIM(RTRIM(item.value('.', 'NVARCHAR(50)'))) != '';
        
        -- Verificar que todas las categor�as existen
        IF EXISTS (
            SELECT 1 FROM #TempCategorias tc 
            WHERE NOT EXISTS (
                SELECT 1 FROM CategoriasGastosViaje cgv 
                WHERE cgv.CategoriaViajeId = tc.CategoriaViajeId AND cgv.EstaActivo = 1
            )
        )
        BEGIN
            RAISERROR('Una o m�s categor�as en la lista no existen o est�n inactivas.', 16, 1);
            RETURN;
        END
        
        -- Actualizar el orden de visualizaci�n
        UPDATE cgv 
        SET OrdenVisualizacion = tc.NuevoOrden
        FROM CategoriasGastosViaje cgv
        INNER JOIN #TempCategorias tc ON cgv.CategoriaViajeId = tc.CategoriaViajeId;
        
        -- Retornar las categor�as reordenadas
        SELECT 
            CategoriaViajeId, NombreCategoria, OrdenVisualizacion, EstaActivo
        FROM CategoriasGastosViaje 
        WHERE EstaActivo = 1
        ORDER BY OrdenVisualizacion, NombreCategoria;
        
        DROP TABLE #TempCategorias;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        IF OBJECT_ID('tempdb..#TempCategorias') IS NOT NULL
            DROP TABLE #TempCategorias;
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasGastosViaje_InicializarCategorias
-- Descripci�n: Inserta las categor�as b�sicas obligatorias del sistema
-- =============================================
CREATE PROCEDURE CategoriasGastosViaje_InicializarCategorias
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar si ya existen categor�as
        IF EXISTS (SELECT 1 FROM CategoriasGastosViaje)
        BEGIN
            SELECT 'Las categor�as de gastos de viaje ya han sido inicializadas.' as Resultado;
            RETURN;
        END
        
        -- Insertar categor�as b�sicas obligatorias
        INSERT INTO CategoriasGastosViaje (
            CategoriaViajeId, NombreCategoria, Descripcion, Icono, Color,
            EsObligatoria, OrdenVisualizacion, EstaActivo, FechaCreacion
        )
        VALUES
        (NEWID(), 'Transporte', 'Gastos de transporte: vuelos, trenes, autobuses, taxis, etc.', 'airplane', '#3B82F6', 1, 10, 1, GETUTCDATE()),
        (NEWID(), 'Alojamiento', 'Gastos de hospedaje: hoteles, hostales, Airbnb, etc.', 'bed', '#10B981', 1, 20, 1, GETUTCDATE()),
        (NEWID(), 'Alimentaci�n', 'Gastos en comida y bebida: restaurantes, supermercados, etc.', 'utensils', '#F59E0B', 1, 30, 1, GETUTCDATE()),
        (NEWID(), 'Actividades', 'Gastos en entretenimiento y actividades tur�sticas', 'ticket', '#EF4444', 1, 40, 1, GETUTCDATE()),
        (NEWID(), 'Compras', 'Gastos en compras y souvenirs', 'shopping-bag', '#8B5CF6', 1, 50, 1, GETUTCDATE()),
        (NEWID(), 'Seguro', 'Gastos de seguros de viaje y salud', 'shield', '#06B6D4', 1, 60, 1, GETUTCDATE()),
        (NEWID(), 'Documentos', 'Gastos en documentaci�n: visas, pasaportes, etc.', 'file-text', '#84CC16', 1, 70, 1, GETUTCDATE()),
        (NEWID(), 'Comunicaci�n', 'Gastos en comunicaci�n: roaming, SIM cards, WiFi, etc.', 'smartphone', '#F97316', 0, 80, 1, GETUTCDATE()),
        (NEWID(), 'Salud', 'Gastos m�dicos y medicamentos', 'heart', '#EC4899', 0, 90, 1, GETUTCDATE()),
        (NEWID(), 'Otros', 'Gastos varios no clasificados en otras categor�as', 'more-horizontal', '#6B7280', 0, 100, 1, GETUTCDATE());
        
        SELECT 
            COUNT(*) as CategoriasCreadas,
            'Categor�as b�sicas de gastos de viaje inicializadas correctamente.' as Resultado
        FROM CategoriasGastosViaje 
        WHERE EstaActivo = 1;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla CATEGORIASGASTOSVIAJE creados exitosamente';
PRINT 'SPs creados: CategoriasGastosViaje_Insert, CategoriasGastosViaje_Update, CategoriasGastosViaje_Delete, CategoriasGastosViaje_Select, CategoriasGastosViaje_SelectAll, CategoriasGastosViaje_ReordenarVisualizacion, CategoriasGastosViaje_InicializarCategorias';