-- =============================================
-- Procedimientos Almacenados Básicos para Tabla PRESUPUESTOVIAJE
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: PresupuestoViaje_Insert
-- Descripción: Inserta un nuevo presupuesto para una categoría de viaje
-- =============================================
CREATE PROCEDURE PresupuestoViaje_Insert
    @PlanId UNIQUEIDENTIFIER,
    @CategoriaViajeId UNIQUEIDENTIFIER,
    @PresupuestoEstimado DECIMAL(18,2),
    @Notas NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PresupuestoViajeId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        -- Verificar que el plan existe y obtener el usuario
        SELECT @UsuarioId = UsuarioId
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar que la categoría de viaje existe y está activa
        IF NOT EXISTS (
            SELECT 1 FROM CategoriasGastosViaje 
            WHERE CategoriaViajeId = @CategoriaViajeId AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('La categoría de gastos de viaje no existe o está inactiva.', 16, 1);
            RETURN;
        END
        
        -- Validar que no exista ya un presupuesto para esta categoría en este plan
        IF EXISTS (
            SELECT 1 FROM PresupuestoViaje 
            WHERE PlanId = @PlanId AND CategoriaViajeId = @CategoriaViajeId
        )
        BEGIN
            RAISERROR('Ya existe un presupuesto para esta categoría en el plan especificado.', 16, 1);
            RETURN;
        END
        
        -- Validar presupuesto estimado
        IF @PresupuestoEstimado IS NULL OR @PresupuestoEstimado < 0
        BEGIN
            RAISERROR('El presupuesto estimado debe ser mayor o igual a cero.', 16, 1);
            RETURN;
        END
        
        -- Insertar presupuesto de viaje
        INSERT INTO PresupuestoViaje (
            PresupuestoViajeId, PlanId, CategoriaViajeId, PresupuestoEstimado,
            GastoReal, Notas, FechaCreacion, FechaActualizacion
        )
        VALUES (
            @PresupuestoViajeId, @PlanId, @CategoriaViajeId, @PresupuestoEstimado,
            0.00, @Notas, GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar el presupuesto creado con información adicional
        SELECT 
            pv.PresupuestoViajeId, pv.PlanId, pv.CategoriaViajeId, 
            cgv.NombreCategoria, cgv.Color, cgv.Icono,
            pv.PresupuestoEstimado, pv.GastoReal, pv.Notas,
            pv.FechaCreacion, pv.FechaActualizacion,
            -- Cálculos adicionales
            (pv.PresupuestoEstimado - pv.GastoReal) as SaldoDisponible,
            CASE 
                WHEN pv.PresupuestoEstimado > 0 THEN 
                    ROUND((pv.GastoReal * 100.0) / pv.PresupuestoEstimado, 2)
                ELSE 0 
            END as PorcentajeUsado
        FROM PresupuestoViaje pv
        INNER JOIN CategoriasGastosViaje cgv ON pv.CategoriaViajeId = cgv.CategoriaViajeId
        WHERE pv.PresupuestoViajeId = @PresupuestoViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PresupuestoViaje_Update
-- Descripción: Actualiza un presupuesto de viaje existente
-- =============================================
CREATE PROCEDURE PresupuestoViaje_Update
    @PresupuestoViajeId UNIQUEIDENTIFIER,
    @PresupuestoEstimado DECIMAL(18,2) = NULL,
    @GastoReal DECIMAL(18,2) = NULL,
    @Notas NVARCHAR(500) = NULL,
    @ActualizarSoloNotas BIT = 0 -- Flag para actualizar solo las notas
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que el presupuesto existe
        IF NOT EXISTS (SELECT 1 FROM PresupuestoViaje WHERE PresupuestoViajeId = @PresupuestoViajeId)
        BEGIN
            RAISERROR('El presupuesto de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Validaciones solo si no es actualización de notas únicamente
        IF @ActualizarSoloNotas = 0
        BEGIN
            -- Validar presupuesto estimado
            IF @PresupuestoEstimado IS NOT NULL AND @PresupuestoEstimado < 0
            BEGIN
                RAISERROR('El presupuesto estimado no puede ser negativo.', 16, 1);
                RETURN;
            END
            
            -- Validar gasto real
            IF @GastoReal IS NOT NULL AND @GastoReal < 0
            BEGIN
                RAISERROR('El gasto real no puede ser negativo.', 16, 1);
                RETURN;
            END
        END
        
        -- Actualizar campos según el modo
        IF @ActualizarSoloNotas = 1
        BEGIN
            -- Solo actualizar notas
            UPDATE PresupuestoViaje 
            SET 
                Notas = @Notas,
                FechaActualizacion = GETUTCDATE()
            WHERE PresupuestoViajeId = @PresupuestoViajeId;
        END
        ELSE
        BEGIN
            -- Actualizar todos los campos especificados
            UPDATE PresupuestoViaje 
            SET 
                PresupuestoEstimado = ISNULL(@PresupuestoEstimado, PresupuestoEstimado),
                GastoReal = ISNULL(@GastoReal, GastoReal),
                Notas = ISNULL(@Notas, Notas),
                FechaActualizacion = GETUTCDATE()
            WHERE PresupuestoViajeId = @PresupuestoViajeId;
        END
        
        -- Retornar el presupuesto actualizado con información adicional
        SELECT 
            pv.PresupuestoViajeId, pv.PlanId, pv.CategoriaViajeId, 
            cgv.NombreCategoria, cgv.Color, cgv.Icono,
            pv.PresupuestoEstimado, pv.GastoReal, pv.Notas,
            pv.FechaCreacion, pv.FechaActualizacion,
            -- Cálculos adicionales
            (pv.PresupuestoEstimado - pv.GastoReal) as SaldoDisponible,
            CASE 
                WHEN pv.PresupuestoEstimado > 0 THEN 
                    ROUND((pv.GastoReal * 100.0) / pv.PresupuestoEstimado, 2)
                ELSE 0 
            END as PorcentajeUsado,
            CASE 
                WHEN pv.GastoReal > pv.PresupuestoEstimado THEN 1
                ELSE 0 
            END as ExcedioPresupuesto
        FROM PresupuestoViaje pv
        INNER JOIN CategoriasGastosViaje cgv ON pv.CategoriaViajeId = cgv.CategoriaViajeId
        WHERE pv.PresupuestoViajeId = @PresupuestoViajeId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PresupuestoViaje_Delete
-- Descripción: Elimina un presupuesto de viaje
-- =============================================
CREATE PROCEDURE PresupuestoViaje_Delete
    @PresupuestoViajeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @PlanId UNIQUEIDENTIFIER;
    DECLARE @CategoriaViajeId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        -- Verificar que el presupuesto existe y obtener datos
        SELECT @PlanId = PlanId, @CategoriaViajeId = CategoriaViajeId
        FROM PresupuestoViaje 
        WHERE PresupuestoViajeId = @PresupuestoViajeId;
        
        IF @PlanId IS NULL
        BEGIN
            RAISERROR('El presupuesto de viaje no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si hay gastos asociados a esta categoría en el plan
        IF EXISTS (
            SELECT 1 FROM GastosViaje 
            WHERE PlanId = @PlanId AND CategoriaViajeId = @CategoriaViajeId
        )
        BEGIN
            RAISERROR('No se puede eliminar el presupuesto porque ya existen gastos registrados para esta categoría en el plan.', 16, 1);
            RETURN;
        END
        
        -- Eliminar presupuesto
        DELETE FROM PresupuestoViaje WHERE PresupuestoViajeId = @PresupuestoViajeId;
        
        SELECT 'Presupuesto de viaje eliminado exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PresupuestoViaje_Select
-- Descripción: Obtiene un presupuesto de viaje por ID
-- =============================================
CREATE PROCEDURE PresupuestoViaje_Select
    @PresupuestoViajeId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pv.PresupuestoViajeId, pv.PlanId, pv.CategoriaViajeId, 
        cgv.NombreCategoria, cgv.Color, cgv.Icono, cgv.EsObligatoria,
        plv.NombrePlan, plv.Destino, plv.FechaInicio, plv.FechaFin,
        pv.PresupuestoEstimado, pv.GastoReal, pv.Notas,
        pv.FechaCreacion, pv.FechaActualizacion,
        -- Cálculos adicionales
        (pv.PresupuestoEstimado - pv.GastoReal) AS SaldoDisponible,
        CASE 
            WHEN pv.PresupuestoEstimado > 0 THEN 
                ROUND((pv.GastoReal * 100.0) / pv.PresupuestoEstimado, 2)
            ELSE 0 
        END AS PorcentajeUsado,
        CASE 
            WHEN pv.GastoReal > pv.PresupuestoEstimado THEN 1
            ELSE 0 
        END AS ExcedioPresupuesto,
        -- Estadísticas de gastos
        (SELECT COUNT(*) FROM GastosViaje WHERE PlanId = pv.PlanId AND CategoriaViajeId = pv.CategoriaViajeId) AS CantidadGastos,
        (SELECT MAX(FechaGasto) FROM GastosViaje WHERE PlanId = pv.PlanId AND CategoriaViajeId = pv.CategoriaViajeId) AS UltimoGasto
    FROM PresupuestoViaje pv
    INNER JOIN CategoriasGastosViaje cgv ON pv.CategoriaViajeId = cgv.CategoriaViajeId
    INNER JOIN PlanesVacaciones plv ON pv.PlanId = plv.PlanId
    WHERE pv.PresupuestoViajeId = @PresupuestoViajeId;
END;
GO

-- =============================================
-- SP: PresupuestoViaje_SelectByPlan
-- Descripción: Obtiene todos los presupuestos de un plan de viaje
-- =============================================
CREATE PROCEDURE PresupuestoViaje_SelectByPlan
    @PlanId UNIQUEIDENTIFIER,
    @IncluirResumen BIT = 1,
    @OrdenarPor NVARCHAR(20) = 'Categoria' -- 'Categoria', 'Presupuesto', 'Porcentaje'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    -- Verificar que el plan existe
    SELECT @UsuarioId = UsuarioId
    FROM PlanesVacaciones 
    WHERE PlanId = @PlanId;
    
    IF @UsuarioId IS NULL
    BEGIN
        RAISERROR('El plan de vacaciones no existe.', 16, 1);
        RETURN;
    END
    
    -- Consulta principal de presupuestos
    SELECT 
        pv.PresupuestoViajeId, pv.PlanId, pv.CategoriaViajeId, 
        cgv.NombreCategoria, cgv.Color, cgv.Icono, cgv.EsObligatoria, cgv.OrdenVisualizacion,
        pv.PresupuestoEstimado, pv.GastoReal, pv.Notas,
        pv.FechaCreacion, pv.FechaActualizacion,
        -- Cálculos adicionales
        (pv.PresupuestoEstimado - pv.GastoReal) as SaldoDisponible,
        CASE 
            WHEN pv.PresupuestoEstimado > 0 THEN 
                ROUND((pv.GastoReal * 100.0) / pv.PresupuestoEstimado, 2)
            ELSE 0 
        END as PorcentajeUsado,
        CASE 
            WHEN pv.GastoReal > pv.PresupuestoEstimado THEN 1
            ELSE 0 
        END as ExcedioPresupuesto,
        -- Estadísticas de gastos por categoría
        (SELECT COUNT(*) FROM GastosViaje WHERE PlanId = pv.PlanId AND CategoriaViajeId = pv.CategoriaViajeId) as CantidadGastos
    FROM PresupuestoViaje pv
    INNER JOIN CategoriasGastosViaje cgv ON pv.CategoriaViajeId = cgv.CategoriaViajeId
    WHERE pv.PlanId = @PlanId
    ORDER BY 
        CASE 
            WHEN @OrdenarPor = 'Categoria' THEN cgv.OrdenVisualizacion
            WHEN @OrdenarPor = 'Presupuesto' THEN 0
            WHEN @OrdenarPor = 'Porcentaje' THEN 0
            ELSE cgv.OrdenVisualizacion
        END,
        CASE 
            WHEN @OrdenarPor = 'Presupuesto' THEN pv.PresupuestoEstimado
            ELSE 0
        END DESC,
        CASE 
            WHEN @OrdenarPor = 'Porcentaje' THEN 
                CASE WHEN pv.PresupuestoEstimado > 0 THEN (pv.GastoReal * 100.0) / pv.PresupuestoEstimado ELSE 0 END
            ELSE 0
        END DESC,
        cgv.NombreCategoria;
    
    -- Resumen general si se solicita
    IF @IncluirResumen = 1
    BEGIN
        SELECT 
            @PlanId as PlanId,
            COUNT(*) as TotalCategorias,
            SUM(pv.PresupuestoEstimado) as PresupuestoTotalEstimado,
            SUM(pv.GastoReal) as GastoTotalReal,
            SUM(pv.PresupuestoEstimado - pv.GastoReal) as SaldoTotalDisponible,
            CASE 
                WHEN SUM(pv.PresupuestoEstimado) > 0 THEN 
                    ROUND((SUM(pv.GastoReal) * 100.0) / SUM(pv.PresupuestoEstimado), 2)
                ELSE 0 
            END as PorcentajeTotalUsado,
            SUM(CASE WHEN pv.GastoReal > pv.PresupuestoEstimado THEN 1 ELSE 0 END) as CategoriasExcedidas,
            -- Categoría con mayor gasto
            (SELECT TOP 1 cgv2.NombreCategoria 
             FROM PresupuestoViaje pv2 
             INNER JOIN CategoriasGastosViaje cgv2 ON pv2.CategoriaViajeId = cgv2.CategoriaViajeId
             WHERE pv2.PlanId = @PlanId 
             ORDER BY pv2.GastoReal DESC) as CategoriaConMayorGasto,
            -- Categoría con mayor porcentaje usado
            (SELECT TOP 1 cgv3.NombreCategoria 
             FROM PresupuestoViaje pv3 
             INNER JOIN CategoriasGastosViaje cgv3 ON pv3.CategoriaViajeId = cgv3.CategoriaViajeId
             WHERE pv3.PlanId = @PlanId AND pv3.PresupuestoEstimado > 0
             ORDER BY (pv3.GastoReal * 100.0) / pv3.PresupuestoEstimado DESC) as CategoriaConMayorPorcentaje
        FROM PresupuestoViaje pv
        WHERE pv.PlanId = @PlanId;
    END
END;
GO

-- =============================================
-- SP: PresupuestoViaje_CrearPresupuestoCompleto
-- Descripción: Crea presupuestos para todas las categorías obligatorias de un plan
-- =============================================
CREATE PROCEDURE PresupuestoViaje_CrearPresupuestoCompleto
    @PlanId UNIQUEIDENTIFIER,
    @PresupuestoTotal DECIMAL(18,2) = NULL, -- Si se especifica, se distribuye proporcionalmente
    @SoloObligatorias BIT = 1 -- Solo crear para categorías obligatorias
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @CantidadCategorias INT;
    DECLARE @PresupuestoPorCategoria DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que el plan existe
        SELECT @UsuarioId = UsuarioId
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si ya existen presupuestos para este plan
        IF EXISTS (SELECT 1 FROM PresupuestoViaje WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('Ya existen presupuestos definidos para este plan de viaje.', 16, 1);
            RETURN;
        END
        
        -- Contar categorías que se van a crear
        SELECT @CantidadCategorias = COUNT(*)
        FROM CategoriasGastosViaje 
        WHERE EstaActivo = 1 
          AND (@SoloObligatorias = 0 OR EsObligatoria = 1);
        
        IF @CantidadCategorias = 0
        BEGIN
            RAISERROR('No hay categorías disponibles para crear presupuestos.', 16, 1);
            RETURN;
        END
        
        -- Calcular presupuesto por categoría si se especificó total
        SET @PresupuestoPorCategoria = ISNULL(@PresupuestoTotal / @CantidadCategorias, 0);
        
        -- Crear presupuestos para las categorías seleccionadas
        INSERT INTO PresupuestoViaje (
            PresupuestoViajeId, PlanId, CategoriaViajeId, PresupuestoEstimado,
            GastoReal, Notas, FechaCreacion, FechaActualizacion
        )
        SELECT 
            NEWID(),
            @PlanId,
            cgv.CategoriaViajeId,
            @PresupuestoPorCategoria,
            0.00,
            'Presupuesto inicial para ' + cgv.NombreCategoria,
            GETUTCDATE(),
            GETUTCDATE()
        FROM CategoriasGastosViaje cgv
        WHERE cgv.EstaActivo = 1 
          AND (@SoloObligatorias = 0 OR cgv.EsObligatoria = 1);
        
        -- Retornar los presupuestos creados
        SELECT 
            pv.PresupuestoViajeId, pv.PlanId, pv.CategoriaViajeId, 
            cgv.NombreCategoria, cgv.Color, cgv.Icono, cgv.EsObligatoria,
            pv.PresupuestoEstimado, pv.GastoReal, pv.Notas,
            pv.FechaCreacion
        FROM PresupuestoViaje pv
        INNER JOIN CategoriasGastosViaje cgv ON pv.CategoriaViajeId = cgv.CategoriaViajeId
        WHERE pv.PlanId = @PlanId
        ORDER BY cgv.OrdenVisualizacion, cgv.NombreCategoria;
        
        -- Información de resumen
        SELECT 
            @CantidadCategorias as CategoriasCreadas,
            ISNULL(@PresupuestoTotal, 0) as PresupuestoTotalDistribuido,
            @PresupuestoPorCategoria as PresupuestoPorCategoria,
            'Presupuestos creados exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PresupuestoViaje_ActualizarGastosReales
-- Descripción: Actualiza los gastos reales basándose en los gastos registrados
-- =============================================
CREATE PROCEDURE PresupuestoViaje_ActualizarGastosReales
    @PlanId UNIQUEIDENTIFIER = NULL, -- Si es NULL, actualiza todos los planes
    @CategoriaViajeId UNIQUEIDENTIFIER = NULL -- Si se especifica junto con PlanId, solo esa categoría
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @RegistrosActualizados INT = 0;
    
    BEGIN TRY
        -- Actualizar gastos reales basándose en los gastos registrados
        UPDATE pv 
        SET 
            GastoReal = ISNULL(gastos.TotalGasto, 0),
            FechaActualizacion = GETUTCDATE()
        FROM PresupuestoViaje pv
        LEFT JOIN (
            SELECT 
                gv.PlanId,
                gv.CategoriaViajeId,
                SUM(gv.Monto) as TotalGasto
            FROM GastosViaje gv
            GROUP BY gv.PlanId, gv.CategoriaViajeId
        ) gastos ON pv.PlanId = gastos.PlanId AND pv.CategoriaViajeId = gastos.CategoriaViajeId
        WHERE (@PlanId IS NULL OR pv.PlanId = @PlanId)
          AND (@CategoriaViajeId IS NULL OR pv.CategoriaViajeId = @CategoriaViajeId);
        
        SET @RegistrosActualizados = @@ROWCOUNT;
        
        -- Retornar resultado de la actualización
        SELECT 
            @RegistrosActualizados as PresupuestosActualizados,
            'Gastos reales actualizados exitosamente' as Resultado;
        
        -- Si se especificó un plan concreto, mostrar el resumen actualizado
        IF @PlanId IS NOT NULL
        BEGIN
            EXEC PresupuestoViaje_SelectByPlan @PlanId = @PlanId, @IncluirResumen = 1;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados básicos para tabla PRESUPUESTOVIAJE creados exitosamente';
PRINT 'SPs creados: PresupuestoViaje_Insert, PresupuestoViaje_Update, PresupuestoViaje_Delete, PresupuestoViaje_Select, PresupuestoViaje_SelectByPlan, PresupuestoViaje_CrearPresupuestoCompleto, PresupuestoViaje_ActualizarGastosReales';