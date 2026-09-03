// frontend/app.js
import { iniciarRelojLocal } from './src/reloj.js';
import { configurarNavegacion } from './src/navegacion.js';
import { obtenerDatosDashboard } from './src/api.js';
import { configurarModalPago } from './src/modals/modal-pago.js';
import { configurarModalSocio } from './src/modals/modal-socio.js';
import { exportarExcelContable, exportarPDFContable } from './src/reportes.js';
import { API_URL } from './src/config-api.js';
import { MESES, poblarSelectorMeses,  obtenerMesActual} from './src/fechas.js';
import { guardarComprobante, mostrarModalComprobante, emitirComprobante} from './src/comprobantes.js';
import { abrirFichaHistorica, cerrarFichaHistorica} from './src/ficha-historica.js';
import {  inicializarAuditoriaCuotas} from './src/auditoria-cuotas.js';
import './src/modals/modal-caja.js';
import './src/caja.js';
import {  inicializarCalendario} from './src/calendario.js';

let todosLosSocios = [];
let procesandoCobro = false;

function aplicarConfiguracionVisual() {
  const cfg = window.AppConfig;
  if (!cfg) return;
  const subtituloLogin = document.getElementById('login-subtitulo-dinamico');
  if (subtituloLogin) {
    subtituloLogin.innerText = `${cfg.nombre} - Panel Administrativo`;
  }
  const emailInput = document.getElementById('login-email');
  if (emailInput) {
    emailInput.placeholder = 'ejemplo@institucion.com'; 
  }
  const imgEscudo = document.getElementById('app-escudo-img');
  if (imgEscudo) {
    imgEscudo.src = cfg.escudoUrl;
     // 👇 AGREGA ESTAS LÍNEAS PARA MEJORAR LA IMAGEN 👇
    imgEscudo.style.width = '60px';          // Ajusta el ancho al tamaño real de tu menú
    imgEscudo.style.height = '60px';         // Fuerza a que sea un cuadrado perfecto
    imgEscudo.style.objectFit = 'contain';   // Evita que la imagen se estire o se deforme
    imgEscudo.style.borderRadius = '50%';    // Si tu logo es circular (como el de Viva Italia), lo hace un círculo perfecto
    
    imgEscudo.onerror = function() {
      this.style.display = 'none';
      this.parentElement.innerHTML = cfg.emojiDefecto || ' ';
    };
  }
  document.getElementById('app-nombre-entidad').innerText = cfg.nombre;
  document.getElementById('app-subtitulo-entidad').innerText = cfg.subtitulo;
  document.getElementById('menu-txt-plural').innerText = cfg.terminos.plural;
  document.getElementById('btn-txt-nuevo').innerText = `+ ${cfg.terminos.nuevoEntidad}`;
  document.getElementById('th-dashboard-entidad').innerText = `${cfg.terminos.singular} / Nombre`;
  document.getElementById('th-padron-entidad').innerText = `${cfg.terminos.singular} / Ficha`;
  document.getElementById('txt-modal-titulo-alta').innerText = cfg.terminos.nuevoEntidad;
}

async function cargarDashboard() {
  const badge = document.getElementById('badge-conexion');
  const dot = document.getElementById('dot-conexion');
  const txt = document.getElementById('txt-conexion');
  try {
    const datos = await obtenerDatosDashboard();
    todosLosSocios = datos.socios;
    
    const sociosActivos = todosLosSocios.filter(s => s.estado !== 'Inactivo');
    const verdes = sociosActivos.filter(s => s.estadoSemaforo === 'Verde').length;
    const amarillos = sociosActivos.filter(s => s.estadoSemaforo === 'Amarillo').length;
    const rojos = sociosActivos.filter(s => s.estadoSemaforo === 'Rojo').length;
    const totalActivos = sociosActivos.length;

    document.getElementById('txt-total').innerText = totalActivos;
    document.getElementById('txt-verdes').innerText = verdes;
    document.getElementById('txt-amarillos').innerText = amarillos;
    document.getElementById('txt-rojos').innerText = rojos;

    renderizarTabla(sociosActivos); 
    renderizarPadronSocios(todosLosSocios); 
    
    // Disparamos la sincronización de las tarjetas de aranceles
    //window.recalcularMetricasCuotasPorMes();

    
    if (txt) txt.innerText = "Sincronizado";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse";
    if (badge) badge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 transition-all duration-300";
  } catch (error) {
    console.error("Error al sincronizar dashboard:", error);
    if (document.getElementById('tabla-socios-body')) {
      document.getElementById('tabla-socios-body').innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500 font-semibold">❌ No se pudo conectar con el servidor.</td></tr>`;
    }
    if (txt) txt.innerText = "Desconectado";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full bg-rose-500";
    if (badge) badge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 transition-all duration-300";
  }
}

function renderizarTabla(listaDeSocios) {
  const tbody = document.getElementById('tabla-socios-body');
  if (!tbody) return;
  const configuracionSemaforo = {
    'Verde': { claseBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100', claseDot: 'bg-emerald-500' },
    'Amarillo': { claseBadge: 'bg-amber-50 text-amber-700 border-amber-100', claseDot: 'bg-amber-500' },
    'Rojo': { claseBadge: 'bg-rose-50 text-rose-700 border-rose-100', claseDot: 'bg-rose-500' },
    'Gris': { claseBadge: 'bg-slate-50 text-slate-600 border-slate-200', claseDot: 'bg-slate-400' }
  };
  tbody.innerHTML = listaDeSocios.map(socio => {
    const estilo = configuracionSemaforo[socio.estadoSemaforo] || { claseBadge: 'bg-gray-50 text-gray-600 border-gray-100', claseDot: 'bg-gray-400' };
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/60 transition text-sm">
        <td class="p-4 pl-6">
      <span class="font-bold text-slate-800"> ${socio.nombre} ${socio.apellido || ''}</span>
        </td>
        <td class="p-4 text-gray-500"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">${socio.tipo}</span></td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${estilo.claseBadge}">
            <span class="w-1.5 h-1.5 rounded-full ${estilo.claseDot}"></span>${socio.leyendaSemaforo || socio.estadoSemaforo}
          </span>
        </td>
        <td class="p-4 pr-6 text-right space-x-1">
          <button onclick="abrirModalConfirmarPago('${socio.id}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded border border-emerald-200 transition cursor-pointer active:scale-[0.97]">Cobrar</button>
          <button onclick="abrirModalWhatsApp('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-3 rounded border border-blue-200 transition cursor-pointer active:scale-[0.97]">Alerta</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderizarPadronSocios(listaDeSocios) {
  const tbody = document.getElementById('tabla-padron-body');
  if (!tbody) return;
  tbody.innerHTML = listaDeSocios.map(socio => {
    const esActivo = socio.estado !== 'Inactivo'; 
    const claseEstado = esActivo ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-gray-100 text-gray-600 border-gray-300';
    const textoBotonBaja = esActivo ? '🔻 Baja' : '🟢 Activar';
    const completoNombre = `${socio.nombre} ${socio.apellido || ''}`.trim();
    const nombreEscapado = completoNombre.replace(/'/g, "\\'");
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/60 transition text-sm text-gray-700">
        <td class="p-4 pl-6">
          <span onclick="window.verFichaDetalladaSocio('${socio.id}')" class="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">${completoNombre}</span>
          <span class="block text-[10px] text-gray-400 font-sans tracking-wide mt-0.5">${socio.direccion || 'Sin dirección'}</span>
        </td>
        <td class="p-4 font-mono font-medium text-gray-900">${socio.dni}</td>
        <td class="p-4">
          <div class="text-gray-900 font-medium">${socio.telefono || 'Sin número'}</div>
          <div class="text-gray-400 text-xs font-sans">${socio.email || 'Sin correo'}</div>
        </td>
        <td class="p-4">
          <div class="font-bold text-gray-800">${socio.tipo}</div>
          <div class="text-[11px] text-gray-500 font-sans font-medium mt-0.5">${socio.actividad || 'General'} • ${socio.categoria || 'Socio'}</div>
        </td>
        <td class="p-4 text-center font-medium text-gray-600">${socio.fechaAlta ? new Date(socio.fechaAlta).toLocaleDateString('es-AR') : '-'}</td> 
        <td class="p-4 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold border-l-4 ${claseEstado}">${esActivo ? 'Activo' : 'Inactivo'}</span></td>
        <td class="p-4 pr-6">
          <div class="flex justify-end gap-1.5">
            <button onclick="window.toggleBajaSocio('${socio.id}')" class="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-2.5 rounded border border-gray-200 transition cursor-pointer active:scale-[0.97]">${textoBotonBaja}</button>
            <button onclick="window.abrirModalEditarSocio('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-2.5 rounded border border-blue-200 transition cursor-pointer active:scale-[0.97]">✏️</button>
            <button onclick="window.eliminarSocioPadrón('${socio.id}', '${nombreEscapado}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-2.5 rounded border border-rose-200 transition cursor-pointer active:scale-[0.97]">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.abrirModalEditarSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  document.getElementById('edit-form-id').value = socio.id;
  document.getElementById('edit-form-nombre').value = socio.nombre;
  document.getElementById('edit-form-apellido').value = socio.apellido || '';
  document.getElementById('edit-form-dni').value = socio.dni;
  document.getElementById('edit-form-telefono').value = socio.telefono || '';
  document.getElementById('edit-form-email').value = socio.email || '';
  document.getElementById('edit-form-direccion').value = socio.direccion || '';
  document.getElementById('edit-form-tipo').value = socio.tipo || '';
  document.getElementById('edit-form-monto').value = socio.montoCuota || 0;
  document.getElementById('edit-form-notas').value = socio.notas || '';
  document.getElementById('edit-form-actividad').value = socio.actividad || '';
  document.getElementById('edit-form-categoria').value = socio.categoria || '';
  if (socio.fechaNacimiento) document.getElementById('edit-form-nacimiento').value = socio.fechaNacimiento.split('T')[0];
  if (socio.fechaVencimiento) document.getElementById('edit-form-vencimiento').value = socio.fechaVencimiento.split('T')[0];
  document.getElementById('modal-editar-socio').classList.remove('hidden');
}

window.cerrarModalEditarSocio = function() {
  document.getElementById('modal-editar-socio').classList.add('hidden');
}

window.toggleBajaSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  const esActivo = socio.estado !== 'Inactivo';
  const proximoEstado = esActivo ? 'Inactivo' : 'Activo';
  document.getElementById('lbl-baja-titulo').innerText = esActivo ? ' 🔻 Confirmar Baja' : ' 🟢 Activar Miembro';
  document.getElementById('lbl-baja-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  const btnEjecutar = document.getElementById('btn-baja-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      await fetch(`${API_URL}/socios/${idSocio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...socio, estado: proximoEstado })
      });
      document.getElementById('modal-baja-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("⚠️ Error de conexión al procesar el cambio de estado.");
    }
  };
  document.getElementById('modal-baja-confirmar').classList.remove('hidden');
}

window.eliminarSocioPadrón = function(idSocio, nombreSocio) {
  document.getElementById('lbl-eliminar-nombre').innerText = nombreSocio;
  const btnEjecutar = document.getElementById('btn-eliminar-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      const res = await fetch(`${API_URL}/socios/${idSocio}`, {
  method: 'DELETE'
});
      if (!res.ok) throw new Error();
      document.getElementById('modal-eliminar-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("⚠️ Error de comunicación con la base de datos cloud.");
    }
  };
  document.getElementById('modal-eliminar-confirmar').classList.remove('hidden');
}
// frontend/app.js (Alertas, Pasarelas y Auditoría de Aranceles) - PARTE 4-A

let socioWhatsAppActivo = null;
let tipoNotificacionActual = 'vencido';

window.abrirModalWhatsApp = function (idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioWhatsAppActivo = socio;
  tipoNotificacionActual = socio.estadoSemaforo === 'Rojo' ? 'vencido' : 'proximo';
  
  document.getElementById('wa-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('wa-socio-telefono').innerText = socio.telefono || 'Sin número';
  document.getElementById('wa-socio-iniciales').innerText = socio.nombre.substring(0, 2).toUpperCase();
  
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
  document.getElementById('modal-whatsapp').classList.remove('hidden');
}

window.cerrarModalWhatsApp = function () {
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

window.cambiarTipoMensajeWhatsApp = function (nuevoTipo) {
  tipoNotificacionActual = nuevoTipo;
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
}

function actualizarDiseñoBotonesTipoRecordatorio() {
  const btnVencido = document.getElementById('btn-wa-vencido');
  const btnProximo = document.getElementById('btn-wa-proximo');
  if (tipoNotificacionActual === 'vencido') {
    btnVencido.className = "p-3 border-2 border-rose-500 rounded-xl text-left transition bg-rose-50/50 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-amber-400 cursor-pointer";
  } else {
    btnVencido.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-rose-400 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-amber-500 rounded-xl text-left transition bg-amber-50/50 cursor-pointer";
  }
}

function armarPlantillaMensajeTexto() {
  if (!socioWhatsAppActivo) return;
  const txt = tipoNotificacionActual === 'vencido' ? 'VENCIDO' : 'próxima a vencer';
  document.getElementById('txt-wa-cuerpo').value = `Hola ${socioWhatsAppActivo.nombre},\n\nTe recordamos que tu cuota de $${socioWhatsAppActivo.montoCuota || 0} se encuentra en estado ${txt}.`;
}

window.dispararPestañaWhatsApp = function () {
  const urlFinal = `https://wa.me/${socioWhatsAppActivo.telefono}?text=${encodeURIComponent(document.getElementById('txt-wa-cuerpo').value)}`;
  window.open(urlFinal, '_blank');
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

// --- COBROS ---
let socioCobroActivo = null;
let modalidadCobroActual = 'total';
let montoFinalCobro = 0;

function recalcularMontoFinalCobro() {
  if (!socioCobroActivo) return 0;
  let montoBase =
    modalidadCobroActual === 'parcial'
      ? parseFloat(document.getElementById('input-monto-parcial')?.value) || 0
      : parseFloat(socioCobroActivo.montoCuota || 0 );

  const checkRecargo = document.getElementById('check-recargo-mora');
  if (
    checkRecargo?.checked && socioCobroActivo.estadoSemaforo === 'Rojo'
  ) {
    const porcentaje = window.AppConfig?.recargoMoraPorcentaje || 0;
    montoBase +=  montoBase * porcentaje / 100;  
  }
  montoFinalCobro = montoBase;
  return montoFinalCobro;
}

const porcentajeRecargo = window.AppConfig?.recargoMoraPorcentaje || 0;

const textoRecargo =
  document.querySelector(
    '#contenedor-recargo-mora .font-semibold'
  );

if (textoRecargo) {
  textoRecargo.innerText =
    `Aplicar recargo por mora (${porcentajeRecargo}%)`;
}

window.abrirModalConfirmarPago = function (idSocio) {  
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioCobroActivo = socio;
  modalidadCobroActual = 'total';
let montoPlan = parseFloat(socio.montoCuota || socio.monto_cuota);
  montoFinalCobro = montoPlan;
  const inputParcial =
  document.getElementById(
    'input-monto-parcial'
  );

if (inputParcial) {

  inputParcial.oninput = function () {

    const total =
      recalcularMontoFinalCobro();

    document.getElementById(
      'pago-monto-txt'
    ).innerText =
      `$${total.toLocaleString('es-AR', {
        minimumFractionDigits: 2
      })}`;
  };
}
if (isNaN(montoPlan) || montoPlan <= 0) {
  alert(
    'El socio no tiene una cuota válida configurada. Revise la ficha antes de cobrar.'
  );
  return;
}
  
if (socio.estadoSemaforo === 'Rojo') {
  document
    .getElementById('contenedor-recargo-mora')
    ?.classList.remove('hidden');
} else {
  document
    .getElementById('contenedor-recargo-mora')
    ?.classList.add('hidden');
}
const checkRecargo =
  document.getElementById('check-recargo-mora');
//console.log('check encontrado:', checkRecargo);
if (checkRecargo) {
  checkRecargo.checked = false;

checkRecargo.onchange = function () {

  const total =
    recalcularMontoFinalCobro();

 if (!checkRecargo.checked) {

  document.getElementById(
    'lbl-recargo-monto'
  ).innerText = '$0,00';

  document.getElementById(
    'lbl-recargo-total'
  ).innerText =
    `$${total.toLocaleString('es-AR', {
      minimumFractionDigits: 2
    })}`;
} else {

    const porcentaje =
      window.AppConfig?.recargoMoraPorcentaje || 0;

    const recargo =
      montoPlan * porcentaje / 100;

    document.getElementById(
      'lbl-recargo-monto'
    ).innerText =
      `$${recargo.toLocaleString('es-AR', {
        minimumFractionDigits: 2
      })}`;

    document.getElementById(
      'lbl-recargo-total'
    ).innerText =
      `$${total.toLocaleString('es-AR', {
        minimumFractionDigits: 2
      })}`;
  }

  document.getElementById(
    'pago-monto-txt'
  ).innerText =
    `$${total.toLocaleString('es-AR', {
      minimumFractionDigits: 2
    })}`;
};
}
 
  const fechaRef = socio.fechaVencimiento || socio.fecha_vencimiento;
  let dateObj = new Date();
  if (fechaRef) dateObj = new Date(typeof fechaRef === 'string' ? fechaRef.split('T')[0].replace(/-/g, '/') : fechaRef);
  if (isNaN(dateObj.getTime())) dateObj = new Date();

  
  document.getElementById('pago-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('pago-servicio-txt').innerHTML = `${socio.tipo || 'Cuota'} <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs ml-1 font-black uppercase">Abona: ${MESES[dateObj.getMonth()]} ${dateObj.getFullYear()}</span>`;
  document.getElementById('pago-monto-txt').innerText = `$${montoPlan.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
  document.getElementById('pago-vencimiento-txt').innerText = fechaRef ? new Date(fechaRef).toLocaleDateString('es-AR') : '-';
  document.getElementById('txt-pago-notas').value = '';
  document.getElementById('input-monto-parcial').value = montoPlan;
  document.getElementById('contenedor-monto-parcial').classList.add('hidden');
  actualizarDisenoBotonesCobro(); 
  document.getElementById('modal-confirmar-pago').classList.remove('hidden');
}

window.cerrarModalConfirmarPago = function () {
  document.getElementById('modal-confirmar-pago').classList.add('hidden');
}

window.seleccionarTipoCobro = function (modalidad) {
  modalidadCobroActual = modalidad;
  actualizarDisenoBotonesCobro();
  if (modalidad === 'parcial') {
    document.getElementById('contenedor-monto-parcial').classList.remove('hidden');
  } else {
    document.getElementById('contenedor-monto-parcial').classList.add('hidden');
  }

  const total = recalcularMontoFinalCobro();

  document.getElementById('pago-monto-txt').innerText = `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};

function actualizarDisenoBotonesCobro() {
  const btnTotal = document.getElementById('btn-pago-total');
  const btnParcial = document.getElementById('btn-pago-parcial');
  if (modalidadCobroActual === 'total') {
    btnTotal.className = "p-3 border-2 border-emerald-500 rounded-xl bg-emerald-50/50 cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
  } else {
    btnTotal.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-amber-500 rounded-xl bg-amber-50/50 cursor-pointer text-center";
  }
}

window.procesarCobroDefinitivo = async function () {

  if (procesandoCobro) return;

  procesandoCobro = true;

  const btn =
    document.getElementById(
      'btn-confirmar-pago'
    );

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Procesando...';
  }

  try {

    if (!socioCobroActivo) {
      throw new Error(
        'No hay un socio seleccionado.'
      );
    }

    const notas =
      document.getElementById(
        'txt-pago-notas'
      ).value.trim();

    const medio =
      document.getElementById(
        'select-pago-medio'
      ).value;

    recalcularMontoFinalCobro();

    const res =
      await fetch(
        `${API_URL}/socios/${socioCobroActivo.id}/cobrar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monto: montoFinalCobro,
            medioPago: medio,
            notas,
            tipoVencimiento: 'calendario'
          })
        }
      );

    const respuestaAPI =
      await res.json();

    if (!res.ok) {
      throw new Error(
        respuestaAPI.error ||
        'Error de respuesta'
      );
    }

    guardarComprobante({
      numeroRecibo:
        respuestaAPI.numeroRecibo,

      periodo:
        `${respuestaAPI.mesLiquidado} ${respuestaAPI.anioLiquidado}`,

      nombreCompleto:
        `${socioCobroActivo.nombre} ${socioCobroActivo.apellido || ''}`,

      dni:
        socioCobroActivo.dni,

      tipo:
        socioCobroActivo.tipo,

      medio:
        document.getElementById(
          'select-pago-medio'
        ).options[
          document.getElementById(
            'select-pago-medio'
          ).selectedIndex
        ]?.text || 'Efectivo',

      monto:
        montoFinalCobro
    });

    document
      .getElementById(
        'modal-confirmar-pago'
      )
      .classList.add('hidden');

    document
      .getElementById(
        'lbl-pagoexito-nombre'
      )
      .innerText =
      `${socioCobroActivo.nombre} ${socioCobroActivo.apellido || ''}`;

    document
      .getElementById(
        'lbl-pagoexito-monto'
      )
      .innerText =
      `$${montoFinalCobro.toLocaleString(
        'es-AR',
        {
          minimumFractionDigits: 2
        }
      )}`;

    document
      .getElementById(
        'lbl-pagoexito-tipo'
      )
      .innerHTML =
      `${modalidadCobroActual === 'total'
        ? 'Pago Total'
        : 'Pago Parcial'
      } <br>
      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Período:
        ${respuestaAPI.mesLiquidado || ''}
        ${respuestaAPI.anioLiquidado || ''}
      </span>`;

    document
      .getElementById(
        'modal-pago-exito'
      )
      .classList.remove('hidden');

    await cargarDashboard();

  } catch (error) {

    alert(
      error.message ||
      'Error al registrar el cobro en Supabase.'
    );

  } finally {

    procesandoCobro = false;

    if (btn) {
      btn.disabled = false;
      btn.innerText =
        '✓ Confirmar Pago';
    }

  }

};

window.emitirComprobanteImpreso = emitirComprobante;

window.reimprimirComprobanteHistorico =
  function (
    numeroRecibo,
    periodo,
    nombreCompleto,
    dni,
    tipo,
    medio,
    monto
  ) {

    emitirComprobante({
      numeroRecibo,
      periodo,
      nombreCompleto,
      dni,
      tipo,
      medio,
      monto
    });

  };

window.anularComprobante = async function(idPago) {

  const confirmar =
    confirm(
      '¿Desea anular este comprobante?'
    );

  if (!confirmar) return;

  try {

    const res =
      await fetch(
        `${API_URL}/pagos/${idPago}/anular`,
        {
          method: 'POST'
        }
      );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || 'Error'
      );
    }

    alert(
      '✅ Comprobante anulado correctamente.'
    );

    cargarDashboard();
document
  .getElementById(
    'modal-ficha-historica'
  )
  .classList.add('hidden');
  } catch (error) {

    alert(
      error.message ||
      'No se pudo anular.'
    );

  }

};

async function inicializarMediosDePagoPantalla() {
  try {
   const respuesta = await fetch(`${API_URL}/medios-pago`);
    if (!respuesta.ok) throw new Error();
    const medios = await respuesta.json();
    const opcionesHTML = medios.map(m => `<option value="${m.id}">${m.emoji || ' '} ${m.nombre}</option>`).join('');
    
    const selectAlta = document.getElementById('form-alta-medio');
    const selectCobro = document.getElementById('select-pago-medio');
    if (selectAlta) selectAlta.innerHTML = opcionesHTML;
    if (selectCobro) selectCobro.innerHTML = opcionesHTML;
  } catch (error) {
    console.error("Error al poblar pasarelas:", error);
  }
}

window.verFichaDetalladaSocio =  (idSocio) =>
    abrirFichaHistorica(
      idSocio,
      todosLosSocios,
      API_URL,
      MESES
    );

window.cerrarFichaHistoricaSocio =  cerrarFichaHistorica;

window.filtrarPorSemaforo = function (color) {
  const sociosActivos = todosLosSocios.filter(s => s.estado !== 'Inactivo');
  if (color === 'Todos') return renderizarTabla(sociosActivos);
  renderizarTabla(sociosActivos.filter(s => s.estadoSemaforo === color));
}

function poblarSelectorAnios() {
  const select =
    document.getElementById(
      'select-cuotas-anio'
    );

  if (!select) return;

  const anioActual =
    new Date().getFullYear();

  select.innerHTML = '';

  for (
    let anio = anioActual - 1;
    anio <= anioActual + 5;
    anio++
  ) {

    const option =
      document.createElement('option');

    option.value = anio;
    option.textContent = anio;

    if (anio === anioActual) {
      option.selected = true;
    }

    select.appendChild(option);
  }
}

// --- INITIALIZER CENTRAL READY DOM UNIFICADO ---
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracionVisual();
  iniciarRelojLocal();
  configurarNavegacion();
  configurarModalPago(cargarDashboard);
  configurarModalSocio(() => todosLosSocios, cargarDashboard);
  inicializarMediosDePagoPantalla();
  poblarSelectorMeses('select-cuotas-mes-desde');
poblarSelectorMeses('select-cuotas-mes-hasta');
poblarSelectorMeses('select-caja-mes-filtro');
poblarSelectorAnios();
  cargarDashboard();
inicializarAuditoriaCuotas();
inicializarCalendario();

  document.getElementById('input-buscador')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    renderizarTabla(todosLosSocios.filter(s => s.estado !== 'Inactivo' && (s.nombre.toLowerCase().includes(txt) || s.dni.toString().includes(txt))));
  });

  document.getElementById('input-buscador-padron')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    renderizarPadronSocios(todosLosSocios.filter(s => s.nombre.toLowerCase().includes(txt) || s.dni.toString().includes(txt)));
  });

  document.getElementById('form-editar-socio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idSocio = document.getElementById('edit-form-id').value;
    const datos = {
      nombre: document.getElementById('edit-form-nombre').value.trim(),
      apellido: document.getElementById('edit-form-apellido').value.trim(),
      telefono: document.getElementById('edit-form-telefono').value.trim(),
      email: document.getElementById('edit-form-email').value.trim(),
      direccion: document.getElementById('edit-form-direccion').value.trim(),
      tipo: document.getElementById('edit-form-tipo').value.trim(),
      montoCuota: parseFloat(document.getElementById('edit-form-monto').value) || 0,
      fechaVencimiento: document.getElementById('edit-form-vencimiento').value,
      actividad: document.getElementById('edit-form-actividad').value.trim(),
      categoria: document.getElementById('edit-form-categoria').value.trim(),
      notas: document.getElementById('edit-form-notas').value.trim()
    };
    try {
      await fetch(`${API_URL}/socios/${idSocio}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      document.getElementById('modal-editar-socio').classList.add('hidden');
      document.getElementById('lbl-editexito-nombre').innerText = `${datos.nombre} ${datos.apellido}`;
      document.getElementById('modal-editar-exito').classList.remove('hidden');
      await cargarDashboard();
    } catch (error) { alert("⚠️ Error al actualizar la ficha."); }
  });

  if (sessionStorage.getItem('sesion_administrativa_activa') === 'true') {
    document.getElementById('contenedor-login')?.classList.add('hidden');
  }

  const formLogin = document.getElementById('form-login-administrativo');
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('login-error-msg');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value })
      });
      const datosRes = await res.json();
      if (!res.ok) throw new Error(datosRes.error || "Rebote.");
      sessionStorage.setItem('sesion_administrativa_activa', 'true');
      errorMsg?.classList.add('hidden');
      document.getElementById('contenedor-login')?.classList.add('hidden');
    } catch (error) {
      if (errorMsg) { errorMsg.innerText = ` ❌ ${error.message}`; errorMsg.classList.remove('hidden'); }
    }
  });
});

