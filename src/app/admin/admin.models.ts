// ─── Admin Models ────────────────────────────────────────────────────────────

export interface AdminKpis {
  usuariosTotal: number;
  usuariosDelta: number;
  productosActivos: number;
  productosDelta: number;
  ofertasActivas: number;
  ofertasDelta: number;
  comprasHoy: number;
  comprasDelta: number;
  revenueMes: number;
  revenueDelta: number;
  reportesPendientes: number;
  reportesDelta: number;
  nexusGmvTotal: number;
  nexusComisionTotal: number;
  nexusComisionMes: number;
  nexusComisionAnio: number;
}

export interface DiaValorDTO {
  dia: string;
  valor: number;
}

export interface CatValorDTO {
  categoria: string;
  valor: number;
}

export interface AdminUsuario {
  id: number;
  user: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  avatar?: string;
  rol?: string;
  tipoCuenta?: string;
  esVerificado: boolean;
  cuentaVerificada: boolean;
  baneado: boolean;
  suspendidoHasta?: string;
  motivoSuspension?: string;
  motivoBan?: string;
  fechaRegistro?: string;
  totalVentas: number;
  reportesRecibidos: number;
  flagFraude: boolean;
  motivoFlag?: string;
  reputacion: number;
}

export interface AdminReporte {
  id: number;
  tipo: string;
  motivo: string;
  descripcion?: string;
  estado: string;
  fecha: string;
  reportador: { id: number; user: string; avatar?: string };
  actorDenunciado?: { id: number; user: string; avatar?: string };
  productoDenunciado?: { id: number; titulo: string; imagenPrincipal?: string };
  ofertaDenunciada?: { id: number; titulo: string };
  comentarioDenunciado?: { id: number; contenido: string };
  resolucion?: string;
  fechaResolucion?: string;
  notaInterna?: string;
}

export interface AdminDevolucion {
  id: number;
  estado: string;
  motivo: string;
  descripcion?: string;
  importeReembolso?: number;
  compra: {
    id: number;
    precioFinal: number;
    fechaCompra: string;
    comprador: { id: number; user: string; avatar?: string };
    producto: { id: number; titulo: string; imagenPrincipal?: string };
    vendedor?: { id: number; user: string; avatar?: string };
  };
  evidencias?: string[];
  fechaSolicitud?: string;
}

export interface AdminSancion {
  id: number;
  user: string;
  avatar?: string;
  tipo: 'SUSPENSION' | 'BAN';
  motivo: string;
  motivoLevantamiento?: string;
  adminQueSanciono?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
}

export interface AuditLogEntry {
  id: number;
  adminUser: string;
  accion: string;
  entidadTipo: string;
  entidadId?: number;
  detalle?: string;
  ip: string;
  timestamp: string;
}

export interface AdminHealth {
  version: string;
  uptime: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
}

export interface AdminFraudeFlag {
  id: number;
  user: string;
  avatar?: string;
  motivo: string;
  nReportes: number;
  nVentasFallidas: number;
  fechaPrimerFlag: string;
  estado: string;
}

export interface AdminProductoSospechoso {
  id: number;
  titulo: string;
  imagenPrincipal?: string;
  precio: number;
  mediaPorCategoria: number;
  porcentajeBajoMedia: number;
  vendedor: { id: number; user: string };
  categoria: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── Nuevos Modelos Admin ──────────────────────────────────────────────────

export interface AdminProducto {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: string;
  fechaPublicacion: string;
  pausadoHasta?: string;
  motivoPausa?: string;
  destacado: boolean;
  vendedor: { id: number; user: string; avatar?: string };
  categoria?: { id: number; nombre: string; slug: string };
  imagenPrincipal?: string;
  nReportes?: number;
}

export interface AdminOferta {
  id: number;
  titulo: string;
  descripcion: string;
  precioOferta: number;
  precioOriginal: number;
  estado: string;
  esActiva: boolean;
  fechaPublicacion: string;
  destacada: boolean;
  esFlash: boolean;
  flashFin?: string;
  limiteUnidades?: number;
  actor: { id: number; user: string; avatar?: string };
  categoria?: { id: number; nombre: string };
  votos?: number;
  imagenPrincipal?: string;
  tienda?: string;
  urlOferta?: string;
}

export interface AdminVehiculo {
  id: number;
  titulo: string;
  marca: string;
  modelo: string;
  precio: number;
  tipoVehiculo: string;
  estadoVehiculo: string;
  anio: number;
  kilometros: number;
  combustible: string;
  fechaPublicacion: string;
  imagenPrincipal?: string;
  publicador: { id: number; user: string };
}

export interface AdminCategoria {
  id: number;
  nombre: string;
  slug: string;
  icono?: string;
  color?: string;
  activa: boolean;
  orden: number;
  parent?: AdminCategoria;
  hijos: AdminCategoria[];
  nProductos?: number;
  nOfertas?: number;
}

export interface AdminCupon {
  id: number;
  codigo: string;
  tipo: 'PORCENTAJE' | 'FIJO' | 'ENVIO_GRATIS' | 'COMBINADO';
  valor?: number;
  valorFijo?: number;
  valorPorcentaje?: number;
  importeMinimo?: number;
  topeMaximo?: number;
  alcance: 'TODOS' | 'USUARIO' | 'GRUPO';
  usuario?: { id: number; user: string; avatar?: string };
  grupoObjetivo?: string;
  limiteUsoTotal?: number;
  limiteUsoPorUsuario: number;
  fechaInicio: string;
  fechaFin?: string;
  categoriasIds?: string;
  descripcionInterna: string;
  activo: boolean;
  totalUsos: number;
  creadoEn: string;
}

export interface CuponUso {
  id: number;
  cupon: { id: number; codigo: string };
  usuario: { id: number; user: string; avatar?: string };
  compra: { id: number; precioFinal: number };
  fechaUso: string;
  importeAhorro: number;
}

export interface CuponStats {
  activos: number;
  usosMes: number;
  ahorroTotal: number;
  masUsado: string;
  numUsos: number;
  mayorAhorro: string;
}


export interface AdminEmpresa {
  id: number;
  nombreComercial: string;
  cif: string;
  logo?: string;
}

export interface AdminContrato {
  id: number;
  tipoContrato: 'BANNER' | 'PUBLICACION';
  estado: string;
  fecha: string;
  fechaInicio?: string;
  fechaFin?: string;
  monto: number;
  descripcion?: string;
  productoId?: number | null;
  textoBanner?: string | null;
  urlClick?: string | null;
  empresa: AdminEmpresa;
}

export interface AdminEnvio {
  id: number;
  codigoEnvio: string;
  transportista: string;
  estado: string;
}

export interface AdminCompra {
  id: number;
  precioFinal: number;
  costoEnvio: number;
  comisionNexus: number;
  estado: string;
  fechaCompra: string;
  metodoEntrega: string;
  comprador: { id: number; user: string; avatar?: string };
  vendedor: { id: number; user: string; avatar?: string };
  producto: { id: number; titulo: string; imagenPrincipal?: string };
  envio?: AdminEnvio;
}
