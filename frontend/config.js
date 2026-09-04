// ==============================================================
// ⚙️ CONFIGURACIÓN DINÁMICA DE LA INSTITUCIÓN (MARCA BLANCA)
// ==============================================================

// frontend/config.js
const CONFIG_INSTITUCION = {
  nombre: "Viva Italia",

  subtitulo: "Instituto de Lengua Italiana",
  escudoUrl: "VivaItalia.jpeg", // escudoUrl: "ClubVA.png",


  emojiDefecto: "&#x1F1EE;&#x1F1F9;",
  version: "v1.0.0 - SaaS Online", 

  //Porcentaje de recargo por mora (5% por defecto)
  recargoMoraPorcentaje: 5,
  //activar o desactivar el recargo por mora (true/false)
  modulosActivos: {
    recargosMora: true
  },

terminos: {
    singular: "Alumno", 
    plural: "Alumnos", 
    nuevoEntidad: "Nuevo Alumno",
    padronEntidad: "Padrón de Alumnos",
    gestionEntidad: "Gestión de Alumnos",
    cuotaConcepto: "Cuota Mensual",
    rolPrincipal: "Titular" 
  },

  // 🎛️ Registro Maestro de Módulos (UI + Interruptores unificados)
  // Al mover esto aquí, eliminamos por completo el hardcodeo del componente visual.
  modulos: [
    { id: 'dashboard', texto: 'Dashboard', icono: 'fas fa-chart-pie', color: 'text-blue-400', activo: true },
{ id: 'socios', texto: 'Alumnos', icono: 'fas fa-users', color: 'text-emerald-400', activo: true, usaTerminoPlural: true },
    { id: 'cuotas', texto: 'Cuotas', icono: 'fas fa-receipt', color: 'text-amber-400', activo: true },
    { id: 'caja', texto: 'Caja y Contabilidad', icono: 'fas fa-cash-register', color: 'text-cyan-400', activo: true },
    { id: 'calendario', texto: 'Calendario', icono: 'fas fa-calendar-alt', color: 'text-indigo-400', activo: true },
    { id: 'eventos', texto: 'Eventos', icono: 'fas fa-trophy', color: 'text-orange-400', activo: false },
    { id: 'perfiles', texto: 'Perfiles y Permisos', icono: 'fas fa-user-shield', color: 'text-purple-400', activo: false }
  ],

  planesDisponibles: ["Individual", "Grupal"],
  montoBaseDefault: 5000.00,
};

window.AppConfig = CONFIG_INSTITUCION;
