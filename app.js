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

async function obtenerRecursos() {
    // Evitamos doble llamada al loader
    loader.classList.remove('hidden');
     
    let { data: recursos, error } = await supabaseClient
        .from('recursos')
        .select('*');

    loader.classList.add('hidden');

    if (error) {
        console.error('Error:', error);
        // Si hay error, avisamos al usuario en el grid
        grid.innerHTML = '<p style="color: red;">Error al conectar con la biblioteca</p>';
        return;
    }
    
    todosLosRecursos = recursos; 
    await obtenerFavoritos();
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

    // UX: Si la búsqueda no arroja resultados
    if (lista.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px;">
                <p class="no-results">No hay recursos que coincidan con tu búsqueda... 🌊</p>
            </div>`;
        return;
    }

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

window.onscroll = function() {
    const header = document.querySelector("header");
    if (window.pageYOffset > 50) {
        header.classList.add("header-scrolled");
    } else {
        header.classList.remove("header-scrolled");
    }
};

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
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.getElementById('btn-categorias');
    const dropdown = document.querySelector('.dropdown');

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
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No se encontraron recursos. 🌊</p>`;
        if (loader) loader.classList.add('hidden');
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'libro-card';
        // determinar si el recurso ya está guardado
        const saved = favoritosSet.has(item.id);
        const iconClass = saved ? 'fas' : 'far';
        const btnClass = saved ? 'btn-save saved' : 'btn-save';
        card.innerHTML = `
            <div class="card-header">
                <span class="categoria-tag">${item.categoria || 'Sin categoría'}</span>
                <button class="${btnClass}" onclick="guardarEnEstante(${item.id}, this)" title="Guardar en mi estante">
                    <i class="${iconClass} fa-bookmark"></i>
                </button>
            </div>
            <strong>${item.titulo}</strong>
            <div class="card-footer">
                <a href="${item.url}" target="_blank" class="btn-download">
                    <i class="fas fa-external-link-alt"></i> Abrir
                </a>
            </div>
        `;
        grid.appendChild(card);
    });

    // IMPORTANTE: Ocultar el loader después de renderizar
    if (loader) loader.classList.add('hidden');
}


async function guardarEnEstante(recursoId, boton) {
    let userId = localStorage.getItem('arrecife_session_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('arrecife_session_id', userId);
    }

    // si ya está guardado, lo eliminamos en lugar de insertarlo
    if (favoritosSet.has(recursoId)) {
        const { error } = await supabaseClient
            .from('favoritos')
            .delete()
            .eq('user_id', userId)
            .eq('recurso_id', recursoId);

        if (error) {
            console.error('Error al eliminar:', error);
            alert('No se pudo quitar del estante.');
        } else {
            // actualizar UI
            favoritosSet.delete(recursoId);
            boton.classList.remove('saved');
            const icon = boton.querySelector('i');
            if (icon) icon.classList.replace('fas', 'far');
            alert('Recurso eliminado de Mi Estante 🗑️');
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
            alert("¡Este libro ya está en tu estante! ✨");
        } else {
            console.error("Error al guardar:", error);
            alert("Hubo un problema al guardar...");
        }
    } else {
        // Cambiamos el icono para dar feedback visual
        const icon = boton.querySelector('i');
        if (icon) icon.classList.replace('far', 'fas'); // De borde a relleno
        boton.classList.add('saved');
        favoritosSet.add(recursoId);
        alert("¡Guardado en Mi Estante! 📚");
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

