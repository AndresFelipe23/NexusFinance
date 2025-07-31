-- =============================================
-- Actualizar SP de Transacciones Recurrentes
-- Cambiar parámetros de DATE a DATETIME2
-- =============================================

-- =============================================
-- SP: TransaccionesRecurrentes_Insert
-- =============================================
CREATE OR ALTER PROCEDURE TransaccionesRecurrentes_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @CuentaId UNIQUEIDENTIFIER,
    @CategoriaId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2),
    @TipoTransaccion NVARCHAR(20),
    @Descripcion NVARCHAR(500),
    @Frecuencia NVARCHAR(20),
    @FechaInicio DATETIME2,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RecurrenteId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ProximaFechaEjecucion DATETIME2;
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o está inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar que la cuenta existe y pertenece al usuario
        IF NOT EXISTS (
            SELECT 1 FROM Cuentas 
            WHERE CuentaId = @CuentaId 
              AND UsuarioId = @UsuarioId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('La cuenta no existe o no pertenece al usuario.', 16, 1);
            RETURN;
        END
        
        -- Validar que la categoría existe y pertenece al usuario
        IF NOT EXISTS (
            SELECT 1 FROM Categorias 
            WHERE CategoriaId = @CategoriaId 
              AND UsuarioId = @UsuarioId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('La categoría no existe o no pertenece al usuario.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @Monto <= 0
        BEGIN
            RAISERROR('El monto debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        IF @TipoTransaccion NOT IN ('ingreso', 'gasto', 'transferencia')
        BEGIN
            RAISERROR('El tipo de transacción debe ser "ingreso", "gasto" o "transferencia".', 16, 1);
            RETURN;
        END
        
        IF @Frecuencia NOT IN ('diario', 'semanal', 'mensual', 'anual')
        BEGIN
            RAISERROR('La frecuencia debe ser "diario", "semanal", "mensual" o "anual".', 16, 1);
            RETURN;
        END
        
        -- Validar tipo de categoría
        DECLARE @TipoCategoria NVARCHAR(20);
        SELECT @TipoCategoria = TipoCategoria FROM Categorias WHERE CategoriaId = @CategoriaId;
        
        IF (@TipoTransaccion = 'ingreso' AND @TipoCategoria != 'ingreso') OR
           (@TipoTransaccion = 'gasto' AND @TipoCategoria != 'gasto') OR
           (@TipoTransaccion = 'transferencia' AND @TipoCategoria != 'transferencia')
        BEGIN
            RAISERROR('El tipo de transacción no coincide con el tipo de categoría.', 16, 1);
            RETURN;
        END
        
        -- Validar fechas
        IF @FechaInicio < CAST(GETDATE() AS DATE)
        BEGIN
            RAISERROR('La fecha de inicio no puede ser anterior a hoy.', 16, 1);
            RETURN;
        END
        
        IF @FechaFin IS NOT NULL AND @FechaFin <= @FechaInicio
        BEGIN
            RAISERROR('La fecha de fin debe ser posterior a la fecha de inicio.', 16, 1);
            RETURN;
        END
        
        -- Calcular próxima fecha de ejecución
        SET @ProximaFechaEjecucion = @FechaInicio;
        
        -- Insertar transacción recurrente
        INSERT INTO TransaccionesRecurrentes (
            RecurrenteId, UsuarioId, CuentaId, CategoriaId, Monto, 
            TipoTransaccion, Descripcion, Frecuencia, FechaInicio, 
            FechaFin, ProximaFechaEjecucion, EstaActivo, 
            FechaCreacion, FechaActualizacion
        )
        VALUES (
            @RecurrenteId, @UsuarioId, @CuentaId, @CategoriaId, @Monto,
            @TipoTransaccion, @Descripcion, @Frecuencia, @FechaInicio,
            @FechaFin, @ProximaFechaEjecucion, 1,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar la transacción recurrente creada
        SELECT 
            tr.RecurrenteId, tr.UsuarioId, tr.CuentaId, c.NombreCuenta,
            tr.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Icono as IconoCategoria, cat.Color,
            tr.Monto, tr.TipoTransaccion, tr.Descripcion, tr.Frecuencia, tr.FechaInicio, tr.FechaFin,
            tr.ProximaFechaEjecucion, tr.EstaActivo, tr.FechaCreacion, tr.FechaActualizacion
        FROM TransaccionesRecurrentes tr
        INNER JOIN Cuentas c ON tr.CuentaId = c.CuentaId
        INNER JOIN Categorias cat ON tr.CategoriaId = cat.CategoriaId
        WHERE tr.RecurrenteId = @RecurrenteId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: TransaccionesRecurrentes_Update
-- =============================================
CREATE OR ALTER PROCEDURE TransaccionesRecurrentes_Update
    @RecurrenteId UNIQUEIDENTIFIER,
    @CuentaId UNIQUEIDENTIFIER = NULL,
    @CategoriaId UNIQUEIDENTIFIER = NULL,
    @Monto DECIMAL(18,2) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @Frecuencia NVARCHAR(20) = NULL,
    @FechaFin DATETIME2 = NULL,
    @EstaActivo BIT = NULL,
    @RemoverFechaFin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @TipoTransaccion NVARCHAR(20);
    DECLARE @FechaInicio DATETIME2;
    
    BEGIN TRY
        -- Verificar que la transacción recurrente existe
        SELECT @UsuarioId = UsuarioId, @TipoTransaccion = TipoTransaccion, @FechaInicio = FechaInicio
        FROM TransaccionesRecurrentes 
        WHERE RecurrenteId = @RecurrenteId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La transacción recurrente no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar monto si se está actualizando
        IF @Monto IS NOT NULL AND @Monto <= 0
        BEGIN
            RAISERROR('El monto debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar frecuencia si se está actualizando
        IF @Frecuencia IS NOT NULL AND @Frecuencia NOT IN ('diario', 'semanal', 'mensual', 'anual')
        BEGIN
            RAISERROR('La frecuencia debe ser "diario", "semanal", "mensual" o "anual".', 16, 1);
            RETURN;
        END
        
        -- Validar cuenta si se está actualizando
        IF @CuentaId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Cuentas 
                WHERE CuentaId = @CuentaId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La cuenta no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar categoría si se está actualizando
        IF @CategoriaId IS NOT NULL
        BEGIN
            DECLARE @TipoCategoria NVARCHAR(20);
            SELECT @TipoCategoria = TipoCategoria 
            FROM Categorias 
            WHERE CategoriaId = @CategoriaId 
              AND UsuarioId = @UsuarioId 
              AND EstaActivo = 1;
            
            IF @TipoCategoria IS NULL
            BEGIN
                RAISERROR('La categoría no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
            
            IF (@TipoTransaccion = 'ingreso' AND @TipoCategoria != 'ingreso') OR
               (@TipoTransaccion = 'gasto' AND @TipoCategoria != 'gasto') OR
               (@TipoTransaccion = 'transferencia' AND @TipoCategoria != 'transferencia')
            BEGIN
                RAISERROR('El tipo de transacción no coincide con el tipo de categoría.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar fecha fin si se está actualizando
        IF @FechaFin IS NOT NULL AND @FechaFin <= @FechaInicio
        BEGIN
            RAISERROR('La fecha de fin debe ser posterior a la fecha de inicio.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE TransaccionesRecurrentes 
        SET 
            CuentaId = ISNULL(@CuentaId, CuentaId),
            CategoriaId = ISNULL(@CategoriaId, CategoriaId),
            Monto = ISNULL(@Monto, Monto),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            Frecuencia = ISNULL(@Frecuencia, Frecuencia),
            FechaFin = CASE 
                WHEN @RemoverFechaFin = 1 THEN NULL
                WHEN @FechaFin IS NOT NULL THEN @FechaFin
                ELSE FechaFin 
            END,
            EstaActivo = ISNULL(@EstaActivo, EstaActivo),
            FechaActualizacion = GETUTCDATE()
        WHERE RecurrenteId = @RecurrenteId;
        
        -- Retornar la transacción recurrente actualizada
        SELECT 
            tr.RecurrenteId, tr.UsuarioId, tr.CuentaId, c.NombreCuenta,
            tr.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Icono as IconoCategoria, cat.Color,
            tr.Monto, tr.TipoTransaccion, tr.Descripcion, tr.Frecuencia, tr.FechaInicio, tr.FechaFin,
            tr.ProximaFechaEjecucion, tr.EstaActivo, tr.FechaCreacion, tr.FechaActualizacion
        FROM TransaccionesRecurrentes tr
        INNER JOIN Cuentas c ON tr.CuentaId = c.CuentaId
        INNER JOIN Categorias cat ON tr.CategoriaId = cat.CategoriaId
        WHERE tr.RecurrenteId = @RecurrenteId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: TransaccionesRecurrentes_Delete
-- =============================================
CREATE OR ALTER PROCEDURE TransaccionesRecurrentes_Delete
    @RecurrenteId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la transacción recurrente existe
        IF NOT EXISTS (SELECT 1 FROM TransaccionesRecurrentes WHERE RecurrenteId = @RecurrenteId)
        BEGIN
            RAISERROR('La transacción recurrente no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene transacciones generadas asociadas
        IF EXISTS (SELECT 1 FROM Transacciones WHERE TransaccionRecurrenteId = @RecurrenteId)
        BEGIN
            IF @EliminacionFisica = 1
            BEGIN
                RAISERROR('No se puede eliminar físicamente la transacción recurrente porque tiene transacciones generadas.', 16, 1);
                RETURN;
            END
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            DELETE FROM TransaccionesRecurrentes WHERE RecurrenteId = @RecurrenteId;
            SELECT 'Transacción recurrente eliminada físicamente' as Resultado;
        END
        ELSE
        BEGIN
            UPDATE TransaccionesRecurrentes 
            SET 
                EstaActivo = 0,
                FechaActualizacion = GETUTCDATE()
            WHERE RecurrenteId = @RecurrenteId;
            
            SELECT 'Transacción recurrente desactivada' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: TransaccionesRecurrentes_Select
-- =============================================
CREATE OR ALTER PROCEDURE TransaccionesRecurrentes_Select
    @RecurrenteId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tr.RecurrenteId, tr.UsuarioId, tr.CuentaId, c.NombreCuenta,
        tr.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Icono as IconoCategoria, cat.Color,
        tr.Monto, tr.TipoTransaccion, tr.Descripcion, tr.Frecuencia, tr.FechaInicio, tr.FechaFin,
        tr.ProximaFechaEjecucion, 
        DATEDIFF(DAY, GETDATE(), tr.ProximaFechaEjecucion) as DiasParaProximaEjecucion,
        tr.EstaActivo, tr.FechaCreacion, tr.FechaActualizacion,
        (SELECT COUNT(*) FROM Transacciones WHERE TransaccionRecurrenteId = tr.RecurrenteId) as TotalTransaccionesGeneradas
    FROM TransaccionesRecurrentes tr
    INNER JOIN Cuentas c ON tr.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON tr.CategoriaId = cat.CategoriaId
    WHERE tr.RecurrenteId = @RecurrenteId;
END;
GO

-- =============================================
-- SP: TransaccionesRecurrentes_SelectByUser
-- =============================================
CREATE OR ALTER PROCEDURE TransaccionesRecurrentes_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @TipoTransaccion NVARCHAR(20) = NULL,
    @Frecuencia NVARCHAR(20) = NULL,
    @SoloActivas BIT = 1,
    @SoloPendientes BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tr.RecurrenteId, tr.UsuarioId, tr.CuentaId, c.NombreCuenta,
        tr.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Icono as IconoCategoria, cat.Color,
        tr.Monto, tr.TipoTransaccion, tr.Descripcion, tr.Frecuencia, tr.FechaInicio, tr.FechaFin,
        tr.ProximaFechaEjecucion, 
        DATEDIFF(DAY, GETDATE(), tr.ProximaFechaEjecucion) as DiasParaProximaEjecucion,
        tr.EstaActivo, tr.FechaCreacion, tr.FechaActualizacion,
        (SELECT COUNT(*) FROM Transacciones WHERE TransaccionRecurrenteId = tr.RecurrenteId) as TotalTransaccionesGeneradas,
        CASE 
            WHEN tr.FechaFin IS NOT NULL AND tr.FechaFin < CAST(GETDATE() AS DATE) THEN 'Finalizada'
            WHEN tr.ProximaFechaEjecucion <= CAST(GETDATE() AS DATE) THEN 'Pendiente'
            WHEN tr.ProximaFechaEjecucion > CAST(GETDATE() AS DATE) THEN 'Programada'
            ELSE 'Indefinido'
        END as EstadoTransaccion
    FROM TransaccionesRecurrentes tr
    INNER JOIN Cuentas c ON tr.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON tr.CategoriaId = cat.CategoriaId
    WHERE tr.UsuarioId = @UsuarioId
      AND (@TipoTransaccion IS NULL OR tr.TipoTransaccion = @TipoTransaccion)
      AND (@Frecuencia IS NULL OR tr.Frecuencia = @Frecuencia)
      AND (@SoloActivas = 0 OR tr.EstaActivo = 1)
      AND (@SoloPendientes = 0 OR (tr.ProximaFechaEjecucion <= CAST(GETDATE() AS DATE) AND tr.EstaActivo = 1))
    ORDER BY tr.ProximaFechaEjecucion ASC, tr.FechaCreacion DESC;
END;
GO

PRINT 'SPs de Transacciones Recurrentes actualizados exitosamente'; 