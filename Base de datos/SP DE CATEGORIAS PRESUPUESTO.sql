-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla CATEGORIAS PRESUPUESTO
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: CategoriasPresupuesto_Insert
-- Descripci�n: Asigna una categor�a a un presupuesto con monto
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_Insert
    @PresupuestoId UNIQUEIDENTIFIER,
    @CategoriaId UNIQUEIDENTIFIER,
    @MontoAsignado DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoriaPresupuestoId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        -- Validar que el presupuesto existe y obtener usuario
        SELECT @UsuarioId = UsuarioId
        FROM Presupuestos 
        WHERE PresupuestoId = @PresupuestoId AND EstaActivo = 1;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El presupuesto no existe o est� inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar que la categor�a existe y pertenece al mismo usuario
        IF NOT EXISTS (
            SELECT 1 FROM Categorias 
            WHERE CategoriaId = @CategoriaId 
              AND UsuarioId = @UsuarioId 
              AND TipoCategoria = 'gasto' 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('La categor�a no existe, no pertenece al usuario o no es de tipo gasto.', 16, 1);
            RETURN;
        END
        
        -- Validar que no existe ya una asignaci�n para esta categor�a en este presupuesto
        IF EXISTS (
            SELECT 1 FROM CategoriasPresupuesto 
            WHERE PresupuestoId = @PresupuestoId AND CategoriaId = @CategoriaId
        )
        BEGIN
            RAISERROR('Esta categor�a ya est� asignada a este presupuesto.', 16, 1);
            RETURN;
        END
        
        -- Validar monto
        IF @MontoAsignado <= 0
        BEGIN
            RAISERROR('El monto asignado debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar que el monto total no exceda el presupuesto total
        DECLARE @PresupuestoTotal DECIMAL(18,2);
        DECLARE @TotalYaAsignado DECIMAL(18,2);
        
        SELECT @PresupuestoTotal = PresupuestoTotal FROM Presupuestos WHERE PresupuestoId = @PresupuestoId;
        
        SELECT @TotalYaAsignado = COALESCE(SUM(MontoAsignado), 0) 
        FROM CategoriasPresupuesto 
        WHERE PresupuestoId = @PresupuestoId;
        
        IF (@TotalYaAsignado + @MontoAsignado) > @PresupuestoTotal
        BEGIN
            DECLARE @MontoDisponible DECIMAL(18,2) = @PresupuestoTotal - @TotalYaAsignado;
            DECLARE @MsgDisponible NVARCHAR(50) = CAST(@MontoDisponible AS NVARCHAR(50));
            RAISERROR('El monto asignado excede el presupuesto disponible. Disponible: %s', 16, 1, @MsgDisponible);
            RETURN;
        END
        
        -- Insertar categor�a de presupuesto
        INSERT INTO CategoriasPresupuesto (
            CategoriaPresupuestoId, PresupuestoId, CategoriaId, 
            MontoAsignado, MontoGastado, FechaCreacion, FechaActualizacion
        )
        VALUES (
            @CategoriaPresupuestoId, @PresupuestoId, @CategoriaId,
            @MontoAsignado, 0.00, GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar la categor�a de presupuesto creada con informaci�n adicional
        SELECT 
            cp.CategoriaPresupuestoId, cp.PresupuestoId, p.NombrePresupuesto,
            cp.CategoriaId, c.NombreCategoria, c.Color, c.Icono,
            cp.MontoAsignado, cp.MontoGastado,
            (cp.MontoAsignado - cp.MontoGastado) as MontoRestante,
            CAST((cp.MontoGastado * 100.0 / cp.MontoAsignado) AS DECIMAL(5,2)) as PorcentajeGastado,
            CASE 
                WHEN cp.MontoGastado > cp.MontoAsignado THEN 'Excedido'
                WHEN cp.MontoGastado = cp.MontoAsignado THEN 'Agotado'
                WHEN cp.MontoGastado > (cp.MontoAsignado * 0.8) THEN 'Advertencia'
                ELSE 'Normal'
            END as EstadoCategoria,
            cp.FechaCreacion, cp.FechaActualizacion
        FROM CategoriasPresupuesto cp
        INNER JOIN Presupuestos p ON cp.PresupuestoId = p.PresupuestoId
        INNER JOIN Categorias c ON cp.CategoriaId = c.CategoriaId
        WHERE cp.CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_Update
-- Descripci�n: Actualiza el monto asignado a una categor�a de presupuesto
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_Update
    @CategoriaPresupuestoId UNIQUEIDENTIFIER,
    @MontoAsignado DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @PresupuestoId UNIQUEIDENTIFIER;
    DECLARE @MontoAnterior DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que la categor�a de presupuesto existe
        SELECT @PresupuestoId = PresupuestoId, @MontoAnterior = MontoAsignado
        FROM CategoriasPresupuesto 
        WHERE CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
        IF @PresupuestoId IS NULL
        BEGIN
            RAISERROR('La categor�a de presupuesto no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar monto si se est� actualizando
        IF @MontoAsignado IS NOT NULL
        BEGIN
            IF @MontoAsignado <= 0
            BEGIN
                RAISERROR('El monto asignado debe ser mayor a cero.', 16, 1);
                RETURN;
            END
            
            -- Validar que el nuevo monto total no exceda el presupuesto
            DECLARE @PresupuestoTotal DECIMAL(18,2);
            DECLARE @TotalOtrasAsignaciones DECIMAL(18,2);
            
            SELECT @PresupuestoTotal = PresupuestoTotal FROM Presupuestos WHERE PresupuestoId = @PresupuestoId;
            
            SELECT @TotalOtrasAsignaciones = COALESCE(SUM(MontoAsignado), 0) 
            FROM CategoriasPresupuesto 
            WHERE PresupuestoId = @PresupuestoId 
              AND CategoriaPresupuestoId != @CategoriaPresupuestoId;
            
            IF (@TotalOtrasAsignaciones + @MontoAsignado) > @PresupuestoTotal
            BEGIN
                DECLARE @MontoDisponible2 DECIMAL(18,2) = @PresupuestoTotal - @TotalOtrasAsignaciones;
                DECLARE @MsgDisponible2 NVARCHAR(50) = CAST(@MontoDisponible2 AS NVARCHAR(50));
                RAISERROR('El monto asignado excede el presupuesto disponible. Disponible: %s', 16, 1, @MsgDisponible2);
                RETURN;
            END
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE CategoriasPresupuesto 
        SET 
            MontoAsignado = ISNULL(@MontoAsignado, MontoAsignado),
            FechaActualizacion = GETUTCDATE()
        WHERE CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
        -- Retornar la categor�a de presupuesto actualizada
        SELECT 
            cp.CategoriaPresupuestoId, cp.PresupuestoId, p.NombrePresupuesto,
            cp.CategoriaId, c.NombreCategoria, c.Color, c.Icono,
            cp.MontoAsignado, cp.MontoGastado,
            (cp.MontoAsignado - cp.MontoGastado) as MontoRestante,
            CASE 
                WHEN cp.MontoAsignado > 0 
                THEN CAST((cp.MontoGastado * 100.0 / cp.MontoAsignado) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeGastado,
            CASE 
                WHEN cp.MontoGastado > cp.MontoAsignado THEN 'Excedido'
                WHEN cp.MontoGastado = cp.MontoAsignado THEN 'Agotado'
                WHEN cp.MontoGastado > (cp.MontoAsignado * 0.8) THEN 'Advertencia'
                ELSE 'Normal'
            END as EstadoCategoria,
            cp.FechaCreacion, cp.FechaActualizacion
        FROM CategoriasPresupuesto cp
        INNER JOIN Presupuestos p ON cp.PresupuestoId = p.PresupuestoId
        INNER JOIN Categorias c ON cp.CategoriaId = c.CategoriaId
        WHERE cp.CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_Delete
-- Descripci�n: Elimina una categor�a de un presupuesto
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_Delete
    @CategoriaPresupuestoId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @MontoGastado DECIMAL(18,2);
    
    BEGIN TRY
        -- Verificar que la categor�a de presupuesto existe
        SELECT @MontoGastado = MontoGastado
        FROM CategoriasPresupuesto 
        WHERE CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
        IF @MontoGastado IS NULL
        BEGIN
            RAISERROR('La categor�a de presupuesto no existe.', 16, 1);
            RETURN;
        END
        
        -- Advertir si ya hay gastos registrados
        IF @MontoGastado > 0
        BEGIN
            -- Permitir eliminaci�n pero advertir
            SELECT 'ADVERTENCIA: La categor�a tiene gastos registrados por ' + CAST(@MontoGastado AS NVARCHAR(50)) as Advertencia;
        END
        
        -- Eliminar categor�a de presupuesto
        DELETE FROM CategoriasPresupuesto WHERE CategoriaPresupuestoId = @CategoriaPresupuestoId;
        
        SELECT 'Categor�a eliminada del presupuesto exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_Select
-- Descripci�n: Obtiene una categor�a de presupuesto por ID
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_Select
    @CategoriaPresupuestoId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cp.CategoriaPresupuestoId, cp.PresupuestoId, p.NombrePresupuesto, p.PeriodoPresupuesto,
        p.FechaInicio, p.FechaFin, cp.CategoriaId, c.NombreCategoria, c.Color, c.Icono,
        cp.MontoAsignado, cp.MontoGastado,
        (cp.MontoAsignado - cp.MontoGastado) as MontoRestante,
        CASE 
            WHEN cp.MontoAsignado > 0 
            THEN CAST((cp.MontoGastado * 100.0 / cp.MontoAsignado) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeGastado,
        CASE 
            WHEN cp.MontoGastado > cp.MontoAsignado THEN 'Excedido'
            WHEN cp.MontoGastado = cp.MontoAsignado THEN 'Agotado'
            WHEN cp.MontoGastado > (cp.MontoAsignado * 0.8) THEN 'Advertencia'
            ELSE 'Normal'
        END as EstadoCategoria,
        cp.FechaCreacion, cp.FechaActualizacion,
        -- Informaci�n del per�odo actual
        DATEDIFF(DAY, GETDATE(), p.FechaFin) as DiasRestantes,
        -- Promedio de gasto diario si hay gastos
        CASE 
            WHEN cp.MontoGastado > 0 AND DATEDIFF(DAY, p.FechaInicio, GETDATE()) > 0
            THEN cp.MontoGastado / DATEDIFF(DAY, p.FechaInicio, GETDATE())
            ELSE 0 
        END as PromedioGastoDiario
    FROM CategoriasPresupuesto cp
    INNER JOIN Presupuestos p ON cp.PresupuestoId = p.PresupuestoId
    INNER JOIN Categorias c ON cp.CategoriaId = c.CategoriaId
    WHERE cp.CategoriaPresupuestoId = @CategoriaPresupuestoId;
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_SelectByPresupuesto
-- Descripci�n: Obtiene todas las categor�as de un presupuesto
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_SelectByPresupuesto
    @PresupuestoId UNIQUEIDENTIFIER,
    @SoloConGastos BIT = 0, -- 1 = Solo categor�as que tienen gastos
    @OrdenarPor NVARCHAR(20) = 'nombre' -- 'nombre', 'monto_desc', 'porcentaje_desc', 'estado'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cp.CategoriaPresupuestoId, cp.PresupuestoId, cp.CategoriaId, 
        c.NombreCategoria, c.Color, c.Icono, cp.MontoAsignado, cp.MontoGastado,
        (cp.MontoAsignado - cp.MontoGastado) as MontoRestante,
        CASE 
            WHEN cp.MontoAsignado > 0 
            THEN CAST((cp.MontoGastado * 100.0 / cp.MontoAsignado) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeGastado,
        CASE 
            WHEN cp.MontoGastado > cp.MontoAsignado THEN 'Excedido'
            WHEN cp.MontoGastado = cp.MontoAsignado THEN 'Agotado'
            WHEN cp.MontoGastado > (cp.MontoAsignado * 0.8) THEN 'Advertencia'
            ELSE 'Normal'
        END as EstadoCategoria,
        cp.FechaCreacion, cp.FechaActualizacion,
        -- N�mero de transacciones en esta categor�a para el per�odo del presupuesto
        (SELECT COUNT(*) 
         FROM Transacciones t
         INNER JOIN Presupuestos p ON cp.PresupuestoId = p.PresupuestoId
         WHERE t.CategoriaId = cp.CategoriaId 
           AND t.TipoTransaccion = 'gasto'
           AND CAST(t.FechaTransaccion AS DATE) BETWEEN p.FechaInicio AND p.FechaFin
        ) as NumeroTransacciones
    FROM CategoriasPresupuesto cp
    INNER JOIN Categorias c ON cp.CategoriaId = c.CategoriaId
    WHERE cp.PresupuestoId = @PresupuestoId
      AND (@SoloConGastos = 0 OR cp.MontoGastado > 0)
    ORDER BY 
        CASE @OrdenarPor
            WHEN 'nombre' THEN c.NombreCategoria
            ELSE NULL
        END ASC,
        CASE @OrdenarPor
            WHEN 'monto_desc' THEN cp.MontoAsignado
            WHEN 'porcentaje_desc' THEN (cp.MontoGastado * 100.0 / NULLIF(cp.MontoAsignado, 0))
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'estado' THEN 
                CASE 
                    WHEN cp.MontoGastado > cp.MontoAsignado THEN 1 -- Excedido primero
                    WHEN cp.MontoGastado = cp.MontoAsignado THEN 2 -- Agotado
                    WHEN cp.MontoGastado > (cp.MontoAsignado * 0.8) THEN 3 -- Advertencia
                    ELSE 4 -- Normal al final
                END
            ELSE NULL
        END ASC;
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_UpdateMontoGastado
-- Descripci�n: Actualiza el monto gastado basado en transacciones reales
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_UpdateMontoGastado
    @PresupuestoId UNIQUEIDENTIFIER = NULL, -- NULL para actualizar todos los presupuestos activos
    @CategoriaId UNIQUEIDENTIFIER = NULL -- NULL para actualizar todas las categor�as
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @RegistrosActualizados INT = 0;
    
    BEGIN TRY
        -- Actualizar montos gastados basados en transacciones reales
        UPDATE cp
        SET 
            MontoGastado = COALESCE(gastado.MontoTotal, 0),
            FechaActualizacion = GETUTCDATE()
        FROM CategoriasPresupuesto cp
        INNER JOIN Presupuestos p ON cp.PresupuestoId = p.PresupuestoId
        LEFT JOIN (
            SELECT 
                t.CategoriaId,
                cp_inner.PresupuestoId,
                SUM(t.Monto) as MontoTotal
            FROM Transacciones t
            INNER JOIN CategoriasPresupuesto cp_inner ON t.CategoriaId = cp_inner.CategoriaId
            INNER JOIN Presupuestos p_inner ON cp_inner.PresupuestoId = p_inner.PresupuestoId
            WHERE t.TipoTransaccion = 'gasto'
              AND t.UsuarioId = p_inner.UsuarioId
              AND CAST(t.FechaTransaccion AS DATE) BETWEEN p_inner.FechaInicio AND p_inner.FechaFin
              AND (@PresupuestoId IS NULL OR cp_inner.PresupuestoId = @PresupuestoId)
              AND (@CategoriaId IS NULL OR t.CategoriaId = @CategoriaId)
            GROUP BY t.CategoriaId, cp_inner.PresupuestoId
        ) gastado ON cp.CategoriaId = gastado.CategoriaId AND cp.PresupuestoId = gastado.PresupuestoId
        WHERE (@PresupuestoId IS NULL OR cp.PresupuestoId = @PresupuestoId)
          AND (@CategoriaId IS NULL OR cp.CategoriaId = @CategoriaId)
          AND p.EstaActivo = 1;
        
        SET @RegistrosActualizados = @@ROWCOUNT;
        
        SELECT 
            @RegistrosActualizados as RegistrosActualizados,
            'Montos gastados actualizados exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: CategoriasPresupuesto_Redistribuir
-- Descripci�n: Redistribuye el presupuesto total entre categor�as proporcionalmente
-- =============================================
CREATE OR ALTER PROCEDURE CategoriasPresupuesto_Redistribuir
    @PresupuestoId UNIQUEIDENTIFIER,
    @NuevoPresupuestoTotal DECIMAL(18,2) = NULL -- NULL para mantener el total actual
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @PresupuestoActual DECIMAL(18,2);
    DECLARE @TotalAsignado DECIMAL(18,2);
    DECLARE @Factor DECIMAL(10,6);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener presupuesto actual
        SELECT @PresupuestoActual = PresupuestoTotal 
        FROM Presupuestos 
        WHERE PresupuestoId = @PresupuestoId AND EstaActivo = 1;
        
        IF @PresupuestoActual IS NULL
        BEGIN
            RAISERROR('El presupuesto no existe o est� inactivo.', 16, 1);
            RETURN;
        END
        
        -- Usar presupuesto actual si no se especifica uno nuevo
        IF @NuevoPresupuestoTotal IS NULL
            SET @NuevoPresupuestoTotal = @PresupuestoActual;
        
        IF @NuevoPresupuestoTotal <= 0
        BEGIN
            RAISERROR('El nuevo presupuesto total debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Obtener total actualmente asignado
        SELECT @TotalAsignado = COALESCE(SUM(MontoAsignado), 0)
        FROM CategoriasPresupuesto 
        WHERE PresupuestoId = @PresupuestoId;
        
        -- Si no hay nada asignado, no hay nada que redistribuir
        IF @TotalAsignado = 0
        BEGIN
            -- Solo actualizar el presupuesto total si cambi�
            IF @NuevoPresupuestoTotal != @PresupuestoActual
            BEGIN
                UPDATE Presupuestos 
                SET PresupuestoTotal = @NuevoPresupuestoTotal, FechaActualizacion = GETUTCDATE()
                WHERE PresupuestoId = @PresupuestoId;
            END
            
            SELECT 'No hay categor�as asignadas para redistribuir' as Resultado;
            RETURN;
        END
        
        -- Calcular factor de redistribuci�n
        SET @Factor = @NuevoPresupuestoTotal / @TotalAsignado;
        
        -- Redistribuir proporcionalmente
        UPDATE CategoriasPresupuesto 
        SET 
            MontoAsignado = ROUND(MontoAsignado * @Factor, 2),
            FechaActualizacion = GETUTCDATE()
        WHERE PresupuestoId = @PresupuestoId;
        
        -- Actualizar presupuesto total si cambi�
        IF @NuevoPresupuestoTotal != @PresupuestoActual
        BEGIN
            UPDATE Presupuestos 
            SET PresupuestoTotal = @NuevoPresupuestoTotal, FechaActualizacion = GETUTCDATE()
            WHERE PresupuestoId = @PresupuestoId;
        END
        
        COMMIT TRANSACTION;
        
        -- Retornar resumen de la redistribuci�n
        SELECT 
            @PresupuestoActual as PresupuestoAnterior,
            @NuevoPresupuestoTotal as PresupuestoNuevo,
            @TotalAsignado as TotalAnteriorAsignado,
            (SELECT SUM(MontoAsignado) FROM CategoriasPresupuesto WHERE PresupuestoId = @PresupuestoId) as TotalNuevoAsignado,
            @Factor as FactorRedistribucion,
            'Redistribuci�n completada exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla CATEGORIAS PRESUPUESTO creados exitosamente';
PRINT 'SPs creados: CategoriasPresupuesto_Insert, CategoriasPresupuesto_Update, CategoriasPresupuesto_Delete, CategoriasPresupuesto_Select, CategoriasPresupuesto_SelectByPresupuesto, CategoriasPresupuesto_UpdateMontoGastado, CategoriasPresupuesto_Redistribuir';