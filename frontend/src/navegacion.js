// frontend/src/navegacion.js (Orquestador de Solapas)

export function configurarNavegacion() {
  // 1. Mapeamos de forma real, independiente y semántica las secciones del index.html
  const vistas = {
    'dashboard': { id: 'vista-dashboard', titulo: 'Panel de Control', sub: 'Estado de socios y recaudación en tiempo real.' },
    'socios': { id: 'vista-socios', titulo: 'Gestión de Alumnos', sub: 'Padrón de miembros activos, de altas y bajas.' },
    'cuotas': { id: 'vista-cuotas', titulo: 'Balances de Cuotas', sub: 'Proyección y auditoría de aranceles sociales de miembros.' },
    'caja': { id: 'seccion-caja', titulo: 'Caja y Contabilidad', sub: 'Control centralizado de flujos de efectivo, cuentas bancarias y egresos.' }, // 🎯 LA SECCIÓN OPERATIVA QUE ANALIZAMOS HOY
    'calendario': { id: 'vista-calendario', titulo: 'Control de Horarios', sub: 'Administración de turnos para canchas y reserva del salón.' } // 🗓️ RESERVADO PARA EL PRÓXIMO MÓDULO DE REGLAS
  };

  // 2. Definimos la función ruteadora interna
  function navegarA(pantallaDestino) {
    
 sessionStorage.setItem(
    'vista-activa',
    pantallaDestino
  );

    // Ocultamos todas las vistas agregando la clase 'hidden'
    Object.values(vistas).forEach(vista => {
      const el = document.getElementById(vista.id);
      if (el) el.classList.add('hidden');
    });

    // Mostramos la pantalla seleccionada quitando 'hidden'
    const vistaActiva = vistas[pantallaDestino];
    if (vistaActiva) {
      const elVista = document.getElementById(vistaActiva.id);
      const elTitulo = document.getElementById('titulo-pantalla');
      const elSubtitulo = document.getElementById('subtitulo-pantalla');

      if (elVista) elVista.classList.remove('hidden');
      if (elTitulo) elTitulo.innerText = vistaActiva.titulo;
      if (elSubtitulo) elSubtitulo.innerText = vistaActiva.sub;

      // 🔌 CONECTOR ACTIVO: Al tocar 'Caja y Contabilidad' en la barra lateral, disparamos la carga de Supabase
      if (pantallaDestino === 'caja' && typeof window.cargarMovimientosCaja === 'function') {
        window.cargarMovimientosCaja();
      }
    }
  }

const ultimaVista =
    sessionStorage.getItem('vista-activa')
    || 'dashboard';

  navegarA(ultimaVista);

  window.navegarA = navegarA;
}
