-- =============================================
-- Stored Procedures para Transferencias
-- =============================================

-- =============================================
-- Transferencia_Insert
-- =============================================
CREATE OR ALTER PROCEDURE Transferencia_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @CuentaOrigenId UNIQUEIDENTIFIER,
    @CuentaDestinoId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2),
    @ComisionTransferencia DECIMAL(18,2) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @FechaTransferencia DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que las cuentas existan y pertenezcan al usuario
        IF NOT EXISTS (SELECT 1 FROM Cuentas WHERE CuentaId = @CuentaOrigenId AND UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR ('La cuenta de origen no existe o no está activa', 16, 1);
            RETURN;
        END
        
        IF NOT EXISTS (SELECT 1 FROM Cuentas WHERE CuentaId = @CuentaDestinoId AND UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR ('La cuenta de destino no existe o no está activa', 16, 1);
            RETURN;
        END
        
        -- Validar que no sea la misma cuenta
        IF @CuentaOrigenId = @CuentaDestinoId
        BEGIN
            RAISERROR ('No se puede transferir a la misma cuenta', 16, 1);
            RETURN;
        END
        
        -- Validar que la cuenta origen tenga saldo suficiente
        DECLARE @SaldoOrigen DECIMAL(18,2);
        SELECT @SaldoOrigen = Saldo FROM Cuentas WHERE CuentaId = @CuentaOrigenId;
        
        IF @SaldoOrigen < @Monto
        BEGIN
            RAISERROR ('Saldo insuficiente en la cuenta de origen', 16, 1);
            RETURN;
        END
        
        -- Crear la transferencia
        DECLARE @TransferenciaId UNIQUEIDENTIFIER = NEWID();
        
        INSERT INTO Transferencias (
            TransferenciaId,
            UsuarioId,
            CuentaOrigenId,
            CuentaDestinoId,
            Monto,
            ComisionTransferencia,
            Descripcion,
            FechaTransferencia,
            FechaCreacion
        ) VALUES (
            @TransferenciaId,
            @UsuarioId,
            @CuentaOrigenId,
            @CuentaDestinoId,
            @Monto,
            @ComisionTransferencia,
            @Descripcion,
            @FechaTransferencia,
            GETDATE()
        );
        
        -- Actualizar saldos de las cuentas
        UPDATE Cuentas 
        SET Saldo = Saldo - @Monto 
        WHERE CuentaId = @CuentaOrigenId;
        
        UPDATE Cuentas 
        SET Saldo = Saldo + @Monto 
        WHERE CuentaId = @CuentaDestinoId;
        
        -- Retornar la transferencia creada
        SELECT 
            t.TransferenciaId,
            t.UsuarioId,
            t.CuentaOrigenId,
            co.NombreCuenta AS NombreCuentaOrigen,
            t.CuentaDestinoId,
            cd.NombreCuenta AS NombreCuentaDestino,
            t.Monto,
            t.ComisionTransferencia,
            t.Descripcion,
            t.FechaTransferencia,
            t.FechaCreacion
        FROM Transferencias t
        INNER JOIN Cuentas co ON t.CuentaOrigenId = co.CuentaId
        INNER JOIN Cuentas cd ON t.CuentaDestinoId = cd.CuentaId
        WHERE t.TransferenciaId = @TransferenciaId;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- =============================================
-- Transferencias_ObtenerPorUsuario
-- =============================================
CREATE OR ALTER PROCEDURE Transferencias_ObtenerPorUsuario
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TransferenciaId,
        t.UsuarioId,
        t.CuentaOrigenId,
        co.NombreCuenta AS NombreCuentaOrigen,
        co.TipoCuenta AS TipoCuentaOrigen,
        co.NombreBanco AS BancoCuentaOrigen,
        t.CuentaDestinoId,
        cd.NombreCuenta AS NombreCuentaDestino,
        cd.TipoCuenta AS TipoCuentaDestino,
        cd.NombreBanco AS BancoCuentaDestino,
        t.Monto,
        t.ComisionTransferencia,
        t.Descripcion,
        t.FechaTransferencia,
        t.FechaCreacion,
        (t.Monto + ISNULL(t.ComisionTransferencia, 0)) AS MontoTotal
    FROM Transferencias t
    INNER JOIN Cuentas co ON t.CuentaOrigenId = co.CuentaId
    INNER JOIN Cuentas cd ON t.CuentaDestinoId = cd.CuentaId
    WHERE t.UsuarioId = @UsuarioId
    ORDER BY t.FechaTransferencia DESC;
END
GO

-- =============================================
-- Transferencia_ObtenerPorId
-- =============================================
CREATE OR ALTER PROCEDURE Transferencia_ObtenerPorId
    @TransferenciaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TransferenciaId,
        t.UsuarioId,
        t.CuentaOrigenId,
        co.NombreCuenta AS NombreCuentaOrigen,
        co.TipoCuenta AS TipoCuentaOrigen,
        co.NombreBanco AS BancoCuentaOrigen,
        co.Saldo AS SaldoCuentaOrigen,
        t.CuentaDestinoId,
        cd.NombreCuenta AS NombreCuentaDestino,
        cd.TipoCuenta AS TipoCuentaDestino,
        cd.NombreBanco AS BancoCuentaDestino,
        cd.Saldo AS SaldoCuentaDestino,
        t.Monto,
        t.ComisionTransferencia,
        t.Descripcion,
        t.FechaTransferencia,
        t.FechaCreacion,
        (t.Monto + ISNULL(t.ComisionTransferencia, 0)) AS MontoTotal
    FROM Transferencias t
    INNER JOIN Cuentas co ON t.CuentaOrigenId = co.CuentaId
    INNER JOIN Cuentas cd ON t.CuentaDestinoId = cd.CuentaId
    WHERE t.TransferenciaId = @TransferenciaId;
END
GO

-- =============================================
-- Transferencia_Actualizar
-- =============================================
CREATE OR ALTER PROCEDURE Transferencia_Actualizar
    @TransferenciaId UNIQUEIDENTIFIER,
    @CuentaOrigenId UNIQUEIDENTIFIER = NULL,
    @CuentaDestinoId UNIQUEIDENTIFIER = NULL,
    @Monto DECIMAL(18,2) = NULL,
    @ComisionTransferencia DECIMAL(18,2) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @FechaTransferencia DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la transferencia existe
        IF NOT EXISTS (SELECT 1 FROM Transferencias WHERE TransferenciaId = @TransferenciaId)
        BEGIN
            RAISERROR ('La transferencia no existe', 16, 1);
            RETURN;
        END
        
        -- Obtener datos actuales de la transferencia
        DECLARE @UsuarioId UNIQUEIDENTIFIER;
        DECLARE @CuentaOrigenActual UNIQUEIDENTIFIER;
        DECLARE @CuentaDestinoActual UNIQUEIDENTIFIER;
        DECLARE @MontoActual DECIMAL(18,2);
        
        SELECT 
            @UsuarioId = UsuarioId,
            @CuentaOrigenActual = CuentaOrigenId,
            @CuentaDestinoActual = CuentaDestinoId,
            @MontoActual = Monto
        FROM Transferencias 
        WHERE TransferenciaId = @TransferenciaId;
        
        -- Si se va a cambiar el monto o las cuentas, revertir la transferencia anterior
        IF (@Monto IS NOT NULL AND @Monto != @MontoActual) OR 
           (@CuentaOrigenId IS NOT NULL AND @CuentaOrigenId != @CuentaOrigenActual) OR
           (@CuentaDestinoId IS NOT NULL AND @CuentaDestinoId != @CuentaDestinoActual)
        BEGIN
            -- Revertir saldos de la transferencia actual
            UPDATE Cuentas 
            SET Saldo = Saldo + @MontoActual 
            WHERE CuentaId = @CuentaOrigenActual;
            
            UPDATE Cuentas 
            SET Saldo = Saldo - @MontoActual 
            WHERE CuentaId = @CuentaDestinoActual;
            
            -- Validar nuevas cuentas si se van a cambiar
            IF @CuentaOrigenId IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM Cuentas WHERE CuentaId = @CuentaOrigenId AND UsuarioId = @UsuarioId AND EstaActivo = 1)
                BEGIN
                    RAISERROR ('La nueva cuenta de origen no existe o no está activa', 16, 1);
                    RETURN;
                END
            END
            
            IF @CuentaDestinoId IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM Cuentas WHERE CuentaId = @CuentaDestinoId AND UsuarioId = @UsuarioId AND EstaActivo = 1)
                BEGIN
                    RAISERROR ('La nueva cuenta de destino no existe o no está activa', 16, 1);
                    RETURN;
                END
            END
            
            -- Validar saldo suficiente si se cambia el monto
            IF @Monto IS NOT NULL AND @Monto > @MontoActual
            BEGIN
                DECLARE @CuentaOrigenTemp UNIQUEIDENTIFIER = ISNULL(@CuentaOrigenId, @CuentaOrigenActual);
                DECLARE @SaldoOrigen DECIMAL(18,2);
                
                SELECT @SaldoOrigen = Saldo FROM Cuentas WHERE CuentaId = @CuentaOrigenTemp;
                
                IF @SaldoOrigen < (@Monto - @MontoActual)
                BEGIN
                    RAISERROR ('Saldo insuficiente para el nuevo monto', 16, 1);
                    RETURN;
                END
            END
            
            -- Aplicar nueva transferencia
            DECLARE @CuentaOrigenFinal UNIQUEIDENTIFIER = ISNULL(@CuentaOrigenId, @CuentaOrigenActual);
            DECLARE @CuentaDestinoFinal UNIQUEIDENTIFIER = ISNULL(@CuentaDestinoId, @CuentaDestinoActual);
            DECLARE @MontoFinal DECIMAL(18,2) = ISNULL(@Monto, @MontoActual);
            
            UPDATE Cuentas 
            SET Saldo = Saldo - @MontoFinal 
            WHERE CuentaId = @CuentaOrigenFinal;
            
            UPDATE Cuentas 
            SET Saldo = Saldo + @MontoFinal 
            WHERE CuentaId = @CuentaDestinoFinal;
        END
        
        -- Actualizar la transferencia
        UPDATE Transferencias SET
            CuentaOrigenId = ISNULL(@CuentaOrigenId, CuentaOrigenId),
            CuentaDestinoId = ISNULL(@CuentaDestinoId, CuentaDestinoId),
            Monto = ISNULL(@Monto, Monto),
            ComisionTransferencia = @ComisionTransferencia,
            Descripcion = @Descripcion,
            FechaTransferencia = ISNULL(@FechaTransferencia, FechaTransferencia)
        WHERE TransferenciaId = @TransferenciaId;
        
        -- Retornar la transferencia actualizada
        SELECT 
            t.TransferenciaId,
            t.UsuarioId,
            t.CuentaOrigenId,
            co.NombreCuenta AS NombreCuentaOrigen,
            t.CuentaDestinoId,
            cd.NombreCuenta AS NombreCuentaDestino,
            t.Monto,
            t.ComisionTransferencia,
            t.Descripcion,
            t.FechaTransferencia,
            t.FechaCreacion
        FROM Transferencias t
        INNER JOIN Cuentas co ON t.CuentaOrigenId = co.CuentaId
        INNER JOIN Cuentas cd ON t.CuentaDestinoId = cd.CuentaId
        WHERE t.TransferenciaId = @TransferenciaId;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- =============================================
-- Transferencia_Eliminar
-- =============================================
CREATE OR ALTER PROCEDURE Transferencia_Eliminar
    @TransferenciaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la transferencia existe
        IF NOT EXISTS (SELECT 1 FROM Transferencias WHERE TransferenciaId = @TransferenciaId)
        BEGIN
            RAISERROR ('La transferencia no existe', 16, 1);
            RETURN;
        END
        
        -- Obtener datos de la transferencia para revertir
        DECLARE @CuentaOrigenId UNIQUEIDENTIFIER;
        DECLARE @CuentaDestinoId UNIQUEIDENTIFIER;
        DECLARE @Monto DECIMAL(18,2);
        
        SELECT 
            @CuentaOrigenId = CuentaOrigenId,
            @CuentaDestinoId = CuentaDestinoId,
            @Monto = Monto
        FROM Transferencias 
        WHERE TransferenciaId = @TransferenciaId;
        
        -- Revertir los saldos
        UPDATE Cuentas 
        SET Saldo = Saldo + @Monto 
        WHERE CuentaId = @CuentaOrigenId;
        
        UPDATE Cuentas 
        SET Saldo = Saldo - @Monto 
        WHERE CuentaId = @CuentaDestinoId;
        
        -- Eliminar la transferencia
        DELETE FROM Transferencias WHERE TransferenciaId = @TransferenciaId;
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- =============================================
-- Transferencias_ObtenerEstadisticas
-- =============================================
CREATE OR ALTER PROCEDURE Transferencias_ObtenerEstadisticas
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @FechaInicio IS NULL
        SET @FechaInicio = DATEADD(MONTH, -1, GETDATE());
    
    IF @FechaFin IS NULL
        SET @FechaFin = GETDATE();
    
    SELECT 
        COUNT(*) AS TotalTransferencias,
        SUM(Monto) AS MontoTotalTransferido,
        SUM(ISNULL(ComisionTransferencia, 0)) AS TotalComisiones,
        AVG(Monto) AS MontoPromedio,
        MIN(FechaTransferencia) AS PrimeraTransferencia,
        MAX(FechaTransferencia) AS UltimaTransferencia
    FROM Transferencias 
    WHERE UsuarioId = @UsuarioId 
    AND FechaTransferencia BETWEEN @FechaInicio AND @FechaFin;
END
GO

-- =============================================
-- Transferencias_ObtenerPorPeriodo
-- =============================================
CREATE OR ALTER PROCEDURE Transferencias_ObtenerPorPeriodo
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaInicio DATETIME,
    @FechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TransferenciaId,
        t.UsuarioId,
        t.CuentaOrigenId,
        co.NombreCuenta AS NombreCuentaOrigen,
        co.TipoCuenta AS TipoCuentaOrigen,
        co.NombreBanco AS BancoCuentaOrigen,
        t.CuentaDestinoId,
        cd.NombreCuenta AS NombreCuentaDestino,
        cd.TipoCuenta AS TipoCuentaDestino,
        cd.NombreBanco AS BancoCuentaDestino,
        t.Monto,
        t.ComisionTransferencia,
        t.Descripcion,
        t.FechaTransferencia,
        t.FechaCreacion,
        (t.Monto + ISNULL(t.ComisionTransferencia, 0)) AS MontoTotal
    FROM Transferencias t
    INNER JOIN Cuentas co ON t.CuentaOrigenId = co.CuentaId
    INNER JOIN Cuentas cd ON t.CuentaDestinoId = cd.CuentaId
    WHERE t.UsuarioId = @UsuarioId
    AND t.FechaTransferencia BETWEEN @FechaInicio AND @FechaFin
    ORDER BY t.FechaTransferencia DESC;
END
GO

PRINT 'Stored Procedures de Transferencias creados exitosamente.' 