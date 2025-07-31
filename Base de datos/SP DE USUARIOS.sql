USE NexusFinance

GO
CREATE PROCEDURE Usuarios_Insert
    @Nombre NVARCHAR(100),
    @Apellido NVARCHAR(100),
    @Email NVARCHAR(255),
    @ClaveHash NVARCHAR(255),
    @Moneda NVARCHAR(3) = 'USD',
    @ZonaHoraria NVARCHAR(50) = 'UTC'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el email no exista
    IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = @Email)
    BEGIN
        RAISERROR('El email ya está registrado.', 16, 1);
        RETURN;
    END

    DECLARE @UsuarioId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO Usuarios (UsuarioId, Nombre, Apellido, Email, ClaveHash, Moneda, ZonaHoraria, EstaActivo, FechaCreacion, FechaActualizacion)
    VALUES (@UsuarioId, @Nombre, @Apellido, @Email, @ClaveHash, @Moneda, @ZonaHoraria, 1, GETUTCDATE(), GETUTCDATE());

    SELECT UsuarioId, Nombre, Apellido, Email, Moneda, ZonaHoraria, EstaActivo, FechaCreacion
    FROM Usuarios
    WHERE UsuarioId = @UsuarioId;
END;
GO

GO
CREATE PROCEDURE Usuarios_SelectByEmail
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 UsuarioId, Nombre, Apellido, Email, ClaveHash, Moneda, ZonaHoraria, EstaActivo
    FROM Usuarios
    WHERE Email = @Email;
END;
GO

CREATE PROCEDURE Usuarios_Select
    @UsuarioId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT UsuarioId, Nombre, Email, EstaActivo, FechaCreacion
    FROM Usuarios
    WHERE UsuarioId = @UsuarioId;
END;
GO