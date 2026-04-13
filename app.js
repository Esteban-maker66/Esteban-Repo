const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const grid = document.getElementById('grid-recursos');
const loader = document.getElementById('loader');

let todosLosRecursos = [];
let favoritosSet = new Set(); // mantiene ids guardados por el usuario

function gestionarPantalla(modoBusqueda) {
    const secciones = document.getElementById('secciones-dinamicas');
    const resultados = document.getElementById('grid-recursos');
    const footer = document.getElementById('main-footer');

    if (modoBusqueda) {
        if (secciones) secciones.style.display = 'none';
        if (resultados) resultados.style.display = 'grid';
        if (footer) footer.style.display = 'none';
    } else {
        if (secciones) secciones.style.display = 'block';
        if (resultados) resultados.style.display = 'none';
        if (footer) footer.style.display = 'block';
    }
}

async function obtenerUserId() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) return user.id;
    
    let localId = localStorage.getItem('arrecife_session_id');
    if (!localId) {
        // Usamos un nombre simple y guardamos
        localId = 'anon_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('arrecife_session_id', localId);
    }
    return localId;
}

// Verificar si el usuario está realmente autenticado (no anónimo)
async function verificarAutenticacion() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return !!user; // Devuelve true solo si hay usuario autenticado
}

function mostrarSkeletons() {
    const contenedor = document.getElementById('secciones-dinamicas');
    // Creamos 3 esqueletos parecidas a carretes
    const skeletonFila = `
        <div class="seccion-horizontal-skeleton" style="margin-bottom: 2rem; padding: 0 1.5rem;">
            <div class="skeleton-titulo" style="width: 200px; height: 25px; background: var(--border); border-radius: 5px; margin-bottom: 1rem;"></div>
            <div class="carrete-falso" style="display: flex; gap: 1rem; overflow: hidden;">
                ${'<div class="skeleton-card" style="min-width: 200px; height: 150px; background: var(--border); border-radius: 12px; opacity: 0.6; "></div>'.repeat(5)}
            </div>
        </div>
    `;
    contenedor.innerHTML = skeletonFila.repeat(3);
}

// Initialize dark mode on page load
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const toggleSwitch = document.querySelector('#checkbox');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleSwitch) {
            toggleSwitch.checked = true;
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleSwitch) {
            toggleSwitch.checked = false;
        }
    }
}

// Call initialize on page load
document.addEventListener('DOMContentLoaded', initializeDarkMode);

// obtiene la lista de recursos guardados del usuario y llena el set
async function obtenerFavoritos() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    const userId = await obtenerUserId();
    const { data, error } = await supabaseClient
        .from('favoritos')
        .select('recurso_id')
        .eq('user_id', user.id);

    if (!error && data) {
        favoritosSet = new Set(data.map(f => f.recurso_id));
    }
}

async function obtenerRecursos(categoria = 'todas') {
    const dinamico = document.getElementById('secciones-dinamicas');
    const gridOriginal = document.getElementById('grid-recursos');

    // Muestra Skeletons si estamos en la vista principal
    if (categoria === 'todas') {
        gridOriginal.style.display = 'none';
        dinamico.style.display = 'block';
        mostrarSkeletons();
    }

    let query = supabaseClient
        .from('recursos')
        .select('*')
        .eq('aprobado', true);

    if (categoria !== 'todas') {
        query = query.eq('categoria', categoria);
    }

    const { data: recursos, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }
    
    todosLosRecursos = recursos;

    // Cargar favoritos y Renderizar
    if (typeof obtenerFavoritos === "function") {
        await obtenerFavoritos();
    }

    // Obtener conteo de veces guardado para cada recurso (solo si es 'todas')
    if (categoria === 'todas' && recursos && recursos.length > 0) {
        try {
            // Llamar a función RPC para obtener conteo global sin restricciones RLS
            const { data: conteoData, error: conteoError } = await supabaseClient
                .rpc('obtener_conteo_favoritos');
            
            if (conteoError) {
                console.warn('Error RPC (fallback a contador local):', conteoError.message);
                // Fallback: si falla RPC, al menos intentar obtener de favoritos del usuario
                const { data: userFavs } = await supabaseClient
                    .from('favoritos')
                    .select('recurso_id')
                    .eq('user_id', await obtenerUserId());
                
                if (userFavs) {
                    const conteo = {};
                    userFavs.forEach(fav => {
                        conteo[fav.recurso_id] = (conteo[fav.recurso_id] || 0) + 1;
                    });
                    recursos.forEach(recurso => {
                        recurso.veces_guardado = conteo[recurso.id] || 0;
                    });
                }
            } else if (conteoData) {
                // Mapear datos de la RPC al objeto de conteo
                const conteo = {};
                conteoData.forEach(item => {
                    conteo[item.recurso_id] = item.count;
                });
                
                // Agregar el conteo a cada recurso
                recursos.forEach(recurso => {
                    recurso.veces_guardado = conteo[recurso.id] || 0;
                });
            }
        } catch (err) {
            console.error('Error al obtener conteo de favoritos:', err);
        }
    }

    // Si es 'todas', usamos secciones. Si es una categoría específica, usamos el grid.
    if (categoria === 'todas') {
        renderizarSecciones(recursos);
    } else {
        dinamico.style.display = 'none';
        gridOriginal.style.display = 'grid';
        renderizar(recursos);
    }
}

function renderizarSecciones(recursos) {
    const contenedor = document.getElementById('secciones-dinamicas');
    contenedor.innerHTML = ''; 

    const config = [
        { titulo: '⭐ Libros Destacados', filtro: 'Destacados' },
        { titulo: '📖 libros Recientes', filtro: 'Recientes' },
        { titulo: '🏷️ La Narrativa..', filtro: 'Narrativa' },
        { titulo: '⚡ Ciencias Ficciónes..', filtro: 'Ciencia Ficción' },
        { titulo: '🔍 Misterio y Suspenso..', filtro: 'Misterio y Suspenso' },
        { titulo: '🔖 Los Cómics y Novelas..', filtro: 'Cómics Y Novelas' },
        { titulo: '😂 Comedia..', filtro: 'Comedia' },
        { titulo: '🎓 Académicos..', filtro: 'Académicos' },
        { titulo: '🌱 Desarrollo Personal..', filtro: 'Desarrollo Personal' },
        { titulo: '📚 Documentales..', filtro: 'Documentales' },
        { titulo: '📖 Biblias..', filtro: 'Biblias' },
    ];

    config.forEach(sec => {
        let filtrados;
        if (sec.filtro === 'Destacados') {
            // Los más guardados
            filtrados = recursos
                .filter(r => r.veces_guardado && r.veces_guardado > 0)
                .sort((a, b) => (b.veces_guardado || 0) - (a.veces_guardado || 0))
                .slice(0, 50);
        } else if (sec.filtro === 'Recientes') {
            filtrados = recursos.slice(0, 50);
        } else {
            // Usamos toLowerCase() para que coincida aunque haya diferencias de mayúsculas
            filtrados = recursos.filter(recurso => 
                recurso.categoria.toLowerCase().trim() === sec.filtro.toLowerCase().trim()
            ).slice(0, 50);
        }

        if (filtrados.length > 0) {
            const seccion = document.createElement('section');
            seccion.className = 'seccion-biblioteca'; // Coincide con tu CSS
            seccion.innerHTML = `
                <div class="seccion-header">
                    <h2>${sec.titulo}</h2>
                </div>
                <div class="carrete-scroll"></div>`;
            
            const carrete = seccion.querySelector('.carrete-scroll');
            filtrados.forEach(recurso => {
                // AQUÍ: Asegúrate de que esta función exista y devuelva un elemento HTML
                carrete.appendChild(crearTarjetaRecurso(recurso)); 
            });
            contenedor.appendChild(seccion);
        }
    });
}

function crearTarjetaRecurso(recurso) {
    const card = document.createElement('div');
    card.className = 'recurso-card';
    
    const esFavorito = (typeof favoritosSet !== 'undefined') ? favoritosSet.has(recurso.id) : false;
    const iconClass = esFavorito ? 'fas' : 'far';

    card.innerHTML = `
        <div class="card-header">
            <button class="btn-save ${esFavorito ? 'saved' : ''}" 
                    onclick="guardarEnEstante(${recurso.id}, this)">
                <i class="${iconClass} fa-bookmark"></i>
            </button>
            <span class="categoria-tag">${recurso.categoria}</span>
        </div>
        <div class="recurso-info">
            <h3 class="recurso-titulo">${recurso.titulo}</h3>
            <p class="recurso-autor" style="margin: 0 0 15px 0;">Autor: <strong>${recurso.autor_nombre  || 'Anónimo'}</strong></p>
            <p class="recurso-autor" style="margin: 0 0 15px 0;">Colaborador/a: <strong>${recurso.usuario_nombre  || 'Invitado'}</strong></p>
            <div class="card-footer">
                <a href="${recurso.url}" target="_blank" class="btn-download">
                    <i class="fas fa-book-open"></i> Leer
                </a>
            </div>
        </div>
    `;

    return card;
}


const inputBusqueda = document.getElementById('busqueda');

if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        
        if (termino.length >= 1) {
            
            const filtrados = todosLosRecursos.filter(recurso => 
                recurso.titulo.toLowerCase().includes(termino) || 
                recurso.categoria.toLowerCase().includes(termino)
            );
            gestionarPantalla(true); 
            renderizar(filtrados);
        } else if (termino.length === 0) {
         
            gestionarPantalla(false);
        }
    
    });


    inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const termino = e.target.value.toLowerCase().trim();
            if(termino.length > 10) ejecutarBusqueda(termino);
        }
    });
}

function ejecutarBusqueda(termino) {

    toggleVistaBusqueda(true);

    // Ocultar las secciones horizontales y mostrar el Grid de resultados
    if (dinamico) dinamico.style.display = 'none';
    if (footer) footer.style.display = 'none'; 
    if (gridOriginal) gridOriginal.style.display = 'grid';

    // Filtrar
    const filtrados = todosLosRecursos.filter(recurso => 
        recurso.titulo.toLowerCase().includes(termino) || 
        recurso.categoria.toLowerCase().includes(termino)
    );
    
    renderizar(filtrados);

    // Scroll suave para ver los resultados
    gridOriginal.scrollIntoView({ behavior: 'smooth' });
}

const toggleSwitch = document.querySelector('#checkbox');

if (toggleSwitch) {
    toggleSwitch.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}



function filtrarPorCategoria(categoria) {
    const dinamico = document.getElementById('secciones-dinamicas');
    const gridOriginal = document.getElementById('grid-recursos');
    const inputBusqueda = document.getElementById('busqueda');

    if (categoria === 'todas') {
        toggleVistaBusqueda(false);
        obtenerRecursos('todas');
    }

     else {
        toggleVistaBusqueda(true);
        // Mapear las categorías del dropdown a los nombres en la base de datos
        const categoriaMap = {
            'narrativa': 'Narrativa',
            'ciencia ficcion': 'Ciencia Ficción',
            'misterio y suspenso': 'Misterio y Suspenso',
            'comics y novelas': 'Cómics y Novelas',
            'academicos': 'Académicos',
            'desarrollo personal': 'Desarrollo Personal',
            'documentales': 'Documentales',
            'comedia': 'Comedia',
            'biblias': 'Biblias',
        };

        const nombreCategoria = categoriaMap[categoria] || categoria;

        dinamico.style.display = 'none';
        gridOriginal.style.display = 'grid';
        gridOriginal.innerHTML = '';

        // Filtrar por categoría exacta
        const filtrados = todosLosRecursos.filter(recurso =>
            recurso.categoria.toLowerCase().trim() === nombreCategoria.toLowerCase().trim()
        );

        const titulo = document.createElement('h2');
    titulo.style.cssText = "grid-column: 1/-1; margin: 20px 0; color: var(--text); font-size: 1.5rem;";
    titulo.innerText = `Resultados para: ${nombreCategoria}`;
    gridOriginal.appendChild(titulo);

    if (filtrados.length === 0) {
        gridOriginal.innerHTML += `<p style="grid-column: 1/-1; text-align: center; padding: 0;">El arrecife esta en creciendo...  Encontraras lo que buscas pronto! 🌊</p>`;
    } else {
        filtrados.forEach(recurso => {
            gridOriginal.appendChild(crearTarjetaRecurso(recurso));
        });
    }

    // 7. Feedback visual
    inputBusqueda.value = nombreCategoria;
    gridOriginal.scrollIntoView({ behavior: 'smooth' });

}

    // Scroll suave hacia los resultados
    document.getElementById('grid-recursos').scrollIntoView({ behavior: 'smooth' });

    // Cerrar el dropdown después de seleccionar una categoría
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// Dropdown functionality
document.addEventListener('DOMContentLoaded', async function() {
    const dropdownBtn = document.getElementById('btn-categorias');
    const dropdown = document.querySelector('.dropdown');
    const adminLink = document.querySelector('a[href="admin.html"]'); // Selecciona el enlace
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const ADMIN_EMAIL = 'e306711@gmail.com';

    async function gestionarBotonesAdmin(session) {
    // Busca el link de admin tanto en PC como en el menú móvil
    const adminLinks = document.querySelectorAll('.admin-nav'); 
    
    const esAdmin = session?.user?.email === ADMIN_EMAIL;

    adminLinks.forEach(link => {
        if (esAdmin) {
            link.style.display = 'flex';
        } else {
            link.style.display = 'none';
        }
    });
}

    supabaseClient.auth.onAuthStateChange((_event, session) => {
    gestionarBotonesAdmin(session);
});

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
    gestionarBotonesAdmin(session);
});

    if (adminLink) {
        if (session && session.user.email === ADMIN_EMAIL) {
            adminLink.style.display = 'flex';
        } else {
            adminLink.remove();
        }
    }

    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }

    // Mobile search toggle
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const headerCenter = document.querySelector('.header-center');

    if (mobileSearchBtn && headerCenter) {
        mobileSearchBtn.addEventListener('click', function() {
            headerCenter.classList.toggle('show-search');
            // Focus on search input when shown
            if (headerCenter.classList.contains('show-search')) {
                const searchInput = document.getElementById('busqueda');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            }
        });
    }
});

function renderizar(lista) {
    const gridOriginal = document.getElementById('grid-recursos');
    if (!gridOriginal) return;
    
    gridOriginal.innerHTML = '';

    if (lista.length === 0) {
        gridOriginal.innerHTML = `
            <div class="busqueda-vacia" style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                <i class="fas fa-search-minus" id="no-results-icon" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <p class="no-results">El arrecife esta en creciendo...  Encontraras lo que buscas pronto! 🌊</p>
            </div>`;
        return;
    }

    // Título de resultados
    const titulo = document.createElement('h2');
    titulo.style.cssText = "grid-column: 1/-1; margin: 20px 0; color: var(--text); font-size: 1.5rem;";
    titulo.innerText = `Resultados encontrados:`;
    gridOriginal.appendChild(titulo);

    // Renderizar cada tarjeta con el diseño moderno
    lista.forEach(recurso => { 
        gridOriginal.appendChild(crearTarjetaRecurso(recurso));
    });
}

async function guardarEnEstante(recursoId, btn) {
    // Verificar autenticación real del usuario
    const estaAutenticado = await verificarAutenticacion();
    if (!estaAutenticado) {
        notificar("Debes iniciar sesión para poder usar un estante...", "error");
        return;
    }

    console.log("Iniciando guardado para recurso:", recursoId);
    const userId = await obtenerUserId();
    console.log("Usuario actual:", userId);

    const esFavorito = favoritosSet.has(recursoId);

    if (esFavorito) {
        console.log("El recurso ya es favorito. Intentando eliminar...");
        const { error } = await supabaseClient
            .from('favoritos')
            .delete()
            .eq('user_id', userId)
            .eq('recurso_id', recursoId);

        if (error) {
            console.error("Error al eliminar:", error.message);
        } else {
            favoritosSet.delete(recursoId);
            btn.classList.remove('saved');
            btn.querySelector('i').className = 'far fa-bookmark';
            notificar("Quitado del estante", "info");
            // Actualizar destacados globales después de eliminar
        }
    } else {
        console.log("Intentando insertar en Supabase...");
        const { data, error } = await supabaseClient
            .from('favoritos')
            .insert([{ user_id: userId, recurso_id: recursoId }]);

        if (error) {
            console.error("Error detallado de Supabase:", error.message);
            console.error("Código de error:", error.code);
            notificar("Error al guardar: " + error.message, "error");
        } else {
            console.log("¡Inserción exitosa!", data);
            favoritosSet.add(recursoId);
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fas fa-bookmark';
            notificar("¡Guardado en tu estante!", "success");
            // Actualizar destacados globales después de guardar
        }
    }
}

obtenerRecursos();

// Mobile Menu Functionality
document.addEventListener("DOMContentLoaded", function() {
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
    const mobileMenuClose = document.getElementById("mobile-menu-close");
    const mobileCategoriesBtn = document.getElementById("mobile-categories-btn");
    const mobileCategoriesContent = document.getElementById("mobile-categories-content");
    const mobileDropdown = mobileCategoriesBtn ? mobileCategoriesBtn.closest(".mobile-dropdown") : null;

    // Toggle hamburger menu
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", function() {
            mobileMenuOverlay.classList.toggle("active");
            hamburgerBtn.classList.toggle("active");
        });
    }

    // Close mobile menu
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener("click", closeMobileMenu);
    }

    // Close on overlay click
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener("click", function(e) {
            if (e.target === mobileMenuOverlay) {
                closeMobileMenu();
            }
        });
    }

    // Mobile categories dropdown
    if (mobileCategoriesBtn) {
        mobileCategoriesBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (mobileDropdown) {
                mobileDropdown.classList.toggle("active");
            }
        });
    }

    // Close on escape key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && mobileMenuOverlay.classList.contains("active")) {
            closeMobileMenu();
        }
    });
});

function closeMobileMenu() {
    const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const mobileDropdown = document.querySelector(".mobile-dropdown");

    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
    }
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove("active");
    }
    if (mobileDropdown) {
        mobileDropdown.classList.remove("active");
    }
}

function notificar(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <span>${mensaje}</span>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3600);

}



window.guardarEnEstante = async function(recursoId, btn) {
    // Verificar autenticación real del usuario
    const estaAutenticado = await verificarAutenticacion();
    if (!estaAutenticado) {
        notificar("🔔 inicia sesión para esta funcion!", "error"); 
        return;
    }

    const userId = await obtenerUserId();
    const loaderContainer = document.getElementById('loader-container-mobile');
    
    if (favoritosSet.has(recursoId)) {
        loaderContainer.classList.remove('hidden');
        
        const { error } = await supabaseClient
            .from('favoritos')
            .delete()
            .eq('user_id', userId)
            .eq('recurso_id', recursoId);

        loaderContainer.classList.add('hidden');
        
        if (!error) {
            favoritosSet.delete(recursoId);
            btn.classList.remove('saved');
            btn.querySelector('i').className = 'far fa-bookmark';
            notificar("🔔 Eliminado del estante...");
            // Actualizar destacados globales después de eliminar
        } else {
            notificar("❗ Presionaste muchas veces...");
        }
    } else { 
        loaderContainer.classList.remove('hidden');
        
        const { error } = await supabaseClient
            .from('favoritos')
            .insert([{ user_id: userId, recurso_id: recursoId }]);

        loaderContainer.classList.add('hidden');
        
        if (!error) {
            favoritosSet.add(recursoId);
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fas fa-bookmark';
            notificar("🔔  ¡Guardado en el estante!");
            // Actualizar destacados globales después de guardar
        }
    }
}; 

function toggleVistaBusqueda(activa) {
    const dinamico = document.getElementById('secciones-dinamicas');
    const gridOriginal = document.getElementById('grid-recursos');
    const footer = document.getElementById('main-footer');

    if (activa) {
        
        if (dinamico) dinamico.style.display = 'none';
        if (gridOriginal) gridOriginal.style.display = 'grid';
        if (footer) footer.style.setProperty('display', 'none', 'important');
    } else {

        if (dinamico) dinamico.style.display = 'block';
        if (gridOriginal) gridOriginal.style.display = 'none';
        if (footer) footer.style.setProperty('display', 'block', 'important');
    }
}

// Funciones para comentarios
async function abrirModalComentarios() {
    const modal = document.getElementById('modal-comentarios');
    const inputNombre = document.getElementById('nombre-usuario');
    
    if (modal) {
        // Obtener usuario autenticado
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
            // Si hay usuario autenticado, llenar automáticamente
            inputNombre.value = user.user_metadata?.full_name || user.email || 'Usuario';
            inputNombre.readOnly = true;
            inputNombre.style.backgroundColor = 'var(--surface)';
            inputNombre.style.cursor = 'default';
        } else {
            // Si no hay usuario, limpiar el campo y permitir entrada manual
            inputNombre.value = '';
            inputNombre.readOnly = false;
            inputNombre.style.backgroundColor = 'var(--background)';
            inputNombre.style.cursor = 'text';
        }
        
        modal.classList.add('active');
    }
}

function cerrarModalComentarios() {
    const modal = document.getElementById('modal-comentarios');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Inicializar listeners de comentarios
document.addEventListener('DOMContentLoaded', function() {
    const btnComentarios = document.getElementById('btn-comentarios');
    const modalComentarios = document.getElementById('modal-comentarios');
    const formComentarios = document.getElementById('form-comentarios');

    // Abrir modal al hacer click en el botón
    if (btnComentarios) {
        btnComentarios.addEventListener('click', abrirModalComentarios);
    }

    // Cerrar modal al hacer click fuera
    if (modalComentarios) {
        modalComentarios.addEventListener('click', function(e) {
            if (e.target === modalComentarios) {
                cerrarModalComentarios();
            }
        });
    }

    // Enviar comentario
    if (formComentarios) {
        formComentarios.addEventListener('submit', async function(e) {
            e.preventDefault();

            let nombre = document.getElementById('nombre-usuario').value.trim();
            const mensaje = document.getElementById('mensaje-comentario').value.trim();

            // Si el nombre está vacío, verificar si hay usuario autenticado
            if (!nombre) {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    nombre = user.user_metadata?.full_name || user.email || 'Usuario';
                } else {
                    notificar('Por favor ingresa tu nombre o inicia sesión', 'error');
                    return;
                }
            }

            if (!mensaje) {
                notificar('Por favor escribe tu recomendación', 'error');
                return;
            }

            const btnSubmit = formComentarios.querySelector('button[type="submit"]');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            try {
                console.log('Enviando comentario:', { nombre, mensaje });
                
                const { data, error } = await supabaseClient
                    .from('comentarios')
                    .insert([{
                        nombre: nombre,
                        mensaje: mensaje
                    }]);

                console.log('Respuesta de inserción:', { data, error });

                if (error) {
                    console.error('Error detallado:', error);
                    notificar('Error al enviar: ' + error.message, 'error');
                } else {
                    console.log('Comentario guardado exitosamente');
                    notificar('¡enviado! Gracias por tu aporte 🎉', 'success');
                    formComentarios.reset();
                    cerrarModalComentarios();
                }
            } catch (err) {
                console.error('Exception al enviar comentario:', err);
                notificar('Error al enviar: ' + err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginal;
            }
        });
    }
});
