-- =============================================
-- Procedimientos Almacenados B�sicos para Tabla CATEGORIAS
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: Categorias_Insert
-- Descripcion: Inserta una nueva categoria
-- =============================================
CREATE OR ALTER PROCEDURE Categorias_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @NombreCategoria NVARCHAR(100),
    @TipoCategoria NVARCHAR(20),
    @CategoriaIdPadre UNIQUEIDENTIFIER = NULL,
    @Color NVARCHAR(7) = '#3B82F6',
    @Icono NVARCHAR(50) = 'categoria'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoriaId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o est� inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @NombreCategoria IS NULL OR LTRIM(RTRIM(@NombreCategoria)) = ''
        BEGIN
            RAISERROR('El nombre de la categor�a es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @TipoCategoria NOT IN (
            'ingreso', 
            'gasto', 
            'transferencia',
            'inversion',     -- Inversiones (acciones, bonos, etc.)
            'ahorro',        -- Ahorros específicos
            'credito',       -- Préstamos recibidos
            'deuda')         -- Préstamos a pagar
        BEGIN
            RAISERROR('El tipo de categoria debe ser "ingreso", "gasto", "transferencia", "inversion", "ahorro", "credito" o "deuda".', 16, 1);
            RETURN;
        END
        
        -- Validar categor�a padre si se especifica
        IF @CategoriaIdPadre IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Categorias 
                WHERE CategoriaId = @CategoriaIdPadre 
                  AND UsuarioId = @UsuarioId 
                  AND TipoCategoria = @TipoCategoria
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La categor�a padre no existe o no es del mismo tipo.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar que no exista una categor�a con el mismo nombre, tipo y padre para el usuario
        IF EXISTS (
            SELECT 1 FROM Categorias 
            WHERE UsuarioId = @UsuarioId 
              AND NombreCategoria = @NombreCategoria 
              AND TipoCategoria = @TipoCategoria
              AND ISNULL(CategoriaIdPadre, '00000000-0000-0000-0000-000000000000') = ISNULL(@CategoriaIdPadre, '00000000-0000-0000-0000-000000000000')
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe una categor�a con ese nombre en el mismo nivel.', 16, 1);
            RETURN;
        END
        
        -- Insertar categoria
        INSERT INTO Categorias (
            CategoriaId, UsuarioId, NombreCategoria, TipoCategoria, 
            CategoriaIdPadre, Color, Icono, EstaActivo, FechaCreacion
        )
        VALUES (
            @CategoriaId, @UsuarioId, @NombreCategoria, @TipoCategoria,
            @CategoriaIdPadre, @Color, @Icono, 1, GETUTCDATE()
        );
        
        -- Retornar la categoria creada
        SELECT 
            CategoriaId, UsuarioId, NombreCategoria, TipoCategoria,
            CategoriaIdPadre, Color, Icono, EstaActivo, FechaCreacion
        FROM Categorias 
        WHERE CategoriaId = @CategoriaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Categorias_Update
-- Descripcion: Actualiza una categoria existente
-- =============================================
CREATE OR ALTER PROCEDURE Categorias_Update
    @CategoriaId UNIQUEIDENTIFIER,
    @NombreCategoria NVARCHAR(100) = NULL,
    @CategoriaIdPadre UNIQUEIDENTIFIER = NULL,
    @Color NVARCHAR(7) = NULL,
    @Icono NVARCHAR(50) = NULL,
    @EstaActivo BIT = NULL,
    @CambiarPadre BIT = 0 -- Flag para indicar si se quiere cambiar el padre a NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @TipoCategoria NVARCHAR(20);
    
    BEGIN TRY
        -- Verificar que la categoria existe y obtener datos
        SELECT @UsuarioId = UsuarioId, @TipoCategoria = TipoCategoria
        FROM Categorias 
        WHERE CategoriaId = @CategoriaId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('La categor�a no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar categoria padre si se especifica
        IF @CategoriaIdPadre IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Categorias 
                WHERE CategoriaId = @CategoriaIdPadre 
                  AND UsuarioId = @UsuarioId 
                  AND TipoCategoria = @TipoCategoria
                  AND EstaActivo = 1
            )
            BEGIN
                RAISERROR('La categoria padre no existe o no es del mismo tipo.', 16, 1);
                RETURN;
            END
            
            -- Evitar ciclos (que la categoria padre sea hija de la actual)
            IF @CategoriaIdPadre = @CategoriaId
            BEGIN
                RAISERROR('Una categoria no puede ser padre de si misma.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar nombre unico si se esta actualizando
        IF @NombreCategoria IS NOT NULL AND EXISTS (
            SELECT 1 FROM Categorias 
            WHERE UsuarioId = @UsuarioId 
              AND NombreCategoria = @NombreCategoria 
              AND TipoCategoria = @TipoCategoria
              AND CategoriaId != @CategoriaId 
              AND EstaActivo = 1
        )
        BEGIN
            RAISERROR('Ya existe otra categor�a con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE Categorias 
        SET 
            NombreCategoria = ISNULL(@NombreCategoria, NombreCategoria),
            CategoriaIdPadre = CASE 
                WHEN @CambiarPadre = 1 THEN @CategoriaIdPadre 
                WHEN @CategoriaIdPadre IS NOT NULL THEN @CategoriaIdPadre
                ELSE CategoriaIdPadre 
            END,
            Color = ISNULL(@Color, Color),
            Icono = ISNULL(@Icono, Icono),
            EstaActivo = ISNULL(@EstaActivo, EstaActivo)
        WHERE CategoriaId = @CategoriaId;
        
        -- Retornar la categoria actualizada
        SELECT 
            CategoriaId, UsuarioId, NombreCategoria, TipoCategoria,
            CategoriaIdPadre, Color, Icono, EstaActivo, FechaCreacion
        FROM Categorias 
        WHERE CategoriaId = @CategoriaId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Categorias_Delete
-- Descripcion: Elimina (desactiva) una categoria
-- =============================================
CREATE OR ALTER PROCEDURE Categorias_Delete
    @CategoriaId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Soft delete, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que la categor�a existe
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE CategoriaId = @CategoriaId)
        BEGIN
            RAISERROR('La categor�a no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene transacciones asociadas
        IF EXISTS (SELECT 1 FROM Transacciones WHERE CategoriaId = @CategoriaId)
        BEGIN
            IF @EliminacionFisica = 1
            BEGIN
                RAISERROR('No se puede eliminar f�sicamente la categor�a porque tiene transacciones asociadas.', 16, 1);
                RETURN;
            END
        END
        
        -- Verificar si tiene subcategorias
        IF EXISTS (SELECT 1 FROM Categorias WHERE CategoriaIdPadre = @CategoriaId AND EstaActivo = 1)
        BEGIN
            RAISERROR('No se puede eliminar la categor�a porque tiene subcategor�as activas.', 16, 1);
            RETURN;
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminacion fisica
            DELETE FROM Categorias WHERE CategoriaId = @CategoriaId;
            
            SELECT 'Categor�a eliminada f�sicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Eliminacion logica (soft delete)
            UPDATE Categorias 
            SET EstaActivo = 0
            WHERE CategoriaId = @CategoriaId;
            
            SELECT 'Categor�a desactivada' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: Categorias_Select
-- Descripcion: Obtiene una categoria por ID
-- =============================================
CREATE OR ALTER PROCEDURE Categorias_Select
    @CategoriaId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoriaId, c.UsuarioId, c.NombreCategoria, c.TipoCategoria,
        c.CategoriaIdPadre, cp.NombreCategoria as NombreCategoriaPadre,
        c.Color, c.Icono, c.EstaActivo, c.FechaCreacion
    FROM Categorias c
    LEFT JOIN Categorias cp ON c.CategoriaIdPadre = cp.CategoriaId
    WHERE c.CategoriaId = @CategoriaId;
END;
GO

-- =============================================
-- SP: Categorias_SelectByUser
-- Descripcion: Obtiene todas las categorias de un usuario
-- =============================================
CREATE OR ALTER PROCEDURE Categorias_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @TipoCategoria NVARCHAR(20) = NULL, -- 'ingreso', 'gasto', 'transferencia', 'inversion', 'ahorro', 'credito', 'deuda' o NULL para todos
    @SoloActivas BIT = 1,
    @IncluirJerarquia BIT = 1 -- Para incluir informacion de padre e hijos
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @IncluirJerarquia = 1
    BEGIN
        -- Consulta con jerarquia
        SELECT 
            c.CategoriaId, c.UsuarioId, c.NombreCategoria, c.TipoCategoria,
            c.CategoriaIdPadre, cp.NombreCategoria as NombreCategoriaPadre,
            c.Color, c.Icono, c.EstaActivo, c.FechaCreacion,
            -- Contar subcategorias
            (SELECT COUNT(*) FROM Categorias sub 
             WHERE sub.CategoriaIdPadre = c.CategoriaId AND sub.EstaActivo = 1) as CantidadSubcategorias
        FROM Categorias c
        LEFT JOIN Categorias cp ON c.CategoriaIdPadre = cp.CategoriaId
        WHERE c.UsuarioId = @UsuarioId
          AND (@TipoCategoria IS NULL OR c.TipoCategoria = @TipoCategoria)
          AND (@SoloActivas = 0 OR c.EstaActivo = 1)
        ORDER BY c.TipoCategoria, c.NombreCategoria;
    END
    ELSE
    BEGIN
        -- Consulta simple
        SELECT 
            CategoriaId, UsuarioId, NombreCategoria, TipoCategoria,
            CategoriaIdPadre, Color, Icono, EstaActivo, FechaCreacion
        FROM Categorias 
        WHERE UsuarioId = @UsuarioId
          AND (@TipoCategoria IS NULL OR TipoCategoria = @TipoCategoria)
          AND (@SoloActivas = 0 OR EstaActivo = 1)
        ORDER BY TipoCategoria, NombreCategoria;
    END
END;
GO

PRINT 'Procedimientos almacenados b�sicos para tabla CATEGORIAS creados exitosamente';
PRINT 'SPs creados: Categorias_Insert, Categorias_Update, Categorias_Delete, Categorias_Select, Categorias_SelectByUser';