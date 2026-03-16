const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const grid = document.getElementById('grid-recursos');
const loader = document.getElementById('loader');

let todosLosRecursos = [];
let favoritosSet = new Set(); // mantiene ids guardados por el usuario

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
    const userId = localStorage.getItem('arrecife_session_id');
    if (!userId) return;
    const { data, error } = await supabaseClient
        .from('favoritos')
        .select('recurso_id')
        .eq('user_id', userId);

    if (!error && data) {
        favoritosSet = new Set(data.map(f => f.recurso_id));
    }
}

async function obtenerRecursos(categoria = 'todas') {
    // Verificación de seguridad para el loader y grid
    if (!loader || !grid) return; 

    loader.style.display = 'block';
    grid.innerHTML = '';
     
    // Construcción de la consulta optimizada
    let query = supabaseClient
        .from('recursos')
        .select('*')
        .eq('aprobado', true); // Solo mostrar lo verificado

    // Si no es 'todas', filtramos directamente en Supabase
    if (categoria !== 'todas') {
        query = query.eq('categoria', categoria);
    }

    const { data: recursos, error } = await query.order('created_at', { ascending: false });

    loader.style.display = 'none';

    if (error) {
        console.error('Error:', error);

        grid.innerHTML = '<p style="color: red;">Error al conectar con la biblioteca</p>';
        return;
    }
    
    todosLosRecursos = recursos; 
    
    // Cargar favoritos antes de mostrar para que los iconos salgan marcados
    if (typeof obtenerFavoritos === "function") {
        await obtenerFavoritos();
    }

    // Llamada a la renderización
    renderizar(todosLosRecursos);
}

// Escuchador para el buscador (ID: busqueda)
const inputBusqueda = document.getElementById('busqueda');
if(inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        
        const filtrados = todosLosRecursos.filter(item => 
            item.titulo.toLowerCase().includes(termino) || 
            item.categoria.toLowerCase().includes(termino)
        );
        
        renderizar(filtrados);
    });
}

function renderizar(lista) {
    grid.innerHTML = '';

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'libro-card';
        card.innerHTML = `
            <strong>${item.titulo}</strong>
            <small>${item.categoria}</small>
            <a href="${item.url}" target="_blank" class="btn-download">Abrir</a>
        `;
        grid.appendChild(card);
    });
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
    const inputBusqueda = document.getElementById('busqueda');

    if (categoria === 'todas') {
        // Mostrar todos los recursos
        inputBusqueda.value = '';
        renderizar(todosLosRecursos);
    } else {
        // Mapear las categorías del dropdown a los nombres en la base de datos
        const categoriaMap = {
            'matematicas': 'Matemáticas',
            'fisica': 'Física',
            'quimica': 'Química',
            'biologia': 'Biología',
            'historia': 'Historia',
            'geografia': 'Geografía',
            'literatura': 'Literatura',
            'ingles': 'Inglés',
            'filosofia': 'Filosofía',
            'arte': 'Arte',
            'musica': 'Música',
            'educacion-fisica': 'Educación Física'
        };

        const nombreCategoria = categoriaMap[categoria] || categoria;

        // Filtrar por categoría exacta
        const filtrados = todosLosRecursos.filter(item =>
            item.categoria.toLowerCase() === nombreCategoria.toLowerCase()
        );

        // Actualizar el campo de búsqueda para mostrar la categoría seleccionada
        inputBusqueda.value = nombreCategoria;

        renderizar(filtrados);
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
    const grid = document.getElementById('grid-recursos');
    const loader = document.getElementById('loader');
    
    if (!grid) return;
    grid.innerHTML = '';

    if (lista.length === 0) {
        grid.innerHTML = `<p class="not-found" style="grid-column: 1/-1; text-align: center;">No hay recursos en tu busqueda... 🌊</p>`;
        if (loader) loader.classList.add('hidden');
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'libro-card';
        
        const saved = favoritosSet.has(item.id);
        const iconClass = saved ? 'fas' : 'far';

        card.innerHTML = `
            <div class="card-header">
                <span class="categoria-tag">${item.categoria || 'Sin categoría'}</span>
                <button class="btn-save ${saved ? 'saved' : ''}" onclick="guardarEnEstante(${item.id}, this)">
                    <i class="${iconClass} fa-bookmark"></i>
                </button>
            </div>
            <strong>${item.titulo}</strong>
            <div class="card-footer" style="margin-top: 15px;">
                <a href="${item.url}" target="_blank" class="btn-download" style="width: 100%; text-align: center;">
                    <i class="fas fa-external-link-alt"></i> Abrir
                </a>
            </div>
        `;
        grid.appendChild(card);
    });


    if (loader) loader.classList.add('hidden');
}


async function guardarEnEstante(recursoId, boton) {
    let userId = localStorage.getItem('arrecife_session_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('arrecife_session_id', userId);
    }

    // si ya está guardado, lo elimina en lugar de insertarlo
    if (favoritosSet.has(recursoId)) {
        const { error } = await supabaseClient
            .from('favoritos')
            .delete()
            .eq('user_id', userId)
            .eq('recurso_id', recursoId);

        if (error) {
            console.error('Error al eliminar:', error);
            notificar('No se pudo quitar del estante...', 'error');
        } else {
            // actualizar UI
            favoritosSet.delete(recursoId);
            boton.classList.remove('saved');
            const icon = boton.querySelector('i');
            if (icon) icon.classList.replace('fas', 'far');
            notificar('Eliminado de Mi Estante 🗑️');
        }
        return;
    }

    const { data, error } = await supabaseClient
        .from('favoritos')
        .insert([{ user_id: userId, recurso_id: recursoId }]);

    if (error) {
        if (error.code === '23505') {
            favoritosSet.add(recursoId);
            const icon = boton.querySelector('i');
            if (icon) icon.classList.replace('far', 'fas');
            boton.classList.add('saved');
            notificar("¡Este libro ya está en tu estante! ✨");
        } else {
            console.error("Error al guardar:", error);
            notificar("¡Inicia sesion para esta funcion!");
        }
    } else {
        // Cambiamos el icono para dar feedback visual
        const icon = boton.querySelector('i');
        if (icon) icon.classList.replace('far', 'fas'); // De borde a relleno
        boton.classList.add('saved');
        favoritosSet.add(recursoId);
        notificar("¡Guardado en Mi Estante! 📚");
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
        <i class="fas ${icon}"></i>
        <span>${mensaje}</span>
    `;
    
    container.appendChild(toast);

    // Desaparece después de 5 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3600);
}
