
const SidebarController = {
 
    init: function() {
        const config = window.AppConfig;
        if (!config) {
            console.error("[SidebarController] Error: window.AppConfig no definida.");
            return;
        }
        // Corrección de llaves: estas ejecuciones deben ocurrir dentro de init
        this.renderMarcaBlanca(config);
        this.renderNavegacion(config);
    },

        /**
     * Sincroniza la identidad visual en móvil y escritorio
     */
    renderMarcaBlanca: function(config) {
        this._setAtributo('app-nombre-entidad', 'textContent', config.nombre);
        this._setAtributo('app-nombre-entidad-movil', 'textContent', config.nombre);
        this._setAtributo('app-subtitulo-entidad', 'textContent', config.subtitulo);
        this._setAtributo('app-escudo-img', 'src', config.escudoUrl);
        this._setAtributo('app-escudo-img-movil', 'src', config.escudoUrl);
        this._setAtributo('app-version-footer', 'textContent', config.version || "v1.0.0");

        // APLICAR COLORES DINÁMICOS AL FONDO Y SUBTÍTULO
        const sidebar = document.getElementById('sidebar-container');
        if (sidebar && config.colores) {
            const c = config.colores;
            
            // 1. Fondo de la barra (Degradado de 3 o 2 colores)
            if (c.principal && c.centro && c.secundario) {
                sidebar.style.background = `linear-gradient(to bottom, ${c.principal}, ${c.centro}, ${c.secundario})`;
            } else if (c.principal && c.secundario) {
                sidebar.style.background = `linear-gradient(to bottom, ${c.principal}, ${c.secundario})`;
            }

            // 2. Color del texto base del menú
            if (c.textoMenu) {
                sidebar.style.color = c.textoMenu;
            }

            // 3. NUEVO: Color del Subtítulo personalizado
            const subtituloElemento = document.getElementById('app-subtitulo-entidad');
            if (subtituloElemento && c.textoSubtitulo) {
                subtituloElemento.style.color = c.textoSubtitulo;
            }
        }
    },

    /**
     * Filtra y dibuja los módulos activos basados en config.js
     */
    renderNavegacion: function(config) {
        const contenedor = document.getElementById('modulos-navegacion');
        if (!contenedor || !config.modulos) return;

        const modulosVisibles = config.modulos.filter(mod => mod.activo === true);
        const colorTextoPersonalizado = config.colores?.textoMenu || '';
        
        // Vemos si el cliente quiere mantener los colores originales de los íconos
        const mantenerColoresIconos = config.colores?.iconosConColorOriginal ?? false;

        contenedor.innerHTML = modulosVisibles.map(mod => {
            const textoFinal = (mod.usaTerminoPlural && config.terminos?.plural) 
                ? config.terminos.plural 
                : mod.texto;

            const spanIdAttr = mod.usaTerminoPlural ? 'id="menu-txt-plural"' : '';

            // Configuración del texto
            const estiloTexto = colorTextoPersonalizado ? `style="color: ${colorTextoPersonalizado};"` : '';
            const claseTextoBase = colorTextoPersonalizado ? '' : 'text-gray-200';

            // Configuración de los íconos (NUEVA LÓGICA)
            let claseIconoColor = mod.color; // Por defecto usa su color (text-blue-400, etc.)
            let estiloIcono = '';

            // Si hay color de menú personalizado Y NO se quiere mantener el color original:
            if (colorTextoPersonalizado && !mantenerColoresIconos) {
                claseIconoColor = ''; 
                estiloIcono = `style="color: ${colorTextoPersonalizado};"`;
            }

            return `
                <a href="#" onclick="SidebarController.ejecutarNavegacion('${mod.id}')" 
                   ${estiloTexto}
                   class="flex items-center gap-3 py-2 px-4 hover:bg-black/10 rounded-md font-medium ${claseTextoBase} transition group text-sm">
                    <i class="${mod.icono} w-5 text-center ${claseIconoColor} group-hover:scale-110 transition-transform" ${estiloIcono}></i>
                    <span ${spanIdAttr}>${textoFinal}</span>
                </a>
            `;
        }).join('');
    },

    
    /**
     * Controla el colapso del menú en celulares (Hamburguesa)
     */
    toggle: function() {
        const sidebar = document.getElementById('sidebar-container');
        const icono = document.getElementById('btn-hamburguesa-icono');
        if (!sidebar || !icono) return;
        
        if (sidebar.classList.contains('hidden')) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');
            icono.className = "fas fa-times"; 
        } else {
            sidebar.classList.remove('flex');
            sidebar.classList.add('hidden');
            icono.className = "fas fa-bars";  
        }
    },

    /**
     * Ejecuta la navegación y gestiona el cierre en pantallas móviles
     */
    ejecutarNavegacion: function(destinoId) {
        if (window.innerWidth < 768) { 
            this.toggle(); 
        }
        if (typeof navegarA === 'function') {
            navegarA(destinoId);
        }
    },

    // Helper utilitario interno para manipulación del DOM
    _setAtributo: function(id, propiedad, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento[propiedad] = valor;
    }
}; // <- Aquí se cierra correctamente el objeto

// Inicialización automática cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    SidebarController.init();
});
