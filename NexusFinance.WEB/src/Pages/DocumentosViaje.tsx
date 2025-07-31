import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import { documentosViajeService } from '../services/documentosViajeService';
import { planesVacacionesService } from '../services/planesVacacionesService';
import { authService } from '../services/authService';
import DocumentoViajeModal from '../components/DocumentoViajeModal';
import DocumentoViajeModalSimple from '../components/DocumentoViajeModalSimple';
import type { DocumentoViaje } from '../types/documentoViaje';

import type { PlanVacaciones } from '../types/planVacaciones';
import Swal from 'sweetalert2';
import { gsap } from 'gsap';
import { Plus, FileText, RefreshCw, Edit, Trash2, Eye, Download, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

export default function DocumentosViaje() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoViaje[]>([]);
  const [plan, setPlan] = useState<PlanVacaciones | null>(null);
  const [planes, setPlanes] = useState<PlanVacaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(authService.getUser());
  const [editingDocumento, setEditingDocumento] = useState<DocumentoViaje | null>(null);
  const { showModal, hideModal } = useModal();

  // Referencias para animaciones
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (planId && currentUser?.usuarioId) {
      cargarDatos();
    } else if (currentUser?.usuarioId) {
      cargarPlanes();
    } else {
      setLoading(false);
    }
  }, [planId, currentUser?.usuarioId]);

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      const planesData = await planesVacacionesService.obtenerPlanesPorUsuario(currentUser!.usuarioId);
      setPlanes(planesData || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      setError('No se pudieron cargar los planes de vacaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    if (!planId) return;


    try {
      setLoading(true);
      
      // Cargar plan y documentos en paralelo
      const [planData, documentosData] = await Promise.all([
        planesVacacionesService.obtenerPlanPorId(planId),
        documentosViajeService.obtenerDocumentosPorPlan(planId)
      ]);


      setPlan(planData);
      setDocumentos(documentosData || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    // Animaciones de entrada
    const ctx = gsap.context(() => {
      if (!loading && documentos.length > 0) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [loading, documentos]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    cargarDatos();
  };

  const handleOpenModal = (documento?: DocumentoViaje) => {
    if (!planId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar el plan de viaje',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    setEditingDocumento(documento || null);
    showModal(
      <DocumentoViajeModal
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        planId={planId}
        editingDocumento={documento || null}
      />
    );
  };

  const handleCloseModal = () => {
    hideModal();
    setEditingDocumento(null);
  };

  const handleModalSuccess = async (action: 'created' | 'updated', documento: DocumentoViaje) => {
    cargarDatos();
    
    await Swal.fire({
      title: action === 'created' ? '¡Documento creado!' : '¡Documento actualizado!',
      text: action === 'created' 
        ? `"${documento.nombreDocumento}" ha sido agregado exitosamente`
        : `"${documento.nombreDocumento}" ha sido actualizado exitosamente`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl'
      }
    });
  };

  const handleDelete = async (documentoId: string, nombreDocumento: string) => {
    const result = await Swal.fire({
      title: '🗑️ Eliminar Documento',
      text: `¿Estás seguro de que quieres eliminar el documento "${nombreDocumento}"? Esta acción es irreversible.`, 
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Eliminando documento...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await documentosViajeService.eliminarDocumento(documentoId);
        
        await Swal.fire({
          title: '¡Eliminado!',
          text: 'El documento ha sido eliminado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-xl'
          }
        });

        setSuccess('Documento eliminado exitosamente');
        handleRefresh();
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: `No se pudo eliminar el documento: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          icon: 'error',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'rounded-xl'
          }
        });
        setError(`Error al eliminar el documento: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    total: documentos.length,
    verificados: documentos.filter(doc => doc.estaVerificado).length,
    pendientes: documentos.filter(doc => !doc.estaVerificado).length,
    obligatorios: documentos.filter(doc => doc.esObligatorio).length,
    conArchivo: documentos.filter(doc => doc.urlArchivo).length,
    porVencer: documentos.filter(doc => {
      if (!doc.fechaVencimiento) return false;
      const fechaVencimiento = new Date(doc.fechaVencimiento);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 30 && diasRestantes > 0;
    }).length,
    vencidos: documentos.filter(doc => {
      if (!doc.fechaVencimiento) return false;
      const fechaVencimiento = new Date(doc.fechaVencimiento);
      const hoy = new Date();
      return fechaVencimiento < hoy;
    }).length
  };

  const getTipoIcon = (tipo: string) => {
    const iconos: { [key: string]: string } = {
      pasaporte: '🛂',
      visa: '📋',
      reservas: '🏨',
      seguros: '🛡️',
      vuelos: '✈️',
      transporte: '🚗',
      actividades: '🎫',
      financiero: '💰',
      salud: '⚕️',
      otros: '📎'
    };
    return iconos[tipo] || '📄';
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      default:
        return '📎';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header Hero */}
        <div className="p-6">
          <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-6 py-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <button
                        onClick={() => navigate(`/planes-vacaciones/${planId}`)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold">Documentos de Viaje</h1>
                        <p className="text-purple-50 text-lg">{plan?.nombrePlan}</p>
                        <p className="text-purple-200 text-sm">{plan?.destino}</p>
                      </div>
                    </div>
                    
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                        <div className="text-purple-50 text-sm">Total</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-green-300">{estadisticas.verificados}</div>
                        <div className="text-purple-50 text-sm">Verificados</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-yellow-300">{estadisticas.pendientes}</div>
                        <div className="text-purple-50 text-sm">Pendientes</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-blue-300">{estadisticas.conArchivo}</div>
                        <div className="text-purple-50 text-sm">Con Archivo</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-orange-300">{estadisticas.porVencer}</div>
                        <div className="text-purple-50 text-sm">Por Vencer</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-red-300">{estadisticas.vencidos}</div>
                        <div className="text-purple-50 text-sm">Vencidos</div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={contentRef} className="max-w-7xl mx-auto px-6 py-8">

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Éxito:</span>
                <span>{success}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Cargando documentos...</p>
              </div>
            </div>
          ) : !planId ? (
            <div className="py-8">
              <div className="max-w-7xl mx-auto">

                {planes.length === 0 ? (
                  /* Estado vacío mejorado */
                  <div className="max-w-md mx-auto text-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No tienes planes de vacaciones
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Para gestionar documentos de viaje, primero necesitas crear un plan de vacaciones.
                      </p>
                      <button
                        onClick={() => navigate('/planes-vacaciones')}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Crear Mi Primer Plan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Lista de planes mejorada */
                  <div className="space-y-8">

                    {/* Grid de planes mejorado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {planes.map((plan) => {
                        const diasRestantes = Math.ceil((new Date(plan.fechaInicio).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const estaProximo = diasRestantes > 0 && diasRestantes <= 30;
                        const yaEmpezó = new Date(plan.fechaInicio) <= new Date();
                        const yaTerminó = new Date(plan.fechaFin) < new Date();

                        return (
                          <div
                            key={plan.planId}
                            className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1"
                          >
                            {/* Header de la tarjeta */}
                            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 px-6 py-4 border-b border-gray-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                                    {plan.nombrePlan}
                                  </h3>
                                  <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                                    <span>📍</span>
                                    <span className="font-medium">{plan.destino}</span>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                                  plan.estadoPlan === 'completado' ? 'bg-green-100 text-green-800' :
                                  plan.estadoPlan === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                                  plan.estadoPlan === 'confirmado' ? 'bg-purple-100 text-purple-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {plan.estadoPlan.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Contenido de la tarjeta */}
                            <div className="p-6">
                              {/* Fechas y estado del viaje */}
                              <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {new Date(plan.fechaInicio).toLocaleDateString('es-CO', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })} - {new Date(plan.fechaFin).toLocaleDateString('es-CO', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                </div>

                                {/* Indicador de tiempo */}
                                {!yaTerminó && (
                                  <div className={`flex items-center gap-2 text-sm ${
                                    estaProximo ? 'text-orange-600' : yaEmpezó ? 'text-blue-600' : 'text-gray-600'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                      estaProximo ? 'bg-orange-400' : yaEmpezó ? 'bg-blue-400' : 'bg-gray-400'
                                    }`}></div>
                                    <span>
                                      {yaEmpezó ? 'En curso' : 
                                       estaProximo ? `Inicia en ${diasRestantes} días` : 
                                       `Faltan ${diasRestantes} días`}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Descripción */}
                              {plan.descripcion && (
                                <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                                  {plan.descripcion}
                                </p>
                              )}

                              {/* Botón de acción */}
                              <button
                                onClick={() => navigate(`/documentos-viaje/${plan.planId}`)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
                              >
                                <FileText className="w-4 h-4" />
                                <span>Gestionar Documentos</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer con acceso rápido */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">¿Necesitas crear un nuevo plan?</h4>
                          <p className="text-sm text-gray-600">Organiza tu próximo viaje y gestiona todos sus documentos</p>
                        </div>
                        <button
                          onClick={() => navigate('/planes-vacaciones')}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Nuevo Plan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No tienes documentos de viaje registrados
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza subiendo tu primer documento para este plan de vacaciones.
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Subir Mi Primer Documento</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-fuchsia-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Documento</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tipo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fechas</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Archivo</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documentos.map((documento) => {
                      const diasRestantes = documento.fechaVencimiento 
                        ? Math.ceil((new Date(documento.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      const estaVencido = documento.fechaVencimiento && new Date(documento.fechaVencimiento) < new Date();
                      const porVencer = diasRestantes && diasRestantes <= 30 && diasRestantes > 0;

                      return (
                        <tr key={documento.documentoId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{documento.nombreDocumento}</div>
                              {documento.numeroDocumento && (
                                <div className="text-sm text-gray-500">#{documento.numeroDocumento}</div>
                              )}
                              {documento.notas && (
                                <div className="text-xs text-gray-400 mt-1">{documento.notas}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getTipoIcon(documento.tipoDocumento)}</span>
                              <span className="text-sm text-gray-700 capitalize">{documento.tipoDocumento}</span>
                              {documento.esObligatorio && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Obligatorio
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {documento.fechaExpedicion && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>Exp: {new Date(documento.fechaExpedicion).toLocaleDateString()}</span>
                                </div>
                              )}
                              {documento.fechaVencimiento && (
                                <div className={`flex items-center gap-1 ${estaVencido ? 'text-red-600' : porVencer ? 'text-yellow-600' : 'text-gray-500'}`}>
                                  <Calendar className="w-4 h-4" />
                                  <span>Venc: {new Date(documento.fechaVencimiento).toLocaleDateString()}</span>
                                  {diasRestantes !== null && (
                                    <span className="text-xs">
                                      ({diasRestantes > 0 ? `${diasRestantes} días` : diasRestantes === 0 ? 'Hoy' : `${Math.abs(diasRestantes)} días atrás`})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {documento.estaVerificado ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />
                                  Verificado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertCircle className="w-3 h-3" />
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {documento.urlArchivo ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getFileIcon(documento.urlArchivo)}</span>
                                <div className="flex gap-1">
                                  <a
                                    href={documento.urlArchivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver archivo"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={documento.urlArchivo}
                                    download
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Descargar archivo"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Sin archivo</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(documento)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar documento"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(documento.documentoId, documento.nombreDocumento)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar documento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}