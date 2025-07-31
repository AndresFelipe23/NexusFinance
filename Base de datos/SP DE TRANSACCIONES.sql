-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla TRANSACCIONES
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: Transacciones_Insert
-- Descripcion: Inserta una nueva transaccion
-- =============================================
CREATE OR ALTER PROCEDURE Transacciones_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @CuentaId UNIQUEIDENTIFIER,
    @CategoriaId UNIQUEIDENTIFIER,
    @Monto DECIMAL(18,2),
    @TipoTransaccion NVARCHAR(20),
    @Descripcion NVARCHAR(500) = NULL,
    @Notas NVARCHAR(1000) = NULL,
    @FechaTransaccion DATETIME2 = NULL,
    @TransaccionRecurrenteId UNIQUEIDENTIFIER = NULL,
    @UrlRecibo NVARCHAR(500) = NULL,
    @EstaConciliado BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TransaccionId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @SaldoAnterior DECIMAL(18,2);
    DECLARE @SaldoNuevo DECIMAL(18,2);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Establecer fecha por defecto si no se proporciona
        IF @FechaTransaccion IS NULL
            SET @FechaTransaccion = GETUTCDATE();
        
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
        
        -- Validar coherencia entre tipo de transacción y categoría
        DECLARE @TipoCategoria NVARCHAR(20);
        SELECT @TipoCategoria = TipoCategoria FROM Categorias WHERE CategoriaId = @CategoriaId;
        
        -- CORRECCIÓN: Incluir validación para transferencias
        IF (@TipoTransaccion = 'ingreso' AND @TipoCategoria != 'ingreso') OR
           (@TipoTransaccion = 'gasto' AND @TipoCategoria != 'gasto') OR
           (@TipoTransaccion = 'transferencia' AND @TipoCategoria != 'transferencia')
        BEGIN
            RAISERROR('El tipo de transacción no coincide con el tipo de categoría.', 16, 1);
            RETURN;
        END
        
        -- Validar transacción recurrente si se especifica
        IF @TransaccionRecurrenteId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM TransaccionesRecurrentes 
                WHERE RecurrenteId = @TransaccionRecurrenteId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La transacción recurrente no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
        END
        
        -- Obtener saldo actual de la cuenta
        SELECT @SaldoAnterior = Saldo FROM Cuentas WHERE CuentaId = @CuentaId;
        
        -- Validar que hay suficiente saldo para gastos (excepto tarjetas de crédito)
        IF @TipoTransaccion = 'gasto'
        BEGIN
            DECLARE @TipoCuenta NVARCHAR(50);
            SELECT @TipoCuenta = TipoCuenta FROM Cuentas WHERE CuentaId = @CuentaId;
            
            IF @TipoCuenta != 'tarjeta_credito' AND @SaldoAnterior < @Monto
            BEGIN
                RAISERROR('Saldo insuficiente para realizar la transacción.', 16, 1);
                RETURN;
            END
        END
        
        -- Insertar transacción
        INSERT INTO Transacciones (
            TransaccionId, UsuarioId, CuentaId, CategoriaId, Monto, 
            TipoTransaccion, Descripcion, Notas, FechaTransaccion,
            TransaccionRecurrenteId, UrlRecibo, EstaConciliado,
            FechaCreacion, FechaActualizacion
        )
        VALUES (
            @TransaccionId, @UsuarioId, @CuentaId, @CategoriaId, @Monto,
            @TipoTransaccion, @Descripcion, @Notas, @FechaTransaccion,
            @TransaccionRecurrenteId, @UrlRecibo, @EstaConciliado,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- El trigger TR_ActualizarSaldoCuenta se encargará de actualizar el saldo automáticamente
        
        COMMIT TRANSACTION;
        
        -- Retornar la transacción creada con información adicional
        SELECT 
            t.TransaccionId, t.UsuarioId, t.CuentaId, c.NombreCuenta,
            t.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, t.Monto, t.TipoTransaccion,
            t.Descripcion, t.Notas, t.FechaTransaccion, t.TransaccionRecurrenteId,
            t.UrlRecibo, t.EstaConciliado, t.FechaCreacion, t.FechaActualizacion,
            c.Saldo as SaldoActualCuenta
        FROM Transacciones t
        INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
        INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
        WHERE t.TransaccionId = @TransaccionId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Transacciones_Update
-- Descripcion: Actualiza una transaccion existente
-- =============================================
CREATE OR ALTER PROCEDURE Transacciones_Update
    @TransaccionId UNIQUEIDENTIFIER,
    @CuentaId UNIQUEIDENTIFIER = NULL,
    @CategoriaId UNIQUEIDENTIFIER = NULL,
    @Monto DECIMAL(18,2) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @Notas NVARCHAR(1000) = NULL,
    @FechaTransaccion DATETIME2 = NULL,
    @UrlRecibo NVARCHAR(500) = NULL,
    @EstaConciliado BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @TipoTransaccion NVARCHAR(20);
    DECLARE @MontoAnterior DECIMAL(18,2);
    DECLARE @CuentaAnterior UNIQUEIDENTIFIER;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la transacción existe y obtener datos
        SELECT @UsuarioId = UsuarioId, @TipoTransaccion = TipoTransaccion, 
               @MontoAnterior = Monto, @CuentaAnterior = CuentaId
        FROM Transacciones 
        WHERE TransaccionId = @TransaccionId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La transacción no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar monto si se está actualizando
        IF @Monto IS NOT NULL AND @Monto <= 0
        BEGIN
            RAISERROR('El monto debe ser mayor a cero.', 16, 1);
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
            
            -- CORRECCIÓN: Incluir validación para transferencias
            IF (@TipoTransaccion = 'ingreso' AND @TipoCategoria != 'ingreso') OR
               (@TipoTransaccion = 'gasto' AND @TipoCategoria != 'gasto') OR
               (@TipoTransaccion = 'transferencia' AND @TipoCategoria != 'transferencia')
            BEGIN
                RAISERROR('El tipo de transacción no coincide con el tipo de categoría.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar saldo si se está cambiando monto o cuenta en un gasto
        IF (@Monto IS NOT NULL OR @CuentaId IS NOT NULL) AND @TipoTransaccion = 'gasto'
        BEGIN
            DECLARE @CuentaFinal UNIQUEIDENTIFIER = ISNULL(@CuentaId, @CuentaAnterior);
            DECLARE @MontoFinal DECIMAL(18,2) = ISNULL(@Monto, @MontoAnterior);
            DECLARE @SaldoActual DECIMAL(18,2);
            DECLARE @TipoCuenta NVARCHAR(50);
            
            SELECT @SaldoActual = Saldo, @TipoCuenta = TipoCuenta 
            FROM Cuentas 
            WHERE CuentaId = @CuentaFinal;
            
            -- Calcular el saldo que tendría la cuenta después del cambio
            DECLARE @SaldoSimulado DECIMAL(18,2) = @SaldoActual + @MontoAnterior - @MontoFinal;
            
            IF @TipoCuenta != 'tarjeta_credito' AND @SaldoSimulado < 0
            BEGIN
                RAISERROR('La actualización resultaría en saldo negativo.', 16, 1);
                RETURN;
            END
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE Transacciones 
        SET 
            CuentaId = ISNULL(@CuentaId, CuentaId),
            CategoriaId = ISNULL(@CategoriaId, CategoriaId),
            Monto = ISNULL(@Monto, Monto),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            Notas = ISNULL(@Notas, Notas),
            FechaTransaccion = ISNULL(@FechaTransaccion, FechaTransaccion),
            UrlRecibo = ISNULL(@UrlRecibo, UrlRecibo),
            EstaConciliado = ISNULL(@EstaConciliado, EstaConciliado),
            FechaActualizacion = GETUTCDATE()
        WHERE TransaccionId = @TransaccionId;
        
        -- El trigger TR_ActualizarSaldoCuenta se encargará de actualizar los saldos automáticamente
        
        COMMIT TRANSACTION;
        
        -- Retornar la transacción actualizada
        SELECT 
            t.TransaccionId, t.UsuarioId, t.CuentaId, c.NombreCuenta,
            t.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, t.Monto, t.TipoTransaccion,
            t.Descripcion, t.Notas, t.FechaTransaccion, t.TransaccionRecurrenteId,
            t.UrlRecibo, t.EstaConciliado, t.FechaCreacion, t.FechaActualizacion,
            c.Saldo as SaldoActualCuenta
        FROM Transacciones t
        INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
        INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
        WHERE t.TransaccionId = @TransaccionId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Transacciones_Delete
-- Descripcion: Elimina una transaccion
-- =============================================
CREATE OR ALTER PROCEDURE Transacciones_Delete
    @TransaccionId UNIQUEIDENTIFIER,
    @ValidarSaldo BIT = 1 -- Validar que no genere saldo negativo al eliminar
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @Monto DECIMAL(18,2);
    DECLARE @TipoTransaccion NVARCHAR(20);
    DECLARE @CuentaId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la transaccion existe y obtener datos
        SELECT @Monto = Monto, @TipoTransaccion = TipoTransaccion, @CuentaId = CuentaId
        FROM Transacciones 
        WHERE TransaccionId = @TransaccionId;
        
        IF @Monto IS NULL
        BEGIN
            RAISERROR('La transaccion no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar saldo resultante si se solicita
        IF @ValidarSaldo = 1 AND @TipoTransaccion = 'ingreso'
        BEGIN
            DECLARE @SaldoActual DECIMAL(18,2);
            DECLARE @TipoCuenta NVARCHAR(50);
            
            SELECT @SaldoActual = Saldo, @TipoCuenta = TipoCuenta 
            FROM Cuentas 
            WHERE CuentaId = @CuentaId;
            
            -- Simular el saldo que quedaria al eliminar la transaccion
            DECLARE @SaldoSimulado DECIMAL(18,2) = @SaldoActual - @Monto;
            
            IF @TipoCuenta != 'tarjeta_credito' AND @SaldoSimulado < 0
            BEGIN
                RAISERROR('No se puede eliminar la transaccion porque resultar�a en saldo negativo.', 16, 1);
                RETURN;
            END
        END
        
        -- Eliminar transaccion (fisicamente)
        DELETE FROM Transacciones WHERE TransaccionId = @TransaccionId;
        
        -- El trigger TR_ActualizarSaldoCuenta se encargara de actualizar el saldo automaticamente
        
        COMMIT TRANSACTION;
        
        SELECT 'transaccion eliminada exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Transacciones_Select
-- Descripcion: Obtiene una transaccion por ID
-- =============================================
CREATE OR ALTER PROCEDURE Transacciones_Select
    @TransaccionId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TransaccionId, t.UsuarioId, t.CuentaId, c.NombreCuenta, c.TipoCuenta,
        t.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Color, cat.Icono as IconoCategoria,
        t.Monto, t.TipoTransaccion, t.Descripcion, t.Notas, t.FechaTransaccion,
        t.TransaccionRecurrenteId, tr.Descripcion as DescripcionRecurrente,
        t.UrlRecibo, t.EstaConciliado, t.FechaCreacion, t.FechaActualizacion,
        c.Saldo as SaldoActualCuenta, c.Moneda
    FROM Transacciones t
    INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
    LEFT JOIN TransaccionesRecurrentes tr ON t.TransaccionRecurrenteId = tr.RecurrenteId
    WHERE t.TransaccionId = @TransaccionId;
END;
GO

-- =============================================
-- SP: Transacciones_SelectByUser
-- Descripcion: Obtiene transacciones de un usuario con filtros y paginacion
-- =============================================
CREATE OR ALTER PROCEDURE Transacciones_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @CuentaId UNIQUEIDENTIFIER = NULL,
    @CategoriaId UNIQUEIDENTIFIER = NULL,
    @TipoTransaccion NVARCHAR(20) = NULL,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @MontoMinimo DECIMAL(18,2) = NULL,
    @MontoMaximo DECIMAL(18,2) = NULL,
    @BusquedaTexto NVARCHAR(500) = NULL,
    @SoloConciliadas BIT = NULL,
    @Pagina INT = 1,
    @TamanoPagina INT = 50,
    @OrdenarPor NVARCHAR(20) = 'fecha_desc' -- 'fecha_desc', 'fecha_asc', 'monto_desc', 'monto_asc'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Pagina - 1) * @TamanoPagina;
    
    -- Obtener registros paginados
    SELECT 
        t.TransaccionId, t.UsuarioId, t.CuentaId, c.NombreCuenta, c.TipoCuenta,
        t.CategoriaId, cat.NombreCategoria, cat.TipoCategoria, cat.Color, cat.Icono as IconoCategoria,
        t.Monto, t.TipoTransaccion, t.Descripcion, t.Notas, t.FechaTransaccion,
        t.TransaccionRecurrenteId, t.UrlRecibo, t.EstaConciliado, 
        t.FechaCreacion, t.FechaActualizacion, c.Moneda
    FROM Transacciones t
    INNER JOIN Cuentas c ON t.CuentaId = c.CuentaId
    INNER JOIN Categorias cat ON t.CategoriaId = cat.CategoriaId
    WHERE t.UsuarioId = @UsuarioId
      AND (@CuentaId IS NULL OR t.CuentaId = @CuentaId)
      AND (@CategoriaId IS NULL OR t.CategoriaId = @CategoriaId)
      AND (@TipoTransaccion IS NULL OR t.TipoTransaccion = @TipoTransaccion)
      AND (@FechaInicio IS NULL OR t.FechaTransaccion >= @FechaInicio)
      AND (@FechaFin IS NULL OR t.FechaTransaccion <= @FechaFin)
      AND (@MontoMinimo IS NULL OR t.Monto >= @MontoMinimo)
      AND (@MontoMaximo IS NULL OR t.Monto <= @MontoMaximo)
      AND (@SoloConciliadas IS NULL OR t.EstaConciliado = @SoloConciliadas)
      AND (@BusquedaTexto IS NULL OR 
           t.Descripcion LIKE '%' + @BusquedaTexto + '%' OR
           t.Notas LIKE '%' + @BusquedaTexto + '%' OR
           cat.NombreCategoria LIKE '%' + @BusquedaTexto + '%')
    ORDER BY 
        CASE @OrdenarPor
            WHEN 'fecha_desc' THEN t.FechaTransaccion
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'fecha_asc' THEN t.FechaTransaccion
            ELSE NULL
        END ASC,
        CASE @OrdenarPor
            WHEN 'monto_desc' THEN t.Monto
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'monto_asc' THEN t.Monto
            ELSE NULL
        END ASC
    OFFSET @Offset ROWS
    FETCH NEXT @TamanoPagina ROWS ONLY;
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla TRANSACCIONES creados exitosamente';
PRINT 'SPs creados: Transacciones_Insert, Transacciones_Update, Transacciones_Delete, Transacciones_Select, Transacciones_SelectByUser';