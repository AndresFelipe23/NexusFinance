-- =============================================
-- Procedimientos Almacenados Básicos para Tabla CUENTAS
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: Cuentas_Insert
-- Descripción: Inserta una nueva cuenta
-- =============================================
CREATE PROCEDURE Cuentas_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @NombreCuenta NVARCHAR(100),
    @TipoCuenta NVARCHAR(50),
    @Saldo DECIMAL(18,2) = 0.00,
    @Moneda NVARCHAR(3) = 'COP',
    @NombreBanco NVARCHAR(100) = NULL,
    @NumeroCuenta NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CuentaId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o está inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @NombreCuenta IS NULL OR LTRIM(RTRIM(@NombreCuenta)) = ''
        BEGIN
            RAISERROR('El nombre de la cuenta es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @TipoCuenta IS NULL OR LTRIM(RTRIM(@TipoCuenta)) = ''
        BEGIN
            RAISERROR('El tipo de cuenta es obligatorio.', 16, 1);
            RETURN;
        END
        
        -- Validar que no exista una cuenta con el mismo nombre para el usuario
        IF EXISTS (SELECT 1 FROM Cuentas WHERE UsuarioId = @UsuarioId AND NombreCuenta = @NombreCuenta AND EstaActivo = 1)
        BEGIN
            RAISERROR('Ya existe una cuenta con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Insertar cuenta
        INSERT INTO Cuentas (
            CuentaId, UsuarioId, NombreCuenta, TipoCuenta, Saldo, 
            Moneda, NombreBanco, NumeroCuenta, EstaActivo, 
            FechaCreacion, FechaActualizacion
        )
        VALUES (
            @CuentaId, @UsuarioId, @NombreCuenta, @TipoCuenta, @Saldo,
            @Moneda, @NombreBanco, @NumeroCuenta, 1,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar la cuenta creada
        SELECT 
            CuentaId, UsuarioId, NombreCuenta, TipoCuenta, Saldo,
            Moneda, NombreBanco, NumeroCuenta, EstaActivo,
            FechaCreacion, FechaActualizacion
        FROM Cuentas 
        WHERE CuentaId = @CuentaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Cuentas_Update
-- Descripción: Actualiza una cuenta existente
-- =============================================
CREATE PROCEDURE Cuentas_Update
    @CuentaId UNIQUEIDENTIFIER,
    @NombreCuenta NVARCHAR(100) = NULL,
    @TipoCuenta NVARCHAR(50) = NULL,
    @Moneda NVARCHAR(3) = NULL,
    @NombreBanco NVARCHAR(100) = NULL,
    @NumeroCuenta NVARCHAR(50) = NULL,
    @EstaActivo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    
    BEGIN TRY
        -- Verificar que la cuenta existe y obtener el usuario
        SELECT @UsuarioId = UsuarioId
        FROM Cuentas 
        WHERE CuentaId = @CuentaId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La cuenta no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar nombre único si se está actualizando
        IF @NombreCuenta IS NOT NULL AND EXISTS (
            SELECT 1 FROM Cuentas 
            WHERE UsuarioId = @UsuarioId 
              AND NombreCuenta = @NombreCuenta 
              AND CuentaId != @CuentaId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe otra cuenta con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE Cuentas 
        SET 
            NombreCuenta = ISNULL(@NombreCuenta, NombreCuenta),
            TipoCuenta = ISNULL(@TipoCuenta, TipoCuenta),
            Moneda = ISNULL(@Moneda, Moneda),
            NombreBanco = ISNULL(@NombreBanco, NombreBanco),
            NumeroCuenta = ISNULL(@NumeroCuenta, NumeroCuenta),
            EstaActivo = ISNULL(@EstaActivo, EstaActivo),
            FechaActualizacion = GETUTCDATE()
        WHERE CuentaId = @CuentaId;
        
        -- Retornar la cuenta actualizada
        SELECT 
            CuentaId, UsuarioId, NombreCuenta, TipoCuenta, Saldo,
            Moneda, NombreBanco, NumeroCuenta, EstaActivo,
            FechaCreacion, FechaActualizacion
        FROM Cuentas 
        WHERE CuentaId = @CuentaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Cuentas_Delete
-- Descripción: Elimina (desactiva) una cuenta
-- =============================================
CREATE PROCEDURE Cuentas_Delete
    @CuentaId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Soft delete, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la cuenta existe
        IF NOT EXISTS (SELECT 1 FROM Cuentas WHERE CuentaId = @CuentaId)
        BEGIN
            RAISERROR('La cuenta no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene transacciones asociadas
        IF EXISTS (SELECT 1 FROM Transacciones WHERE CuentaId = @CuentaId)
        BEGIN
            IF @EliminacionFisica = 1
            BEGIN
                RAISERROR('No se puede eliminar físicamente la cuenta porque tiene transacciones asociadas.', 16, 1);
                RETURN;
            END
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminación física
            DELETE FROM Cuentas WHERE CuentaId = @CuentaId;
            
            SELECT 'Cuenta eliminada físicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Eliminación lógica (soft delete)
            UPDATE Cuentas 
            SET 
                EstaActivo = 0,
                FechaActualizacion = GETUTCDATE()
            WHERE CuentaId = @CuentaId;
            
            SELECT 'Cuenta desactivada' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Cuentas_Select
-- Descripción: Obtiene una cuenta por ID
-- =============================================
CREATE PROCEDURE Cuentas_Select
    @CuentaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CuentaId, UsuarioId, NombreCuenta, TipoCuenta, Saldo,
        Moneda, NombreBanco, NumeroCuenta, EstaActivo,
        FechaCreacion, FechaActualizacion
    FROM Cuentas 
    WHERE CuentaId = @CuentaId;
END;
GO

-- =============================================
-- SP: Cuentas_SelectByUser
-- Descripción: Obtiene todas las cuentas de un usuario
-- =============================================
CREATE PROCEDURE Cuentas_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @SoloActivas BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CuentaId, UsuarioId, NombreCuenta, TipoCuenta, Saldo,
        Moneda, NombreBanco, NumeroCuenta, EstaActivo,
        FechaCreacion, FechaActualizacion
    FROM Cuentas 
    WHERE UsuarioId = @UsuarioId
      AND (@SoloActivas = 0 OR EstaActivo = 1)
    ORDER BY NombreCuenta;
END;
GO

PRINT 'Procedimientos almacenados básicos para tabla CUENTAS creados exitosamente';
PRINT 'SPs creados: Cuentas_Insert, Cuentas_Update, Cuentas_Delete, Cuentas_Select, Cuentas_SelectByUser';