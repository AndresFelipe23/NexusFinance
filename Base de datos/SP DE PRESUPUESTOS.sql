-- =============================================
-- Procedimientos Almacenados Básicos para Tabla PRESUPUESTOS
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: Presupuestos_Insert
-- Descripción: Inserta un nuevo presupuesto
-- =============================================
CREATE OR ALTER PROCEDURE Presupuestos_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @NombrePresupuesto NVARCHAR(100),
    @PeriodoPresupuesto NVARCHAR(20),
    @FechaInicio DATETIME2,
    @FechaFin DATETIME2 = NULL,
    @PresupuestoTotal DECIMAL(18,2),
    @CrearCategoriasDefecto BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PresupuestoId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @CalculatedFechaFin DATE;
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o está inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @NombrePresupuesto IS NULL OR LTRIM(RTRIM(@NombrePresupuesto)) = ''
        BEGIN
            RAISERROR('El nombre del presupuesto es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @PeriodoPresupuesto IS NULL OR LTRIM(RTRIM(@PeriodoPresupuesto)) = ''
        BEGIN
            RAISERROR('El período del presupuesto es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @PresupuestoTotal <= 0
        BEGIN
            RAISERROR('El presupuesto total debe ser mayor a 0.', 16, 1);
            RETURN;
        END
        
        -- Validar que no exista un presupuesto con el mismo nombre para el usuario
        IF EXISTS (SELECT 1 FROM Presupuestos WHERE UsuarioId = @UsuarioId AND NombrePresupuesto = @NombrePresupuesto AND EstaActivo = 1)
        BEGIN
            RAISERROR('Ya existe un presupuesto con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Calcular FechaFin si no se proporciona o si el período no es personalizado
        SET @CalculatedFechaFin = @FechaFin;
        IF @FechaFin IS NULL OR @PeriodoPresupuesto != 'Personalizado'
        BEGIN
            SET @CalculatedFechaFin = 
                CASE @PeriodoPresupuesto
                    WHEN 'Mensual' THEN EOMONTH(@FechaInicio)
                    WHEN 'Trimestral' THEN DATEADD(day, -1, DATEADD(month, 3, @FechaInicio))
                    WHEN 'Semestral' THEN DATEADD(day, -1, DATEADD(month, 6, @FechaInicio))
                    WHEN 'Anual' THEN DATEADD(day, -1, DATEADD(year, 1, @FechaInicio))
                    ELSE @FechaFin -- Si es personalizado o desconocido, usar el valor proporcionado
                END;
        END

        -- Insertar presupuesto
        INSERT INTO Presupuestos (
            PresupuestoId, UsuarioId, NombrePresupuesto, PeriodoPresupuesto, 
            FechaInicio, FechaFin, PresupuestoTotal, EstaActivo, 
            FechaCreacion, FechaActualizacion
        )
        VALUES (
            @PresupuestoId, @UsuarioId, @NombrePresupuesto, @PeriodoPresupuesto,
            @FechaInicio, @CalculatedFechaFin, @PresupuestoTotal, 1,
            GETUTCDATE(), GETUTCDATE()
        );
        
        -- Crear categorías por defecto si se solicita
        IF @CrearCategoriasDefecto = 1
        BEGIN
            -- Insertar categorías básicas por defecto
            INSERT INTO CategoriasPresupuesto (
                CategoriaPresupuestoId, PresupuestoId, CategoriaId, 
                MontoAsignado, FechaCreacion, FechaActualizacion
            )
            SELECT 
                NEWID(), @PresupuestoId, c.CategoriaId,
                @PresupuestoTotal * 0.1, -- 10% por defecto
                GETUTCDATE(), GETUTCDATE()
            FROM Categorias c
            WHERE c.UsuarioId = @UsuarioId 
              AND c.EstaActivo = 1
              AND c.NombreCategoria IN ('Alimentación', 'Transporte', 'Entretenimiento', 'Servicios', 'Otros')
            ORDER BY c.NombreCategoria;
        END
        
        -- Retornar el presupuesto creado
        SELECT 
            PresupuestoId, UsuarioId, NombrePresupuesto, PeriodoPresupuesto,
            FechaInicio, FechaFin, PresupuestoTotal, EstaActivo,
            FechaCreacion, FechaActualizacion
        FROM Presupuestos 
        WHERE PresupuestoId = @PresupuestoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Presupuestos_Update
-- Descripcin: Actualiza un presupuesto existente
-- =============================================
CREATE OR ALTER PROCEDURE Presupuestos_Update
    @PresupuestoId UNIQUEIDENTIFIER,
    @NombrePresupuesto NVARCHAR(100) = NULL,
    @PeriodoPresupuesto NVARCHAR(20) = NULL, -- Permitir actualizar el perodo
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @PresupuestoTotal DECIMAL(18,2) = NULL,
    @EstaActivo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @CurrentPeriodoPresupuesto NVARCHAR(20);
    DECLARE @CurrentFechaInicio DATETIME2;
    DECLARE @CurrentFechaFin DATETIME2; -- Para almacenar la FechaFin actual
    DECLARE @CalculatedFechaFin DATETIME2;
    
    BEGIN TRY
        -- Verificar que el presupuesto existe y obtener el usuario, perodo y fechas actuales
        SELECT 
            @UsuarioId = UsuarioId, 
            @CurrentPeriodoPresupuesto = PeriodoPresupuesto, 
            @CurrentFechaInicio = FechaInicio,
            @CurrentFechaFin = FechaFin
        FROM Presupuestos 
        WHERE PresupuestoId = @PresupuestoId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El presupuesto no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar nombre nico si se est actualizando
        IF @NombrePresupuesto IS NOT NULL AND EXISTS (
            SELECT 1 FROM Presupuestos 
            WHERE UsuarioId = @UsuarioId 
              AND NombrePresupuesto = @NombrePresupuesto 
              AND PresupuestoId != @PresupuestoId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe otro presupuesto con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Validar presupuesto total si se est actualizando
        IF @PresupuestoTotal IS NOT NULL AND @PresupuestoTotal <= 0
        BEGIN
            RAISERROR('El presupuesto total debe ser mayor a 0.', 16, 1);
            RETURN;
        END
        
        -- Lgica para calcular FechaFin
        -- Prioridad:
        -- 1. Si @FechaFin se proporciona explcitamente, usarla.
        -- 2. Si se cambia FechaInicio o PeriodoPresupuesto, recalcular.
        -- 3. Si no se proporciona FechaFin y el perodo no es 'Personalizado', recalcular.
        -- 4. De lo contrario, mantener la FechaFin existente.

        SET @CalculatedFechaFin = @CurrentFechaFin; -- Valor por defecto: la FechaFin actual

        -- Caso 1: @FechaFin se proporciona explcitamente
        IF @FechaFin IS NOT NULL
        BEGIN
            SET @CalculatedFechaFin = @FechaFin;
        END
        -- Caso 2: Se cambia FechaInicio o PeriodoPresupuesto, o el perodo actual no es 'Personalizado' y FechaFin es NULL
        ELSE IF (@FechaInicio IS NOT NULL AND @FechaInicio != @CurrentFechaInicio) -- Si se cambia la fecha de inicio
                OR (@PeriodoPresupuesto IS NOT NULL AND @PeriodoPresupuesto != @CurrentPeriodoPresupuesto) -- Si se cambia el perodo
                OR (@CurrentPeriodoPresupuesto != 'Personalizado' AND @CurrentFechaFin IS NULL) -- Si el perodo actual no es personalizado y la fecha fin es NULL
        BEGIN
            -- Usar el nuevo PeriodoPresupuesto si se proporciona, de lo contrario el actual
            DECLARE @EffectivePeriodoPresupuesto NVARCHAR(20) = ISNULL(@PeriodoPresupuesto, @CurrentPeriodoPresupuesto);
            -- Usar la nueva FechaInicio si se proporciona, de lo contrario la actual
            DECLARE @EffectiveFechaInicio DATETIME2 = ISNULL(@FechaInicio, @CurrentFechaInicio);

            SET @CalculatedFechaFin = 
                CASE @EffectivePeriodoPresupuesto
                    WHEN 'Mensual' THEN EOMONTH(@EffectiveFechaInicio)
                    WHEN 'Trimestral' THEN DATEADD(day, -1, DATEADD(month, 3, ISNULL(@FechaInicio, @CurrentFechaInicio)))
                    WHEN 'Semestral' THEN DATEADD(day, -1, DATEADD(month, 6, ISNULL(@FechaInicio, @CurrentFechaInicio)))
                    WHEN 'Anual' THEN DATEADD(day, -1, DATEADD(year, 1, ISNULL(@FechaInicio, @CurrentFechaInicio)))
                    ELSE @CalculatedFechaFin -- Si es 'Personalizado' o desconocido, mantener el valor actual
                END;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE Presupuestos 
        SET 
            NombrePresupuesto = ISNULL(@NombrePresupuesto, NombrePresupuesto),
            PeriodoPresupuesto = ISNULL(@PeriodoPresupuesto, PeriodoPresupuesto),
            FechaInicio = ISNULL(@FechaInicio, FechaInicio),
            FechaFin = @CalculatedFechaFin, -- Usar la fecha calculada o la proporcionada
            PresupuestoTotal = ISNULL(@PresupuestoTotal, PresupuestoTotal),
            EstaActivo = ISNULL(@EstaActivo, EstaActivo),
            FechaActualizacion = GETUTCDATE()
        WHERE PresupuestoId = @PresupuestoId;
        
        -- Retornar el presupuesto actualizado
        SELECT 
            PresupuestoId, UsuarioId, NombrePresupuesto, PeriodoPresupuesto,
            FechaInicio, FechaFin, PresupuestoTotal, EstaActivo,
            FechaCreacion, FechaActualizacion
        FROM Presupuestos 
        WHERE PresupuestoId = @PresupuestoId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Presupuestos_Delete
-- Descripción: Elimina (desactiva) un presupuesto
-- =============================================
CREATE OR ALTER PROCEDURE Presupuestos_Delete
    @PresupuestoId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Soft delete, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que el presupuesto existe
        IF NOT EXISTS (SELECT 1 FROM Presupuestos WHERE PresupuestoId = @PresupuestoId)
        BEGIN
            RAISERROR('El presupuesto no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene categorías asociadas
        IF EXISTS (SELECT 1 FROM CategoriasPresupuesto WHERE PresupuestoId = @PresupuestoId)
        BEGIN
            IF @EliminacionFisica = 1
            BEGIN
                RAISERROR('No se puede eliminar físicamente el presupuesto porque tiene categorías asociadas.', 16, 1);
                RETURN;
            END
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminación física
            DELETE FROM Presupuestos WHERE PresupuestoId = @PresupuestoId;
            
            SELECT 'Presupuesto eliminado físicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Eliminación lógica (soft delete)
            UPDATE Presupuestos 
            SET 
                EstaActivo = 0,
                FechaActualizacion = GETUTCDATE()
            WHERE PresupuestoId = @PresupuestoId;
            
            SELECT 'Presupuesto desactivado' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Presupuestos_Select
-- Descripcin: Obtiene un presupuesto por ID
-- =============================================
CREATE OR ALTER PROCEDURE Presupuestos_Select
    @PresupuestoId UNIQUEIDENTIFIER,
    @IncluirCategorias BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Retornar el presupuesto
    SELECT 
        PresupuestoId, UsuarioId, NombrePresupuesto, PeriodoPresupuesto,
        FechaInicio, FechaFin, PresupuestoTotal, EstaActivo,
        FechaCreacion, FechaActualizacion
    FROM Presupuestos 
    WHERE PresupuestoId = @PresupuestoId;
    
    -- Retornar categoras si se solicita
    IF @IncluirCategorias = 1
    BEGIN
        SELECT 
            cp.CategoriaPresupuestoId, cp.PresupuestoId, cp.CategoriaId,
            c.NombreCategoria, cp.MontoAsignado, cp.MontoGastado,
            cp.FechaCreacion, cp.FechaActualizacion
        FROM CategoriasPresupuesto cp
        INNER JOIN Categorias c ON cp.CategoriaId = c.CategoriaId
        WHERE cp.PresupuestoId = @PresupuestoId
        ORDER BY c.NombreCategoria;
    END
END;
GO

-- =============================================
-- SP: Presupuestos_SelectByUser
-- Descripción: Obtiene todos los presupuestos de un usuario
-- =============================================
CREATE OR ALTER PROCEDURE Presupuestos_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @FechaReferencia DATETIME2 = NULL,
    @Periodo NVARCHAR(20) = NULL,
    @SoloActivos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PresupuestoId, UsuarioId, NombrePresupuesto, PeriodoPresupuesto,
        FechaInicio, FechaFin, PresupuestoTotal, EstaActivo,
        FechaCreacion, FechaActualizacion
    FROM Presupuestos 
    WHERE UsuarioId = @UsuarioId
      AND (@SoloActivos = 0 OR EstaActivo = 1)
      AND (@Periodo IS NULL OR PeriodoPresupuesto = @Periodo)
      AND (@FechaReferencia IS NULL OR @FechaReferencia BETWEEN FechaInicio AND ISNULL(FechaFin, FechaInicio))
    ORDER BY FechaInicio DESC, NombrePresupuesto;
END;
GO