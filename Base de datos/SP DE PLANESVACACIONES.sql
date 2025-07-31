-- =============================================
-- Procedimientos Almacenados Bsicos para Tabla PLANESVACACIONES
-- NexusFinance
-- =============================================

USE NexusFinance;
GO

-- =============================================
-- SP: PlanesVacaciones_Insert
-- Descripcin: Inserta un nuevo plan de vacaciones
-- =============================================
CREATE OR ALTER PROCEDURE PlanesVacaciones_Insert
    @UsuarioId UNIQUEIDENTIFIER,
    @NombrePlan NVARCHAR(100),
    @Descripcion NVARCHAR(1000) = NULL,
    @Destino NVARCHAR(200),
    @Pais NVARCHAR(100),
    @Ciudad NVARCHAR(100) = NULL,
    @FechaInicio DATETIME2,
    @FechaFin DATETIME2,
    @CantidadPersonas INT = 1,
    @PresupuestoEstimado DECIMAL(18,2) = NULL,
    @MonedaDestino NVARCHAR(3) = NULL,
    @TasaCambio DECIMAL(10,4) = NULL,
    @EsViajeInternacional BIT = 0,
    @MetaFinancieraId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PlanId UNIQUEIDENTIFIER = NEWID();
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Validar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioId = @UsuarioId AND EstaActivo = 1)
        BEGIN
            RAISERROR('El usuario no existe o est inactivo.', 16, 1);
            RETURN;
        END
        
        -- Validar campos obligatorios
        IF @NombrePlan IS NULL OR LTRIM(RTRIM(@NombrePlan)) = ''
        BEGIN
            RAISERROR('El nombre del plan es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @Destino IS NULL OR LTRIM(RTRIM(@Destino)) = ''
        BEGIN
            RAISERROR('El pas es obligatorio.', 16, 1);
            RETURN;
        END
        
        IF @FechaInicio IS NULL OR @FechaFin IS NULL
        BEGIN
            RAISERROR('Las fechas de inicio y fin son obligatorias.', 16, 1);
            RETURN;
        END
        
        -- Validar que la fecha de fin sea posterior a la de inicio
        IF @FechaFin <= @FechaInicio
        BEGIN
            RAISERROR('La fecha de fin debe ser posterior a la fecha de inicio.', 16, 1);
            RETURN;
        END
        
        -- Validar cantidad de personas
        IF @CantidadPersonas <= 0
        BEGIN
            RAISERROR('La cantidad de personas debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar presupuesto estimado si se proporciona
        IF @PresupuestoEstimado IS NOT NULL AND @PresupuestoEstimado < 0
        BEGIN
            RAISERROR('El presupuesto estimado no puede ser negativo.', 16, 1);
            RETURN;
        END
        
        -- Validar meta financiera si se especifica
        IF @MetaFinancieraId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM MetasFinancieras 
                WHERE MetaId = @MetaFinancieraId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaCompletada = 0
            )
            BEGIN
                RAISERROR('La meta financiera no existe, no pertenece al usuario o ya est completada.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar que no exista un plan con el mismo nombre para el usuario
        IF EXISTS (
            SELECT 1 FROM PlanesVacaciones 
            WHERE UsuarioId = @UsuarioId 
              AND NombrePlan = @NombrePlan
        )
        BEGIN
            RAISERROR('Ya existe un plan de vacaciones con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Insertar plan de vacaciones
        INSERT INTO PlanesVacaciones (
            PlanId, UsuarioId, NombrePlan, Descripcion, Destino, Pais, Ciudad,
            FechaInicio, FechaFin, CantidadPersonas, PresupuestoEstimado, 
            PresupuestoReal, MonedaDestino, TasaCambio, EstadoPlan, 
            EsViajeInternacional, MetaFinancieraId, FechaCreacion, FechaActualizacion
        )
        VALUES (
            @PlanId, @UsuarioId, @NombrePlan, @Descripcion, @Destino, @Pais, @Ciudad,
            @FechaInicio, @FechaFin, @CantidadPersonas, @PresupuestoEstimado,
            0.00, @MonedaDestino, @TasaCambio, 'planificando',
            @EsViajeInternacional, @MetaFinancieraId, GETUTCDATE(), GETUTCDATE()
        );
        
        -- Retornar el plan creado
        SELECT 
            PlanId, UsuarioId, NombrePlan, Descripcion, Destino, Pais, Ciudad,
            FechaInicio, FechaFin, CantidadPersonas, PresupuestoEstimado, 
            PresupuestoReal, MonedaDestino, TasaCambio, EstadoPlan, 
            EsViajeInternacional, MetaFinancieraId, FechaCreacion, FechaActualizacion
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PlanesVacaciones_Update
-- Descripcin: Actualiza un plan de vacaciones existente
-- =============================================
CREATE OR ALTER PROCEDURE PlanesVacaciones_Update
    @PlanId UNIQUEIDENTIFIER,
    @NombrePlan NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(1000) = NULL,
    @Destino NVARCHAR(200) = NULL,
    @Pais NVARCHAR(100) = NULL,
    @Ciudad NVARCHAR(100) = NULL,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @CantidadPersonas INT = NULL,
    @PresupuestoEstimado DECIMAL(18,2) = NULL,
    @PresupuestoReal DECIMAL(18,2) = NULL,
    @MonedaDestino NVARCHAR(3) = NULL,
    @TasaCambio DECIMAL(10,4) = NULL,
    @EstadoPlan NVARCHAR(20) = NULL,
    @EsViajeInternacional BIT = NULL,
    @MetaFinancieraId UNIQUEIDENTIFIER = NULL,
    @CambiarMeta BIT = 0 -- Flag para indicar si se quiere cambiar la meta a NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @UsuarioId UNIQUEIDENTIFIER;
    DECLARE @FechaInicioActual DATETIME2;
    DECLARE @FechaFinActual DATETIME2;
    
    BEGIN TRY
        -- Verificar que el plan existe y obtener datos
        SELECT @UsuarioId = UsuarioId, @FechaInicioActual = FechaInicio, @FechaFinActual = FechaFin
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
        IF @UsuarioId IS NULL
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar fechas si se estn actualizando
        DECLARE @NuevaFechaInicio DATETIME2 = ISNULL(@FechaInicio, @FechaInicioActual);
        DECLARE @NuevaFechaFin DATETIME2 = ISNULL(@FechaFin, @FechaFinActual);
        
        IF @NuevaFechaFin <= @NuevaFechaInicio
        BEGIN
            RAISERROR('La fecha de fin debe ser posterior a la fecha de inicio.', 16, 1);
            RETURN;
        END
        
        -- Validar cantidad de personas
        IF @CantidadPersonas IS NOT NULL AND @CantidadPersonas <= 0
        BEGIN
            RAISERROR('La cantidad de personas debe ser mayor a cero.', 16, 1);
            RETURN;
        END
        
        -- Validar presupuestos
        IF @PresupuestoEstimado IS NOT NULL AND @PresupuestoEstimado < 0
        BEGIN
            RAISERROR('El presupuesto estimado no puede ser negativo.', 16, 1);
            RETURN;
        END
        
        IF @PresupuestoReal IS NOT NULL AND @PresupuestoReal < 0
        BEGIN
            RAISERROR('El presupuesto real no puede ser negativo.', 16, 1);
            RETURN;
        END
        
        -- Validar estado del plan
        IF @EstadoPlan IS NOT NULL AND @EstadoPlan NOT IN ('planificando', 'confirmado', 'en_curso', 'completado', 'cancelado')
        BEGIN
            RAISERROR('El estado del plan debe ser: planificando, confirmado, en_curso, completado o cancelado.', 16, 1);
            RETURN;
        END
        
        -- Validar meta financiera si se especifica
        IF @MetaFinancieraId IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM MetasFinancieras 
                WHERE MetaId = @MetaFinancieraId 
                  AND UsuarioId = @UsuarioId 
                  AND EstaCompletada = 0
            )
            BEGIN
                RAISERROR('La meta financiera no existe, no pertenece al usuario o ya est completada.', 16, 1);
                RETURN;
            END
        END
        
        -- Validar nombre nico si se est actualizando
        IF @NombrePlan IS NOT NULL AND EXISTS (
            SELECT 1 FROM PlanesVacaciones 
            WHERE UsuarioId = @UsuarioId 
              AND NombrePlan = @NombrePlan 
              AND PlanId != @PlanId
        )
        BEGIN
            RAISERROR('Ya existe otro plan de vacaciones con ese nombre.', 16, 1);
            RETURN;
        END
        
        -- Actualizar solo los campos que no son NULL
        UPDATE PlanesVacaciones 
        SET 
            NombrePlan = ISNULL(@NombrePlan, NombrePlan),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            Destino = ISNULL(@Destino, Destino),
            Pais = ISNULL(@Pais, Pais),
            Ciudad = ISNULL(@Ciudad, Ciudad),
            FechaInicio = ISNULL(@FechaInicio, FechaInicio),
            FechaFin = ISNULL(@FechaFin, FechaFin),
            CantidadPersonas = ISNULL(@CantidadPersonas, CantidadPersonas),
            PresupuestoEstimado = ISNULL(@PresupuestoEstimado, PresupuestoEstimado),
            PresupuestoReal = ISNULL(@PresupuestoReal, PresupuestoReal),
            MonedaDestino = ISNULL(@MonedaDestino, MonedaDestino),
            TasaCambio = ISNULL(@TasaCambio, TasaCambio),
            EstadoPlan = ISNULL(@EstadoPlan, EstadoPlan),
            EsViajeInternacional = ISNULL(@EsViajeInternacional, EsViajeInternacional),
            MetaFinancieraId = CASE 
                WHEN @CambiarMeta = 1 THEN @MetaFinancieraId 
                WHEN @MetaFinancieraId IS NOT NULL THEN @MetaFinancieraId
                ELSE MetaFinancieraId 
            END,
            FechaActualizacion = GETUTCDATE()
        WHERE PlanId = @PlanId;
        
        -- Retornar el plan actualizado
        SELECT 
            PlanId, UsuarioId, NombrePlan, Descripcion, Destino, Pais, Ciudad,
            FechaInicio, FechaFin, CantidadPersonas, PresupuestoEstimado, 
            PresupuestoReal, MonedaDestino, TasaCambio, EstadoPlan, 
            EsViajeInternacional, MetaFinancieraId, FechaCreacion, FechaActualizacion
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PlanesVacaciones_Delete
-- Descripcin: Elimina un plan de vacaciones
-- =============================================
CREATE OR ALTER PROCEDURE PlanesVacaciones_Delete
    @PlanId UNIQUEIDENTIFIER,
    @EliminacionFisica BIT = 0 -- 0 = Cambiar estado a cancelado, 1 = Hard delete
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene datos relacionados
        DECLARE @TieneRelaciones BIT = 0;
        
        IF EXISTS (SELECT 1 FROM PresupuestoViaje WHERE PlanId = @PlanId) OR
           EXISTS (SELECT 1 FROM ActividadesViaje WHERE PlanId = @PlanId) OR
           EXISTS (SELECT 1 FROM ChecklistViaje WHERE PlanId = @PlanId) OR
           EXISTS (SELECT 1 FROM GastosViaje WHERE PlanId = @PlanId) OR
           EXISTS (SELECT 1 FROM DocumentosViaje WHERE PlanId = @PlanId)
        BEGIN
            SET @TieneRelaciones = 1;
        END
        
        IF @TieneRelaciones = 1 AND @EliminacionFisica = 1
        BEGIN
            RAISERROR('No se puede eliminar fsicamente el plan porque tiene datos relacionados (presupuestos, actividades, gastos, etc.).', 16, 1);
            RETURN;
        END
        
        IF @EliminacionFisica = 1
        BEGIN
            -- Eliminacin fsica
            DELETE FROM PlanesVacaciones WHERE PlanId = @PlanId;
            
            SELECT 'Plan de vacaciones eliminado fsicamente' as Resultado;
        END
        ELSE
        BEGIN
            -- Cambiar estado a cancelado (soft delete)
            UPDATE PlanesVacaciones 
            SET EstadoPlan = 'cancelado',
                FechaActualizacion = GETUTCDATE()
            WHERE PlanId = @PlanId;
            
            SELECT 'Plan de vacaciones cancelado' as Resultado;
        END
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =============================================
-- SP: PlanesVacaciones_Select
-- Descripcin: Obtiene un plan de vacaciones por ID
-- =============================================
CREATE OR ALTER PROCEDURE PlanesVacaciones_Select
    @PlanId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pv.PlanId, pv.UsuarioId, pv.NombrePlan, pv.Descripcion, 
        pv.Destino, pv.Pais, pv.Ciudad, pv.FechaInicio, pv.FechaFin,
        pv.CantidadPersonas, pv.PresupuestoEstimado, pv.PresupuestoReal,
        pv.MonedaDestino, pv.TasaCambio, pv.EstadoPlan, pv.EsViajeInternacional,
        pv.MetaFinancieraId, mf.NombreMeta, pv.FechaCreacion, pv.FechaActualizacion,
        -- Informacin adicional calculada
        DATEDIFF(DAY, pv.FechaInicio, pv.FechaFin) as DuracionDias,
        DATEDIFF(DAY, GETDATE(), pv.FechaInicio) as DiasParaInicio,
        -- Estadsticas del plan
        (SELECT COUNT(*) FROM ActividadesViaje WHERE PlanId = @PlanId) as TotalActividades,
        (SELECT COUNT(*) FROM ChecklistViaje WHERE PlanId = @PlanId AND EstaCompletado = 0) as ItemsPendientes,
        (SELECT SUM(Monto) FROM GastosViaje WHERE PlanId = @PlanId) as TotalGastado
    FROM PlanesVacaciones pv
    LEFT JOIN MetasFinancieras mf ON pv.MetaFinancieraId = mf.MetaId
    WHERE pv.PlanId = @PlanId;
END;
GO

-- =============================================
-- SP: PlanesVacaciones_SelectByUser
-- Descripcin: Obtiene todos los planes de vacaciones de un usuario

CREATE OR ALTER PROCEDURE PlanesVacaciones_SelectByUser
    @UsuarioId UNIQUEIDENTIFIER,
    @EstadoPlan NVARCHAR(20) = NULL, -- Filtrar por estado especfico
    @AoViaje INT = NULL, -- Filtrar por ao del viaje
    @SoloActivos BIT = 1, -- 1 = Solo planes activos (no cancelados), 0 = Incluir todos
    @OrdenarPor NVARCHAR(20) = 'FechaInicio' -- 'FechaInicio', 'FechaCreacion', 'NombrePlan'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pv.PlanId, pv.UsuarioId, pv.NombrePlan, pv.Descripcion, 
        pv.Destino, pv.Pais, pv.Ciudad, pv.FechaInicio, pv.FechaFin,
        pv.CantidadPersonas, pv.PresupuestoEstimado, pv.PresupuestoReal,
        pv.MonedaDestino, pv.TasaCambio, pv.EstadoPlan, pv.EsViajeInternacional,
        pv.MetaFinancieraId, mf.NombreMeta, pv.FechaCreacion, pv.FechaActualizacion,
        -- Informacin adicional calculada
        DATEDIFF(DAY, pv.FechaInicio, pv.FechaFin) as DuracionDias,
        DATEDIFF(DAY, GETDATE(), pv.FechaInicio) as DiasParaInicio,
        -- Estadsticas del plan
        (SELECT COUNT(*) FROM ActividadesViaje WHERE PlanId = pv.PlanId) as TotalActividades,
        (SELECT COUNT(*) FROM ChecklistViaje WHERE PlanId = pv.PlanId AND EstaCompletado = 0) as ItemsPendientes,
        ISNULL((SELECT SUM(Monto) FROM GastosViaje WHERE PlanId = pv.PlanId), 0) as TotalGastado,
        -- Porcentaje de progreso del presupuesto
        CASE 
            WHEN pv.PresupuestoEstimado > 0 THEN 
                ROUND((ISNULL((SELECT SUM(Monto) FROM GastosViaje WHERE PlanId = pv.PlanId), 0) * 100.0) / pv.PresupuestoEstimado, 2)
            ELSE 0 
        END as PorcentajePresupuestoUsado
    FROM PlanesVacaciones pv
    LEFT JOIN MetasFinancieras mf ON pv.MetaFinancieraId = mf.MetaId
    WHERE pv.UsuarioId = @UsuarioId
      AND (@EstadoPlan IS NULL OR pv.EstadoPlan = @EstadoPlan)
      AND (@AoViaje IS NULL OR YEAR(pv.FechaInicio) = @AoViaje)
      AND (@SoloActivos = 0 OR pv.EstadoPlan != 'cancelado') -- Lógica ajustada para SoloActivos
    ORDER BY 
        CASE 
            WHEN @OrdenarPor = 'FechaInicio' THEN pv.FechaInicio
            WHEN @OrdenarPor = 'FechaCreacion' THEN CAST(pv.FechaCreacion AS DATETIME2)
            ELSE pv.FechaInicio
        END,
        CASE WHEN @OrdenarPor = 'NombrePlan' THEN pv.NombrePlan ELSE '' END;
END;
GO

-- =============================================
-- SP: PlanesVacaciones_UpdateEstado
-- Descripcin: Actualiza solo el estado de un plan
-- =============================================
CREATE OR ALTER PROCEDURE PlanesVacaciones_UpdateEstado
    @PlanId UNIQUEIDENTIFIER,
    @NuevoEstado NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        -- Verificar que el plan existe
        IF NOT EXISTS (SELECT 1 FROM PlanesVacaciones WHERE PlanId = @PlanId)
        BEGIN
            RAISERROR('El plan de vacaciones no existe.', 16, 1);
            RETURN;
        END
        
        -- Validar estado
        IF @NuevoEstado NOT IN ('planificando', 'confirmado', 'en_curso', 'completado', 'cancelado')
        BEGIN
            RAISERROR('El estado debe ser: planificando, confirmado, en_curso, completado o cancelado.', 16, 1);
            RETURN;
        END
        
        -- Actualizar estado
        UPDATE PlanesVacaciones 
        SET EstadoPlan = @NuevoEstado,
            FechaActualizacion = GETUTCDATE()
        WHERE PlanId = @PlanId;
        
        SELECT 
            PlanId, NombrePlan, EstadoPlan, FechaActualizacion
        FROM PlanesVacaciones 
        WHERE PlanId = @PlanId;
        
    END TRY
    BEGIN CATCH
        SET @ErrorMessage = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

PRINT 'Procedimientos almacenados bsicos para tabla PLANESVACACIONES creados exitosamente';
PRINT 'SPs creados: PlanesVacaciones_Insert, PlanesVacaciones_Update, PlanesVacaciones_Delete, PlanesVacaciones_Select, PlanesVacaciones_SelectByUser, PlanesVacaciones_UpdateEstado';