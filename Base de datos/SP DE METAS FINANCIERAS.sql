-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla METAS FINANCIERAS
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: MetasFinancieras_Insert
-- Descripci�n: Inserta una nueva meta financiera
-- =============================================
CREATE PROCEDURE MetasFinancieras_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @NombreMeta NVARCHAR(100),
    @Descripcion NVARCHAR(500) = NULL,
    @MontoObjetivo DECIMAL(18,2),
    @MontoActual DECIMAL(18,2) = 0.00,
    @FechaObjetivo DATETIME2 = NULL,
    @TipoMeta NVARCHAR(50),
    @CuentaId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @MetaId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o est� inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @NombreMeta IS NULL OR LTRIM(RTRIM(@NombreMeta)) = ''
        BEGIN
            RAISERROR('El nombre de la meta es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @MontoObjetivo <= 0
        BEGIN
            RAISERROR('El monto objetivo debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        IF @TipoMeta NOT IN ('ahorro', 'pago_deuda', 'inversion')
        BEGIN
            RAISERROR('El tipo de meta debe ser "ahorro", "pago_deuda" o "inversion".', 16, 1);
            RETURN;
        END
        
        -- Validar cuenta asociada si se especifica
        IF @CuentaId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Cuentas 
                WHERE CuentaId = @CuentaId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La cuenta asociada no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar que no exista una meta con el mismo nombre para el usuario
        IF EXISTS (
            SELECT 1 FROM MetasFinancieras 
            WHERE UsuarioId = @UsuarioId 
              AND NombreMeta = @NombreMeta 
              AND EstaCompletada = 0
        )
        BEGIN
            RAISERROR('Ya existe una meta activa con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Validar monto actual
        IF @MontoActual < 0 OR @MontoActual > @MontoObjetivo
        BEGIN
            RAISERROR('El monto actual debe estar entre 0 y el monto objetivo.', 16, 1);
            RETURN;
        END
        
        -- Insertar meta financiera
        INSERT INTO MetasFinancieras (
            MetaId, UsuarioId, NombreMeta, Descripcion, MontoObjetivo, 
            MontoActual, FechaObjetivo, TipoMeta, CuentaId, EstaCompletada,
            FechaComplecion, FechaCreacion, FechaActualizacion
        )
        VALUES (
            @MetaId, @UsuarioId, @NombreMeta, @Descripcion, @MontoObjetivo,
            @MontoActual, @FechaObjetivo, @TipoMeta, @CuentaId, 
            CASE WHEN @MontoActual >= @MontoObjetivo THEN 1 ELSE 0 END,
            CASE WHEN @MontoActual >= @MontoObjetivo THEN GETUTCDATE() ELSE NULL END,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar la meta creada con informaci�n adicional
        SELECT 
            mf.MetaId, mf.UsuarioId, mf.NombreMeta, mf.Descripcion,
            mf.MontoObjetivo, mf.MontoActual, 
            CASE 
                WHEN mf.MontoObjetivo > 0 
                THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeCompletado,
            mf.FechaObjetivo, mf.TipoMeta, mf.CuentaId, c.NombreCuenta,
            mf.EstaCompletada, mf.FechaComplecion, mf.FechaCreacion, mf.FechaActualizacion
        FROM MetasFinancieras mf
        LEFT JOIN Cuentas c ON mf.CuentaId = c.CuentaId
        WHERE mf.MetaId = @MetaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: MetasFinancieras_Update
-- Descripci�n: Actualiza una meta financiera existente
-- =============================================
CREATE PROCEDURE MetasFinancieras_Update
    @MetaId UNIQUEIDENTIFIER,
    @NombreMeta NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @MontoObjetivo DECIMAL(18,2) = NULL,
    @MontoActual DECIMAL(18,2) = NULL,
    @FechaObjetivo DATETIME2 = NULL,
    @CuentaId UNIQUEIDENTIFIER = NULL,
    @EstaCompletada BIT = NULL,
    @FechaComplecion DATETIME2 = NULL,
    @RemoverCuenta BIT = 0, -- Flag para quitar la cuenta asociada
    @RemoverFechaObjetivo BIT = 0 -- Flag para quitar la fecha objetivo
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @MontoActualActual DECIMAL(18,2);
    DECLARE @EstaCompletadaActual BIT;
    
    BEGIN TRY
        -- Verificar que la meta existe y obtener datos
        SELECT @UsuarioId = UsuarioId, @MontoActualActual = MontoActual, @EstaCompletadaActual = EstaCompletada
        FROM MetasFinancieras 
        WHERE MetaId = @MetaId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La meta financiera no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar monto objetivo si se est� actualizando
        IF @MontoObjetivo IS NOT NULL AND @MontoObjetivo <= 0
        BEGIN
            RAISERROR('El monto objetivo debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar que el monto actual no sea mayor al nuevo objetivo
        IF @MontoObjetivo IS NOT NULL AND @MontoActualActual > @MontoObjetivo
        BEGIN
            RAISERROR('El monto objetivo no puede ser menor al monto actual de la meta.', 16, 1);
            RETURN;
        END
        
        -- Validar monto actual si se está actualizando
        IF @MontoActual IS NOT NULL AND (@MontoActual < 0 OR (@MontoObjetivo IS NOT NULL AND @MontoActual > @MontoObjetivo))
        BEGIN
            RAISERROR('El monto actual debe estar entre 0 y el monto objetivo.', 16, 1);
            RETURN;
        END
        
        -- Validar cuenta asociada si se especifica
        IF @CuentaId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Cuentas 
                WHERE CuentaId = @CuentaId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La cuenta asociada no existe o no pertenece al usuario.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar nombre �nico si se est� actualizando
        IF @NombreMeta IS NOT NULL AND EXISTS (
            SELECT 1 FROM MetasFinancieras 
            WHERE UsuarioId = @UsuarioId 
              AND NombreMeta = @NombreMeta 
              AND MetaId != @MetaId 
              AND EstaCompletada = 0
        )
        BEGIN
            RAISERROR('Ya existe otra meta activa con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Calcular si la meta se completa con el nuevo objetivo o usar el valor proporcionado
        DECLARE @NuevoObjetivo DECIMAL(18,2) = ISNULL(@MontoObjetivo, (SELECT MontoObjetivo FROM MetasFinancieras WHERE MetaId = @MetaId));
        DECLARE @NuevoMontoActual DECIMAL(18,2) = ISNULL(@MontoActual, @MontoActualActual);
        DECLARE @NuevaCompletada BIT = CASE 
            WHEN @EstaCompletada IS NOT NULL THEN @EstaCompletada
            WHEN @NuevoMontoActual >= @NuevoObjetivo THEN 1 
            ELSE 0 
        END;
        
        -- Actualizar solo los campos que no son NULL
        UPDATE MetasFinancieras 
        SET 
            NombreMeta = ISNULL(@NombreMeta, NombreMeta),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            MontoObjetivo = ISNULL(@MontoObjetivo, MontoObjetivo),
            MontoActual = ISNULL(@MontoActual, MontoActual),
            FechaObjetivo = CASE 
                WHEN @RemoverFechaObjetivo = 1 THEN NULL
                WHEN @FechaObjetivo IS NOT NULL THEN @FechaObjetivo
                ELSE FechaObjetivo 
            END,
            CuentaId = CASE 
                WHEN @RemoverCuenta = 1 THEN NULL
                WHEN @CuentaId IS NOT NULL THEN @CuentaId
                ELSE CuentaId 
            END,
            EstaCompletada = @NuevaCompletada,
            FechaComplecion = CASE 
                WHEN @FechaComplecion IS NOT NULL THEN @FechaComplecion
                WHEN @NuevaCompletada = 1 AND @EstaCompletadaActual = 0 THEN GETUTCDATE()
                WHEN @NuevaCompletada = 0 THEN NULL
                ELSE FechaComplecion
            END,
            FechaActualizacion = GETUTCDATE()
        WHERE MetaId = @MetaId;
        
        -- Retornar la meta actualizada
        SELECT 
            mf.MetaId, mf.UsuarioId, mf.NombreMeta, mf.Descripcion,
            mf.MontoObjetivo, mf.MontoActual, 
            CASE 
                WHEN mf.MontoObjetivo > 0 
                THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
                ELSE 0 
            END as PorcentajeCompletado,
            mf.FechaObjetivo, mf.TipoMeta, mf.CuentaId, c.NombreCuenta,
            mf.EstaCompletada, mf.FechaComplecion, mf.FechaCreacion, mf.FechaActualizacion
        FROM MetasFinancieras mf
        LEFT JOIN Cuentas c ON mf.CuentaId = c.CuentaId
        WHERE mf.MetaId = @MetaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: MetasFinancieras_Delete
-- Descripci�n: Elimina una meta financiera
-- =============================================
CREATE PROCEDURE MetasFinancieras_Delete
    @MetaId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Marcar como completada, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la meta existe
        IF NOT EXISTS (SELECT 1 FROM MetasFinancieras WHERE MetaId = @MetaId)
        BEGIN
            RAISERROR('La meta financiera no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene contribuciones asociadas
        IF EXISTS (SELECT 1 FROM ContribucionesMetas WHERE MetaId = @MetaId)
        BEGIN
            IF @EliminacionFisica = 1
            BEGIN
                RAISERROR('No se puede eliminar f�sicamente la meta porque tiene contribuciones asociadas.', 16, 1);
                RETURN;
            END
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminaci�n f�sica
            DELETE FROM MetasFinancieras WHERE MetaId = @MetaId;
            
            SELECT 'Meta financiera eliminada f�sicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Marcar como completada (soft delete l�gico)
            UPDATE MetasFinancieras 
            SET 
                EstaCompletada = 1,
                FechaComplecion = GETUTCDATE(),
                FechaActualizacion = GETUTCDATE()
            WHERE MetaId = @MetaId;
            
            SELECT 'Meta financiera marcada como completada' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: MetasFinancieras_Select
-- Descripci�n: Obtiene una meta financiera por ID
-- =============================================
CREATE PROCEDURE MetasFinancieras_Select
    @MetaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        mf.MetaId, mf.UsuarioId, mf.NombreMeta, mf.Descripcion,
        mf.MontoObjetivo, mf.MontoActual, 
        (mf.MontoObjetivo - mf.MontoActual) as MontoFaltante,
        CASE 
            WHEN mf.MontoObjetivo > 0 
            THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeCompletado,
        mf.FechaObjetivo,
        CASE 
            WHEN mf.FechaObjetivo IS NOT NULL 
            THEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), CAST(mf.FechaObjetivo AS DATE))
            ELSE NULL 
        END as DiasRestantes,
        mf.TipoMeta, mf.CuentaId, c.NombreCuenta, c.Saldo as SaldoCuentaAsociada,
        mf.EstaCompletada, mf.FechaComplecion, mf.FechaCreacion, mf.FechaActualizacion
    FROM MetasFinancieras mf
    LEFT JOIN Cuentas c ON mf.CuentaId = c.CuentaId
    WHERE mf.MetaId = @MetaId;
END;
GO

-- =============================================
-- SP: MetasFinancieras_SelectByUser
-- Descripci�n: Obtiene todas las metas financieras de un usuario
-- =============================================
CREATE PROCEDURE MetasFinancieras_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @TipoMeta NVARCHAR(50) = NULL, -- 'ahorro', 'pago_deuda', 'inversion' o NULL para todos
    @SoloActivas BIT = 1, -- 1 = Solo no completadas, 0 = Todas
    @OrdenarPor NVARCHAR(20) = 'fecha_objetivo' -- 'fecha_objetivo', 'progreso', 'nombre', 'fecha_creacion'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        mf.MetaId, mf.UsuarioId, mf.NombreMeta, mf.Descripcion,
        mf.MontoObjetivo, mf.MontoActual, 
        (mf.MontoObjetivo - mf.MontoActual) as MontoFaltante,
        CASE 
            WHEN mf.MontoObjetivo > 0 
            THEN CAST((mf.MontoActual * 100.0 / mf.MontoObjetivo) AS DECIMAL(5,2))
            ELSE 0 
        END as PorcentajeCompletado,
        mf.FechaObjetivo,
        CASE 
            WHEN mf.FechaObjetivo IS NOT NULL 
            THEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), CAST(mf.FechaObjetivo AS DATE))
            ELSE NULL 
        END as DiasRestantes,
        mf.TipoMeta, mf.CuentaId, c.NombreCuenta,
        mf.EstaCompletada, mf.FechaComplecion, mf.FechaCreacion, mf.FechaActualizacion,
        -- Informaci�n adicional
        (SELECT COUNT(*) FROM ContribucionesMetas WHERE MetaId = mf.MetaId) as TotalContribuciones
    FROM MetasFinancieras mf
    LEFT JOIN Cuentas c ON mf.CuentaId = c.CuentaId
    WHERE mf.UsuarioId = @UsuarioId
      AND (@TipoMeta IS NULL OR mf.TipoMeta = @TipoMeta)
      AND (@SoloActivas = 0 OR mf.EstaCompletada = 0)
    ORDER BY 
        CASE @OrdenarPor
            WHEN 'fecha_objetivo' THEN mf.FechaObjetivo
            WHEN 'fecha_creacion' THEN mf.FechaCreacion
            ELSE NULL
        END ASC,
        CASE @OrdenarPor
            WHEN 'progreso' THEN (mf.MontoActual * 100.0 / mf.MontoObjetivo)
            ELSE NULL
        END DESC,
        CASE @OrdenarPor
            WHEN 'nombre' THEN mf.NombreMeta
            ELSE NULL
        END ASC;
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla METAS FINANCIERAS creados exitosamente';
PRINT 'SPs creados: MetasFinancieras_Insert, MetasFinancieras_Update, MetasFinancieras_Delete, MetasFinancieras_Select, MetasFinancieras_SelectByUser';