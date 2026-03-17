const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

const form = document.getElementById('form-recurso');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

    const btn = document.getElementById('btn-guardar');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Enviando...";
        }

    const nuevoLibro = {
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        url: document.getElementById('url').value
    };

    const { data, error } = await supabaseClient
        .from('recursos')
        .insert([nuevoLibro]);

    if (error) {
        notificar("Error al subir: " + error.message);
    } else {
        notificar("¡Libro agregado con éxito!");
        form.reset();
    }
    
    if (btn) {
            btn.disabled = false;
            btn.innerText = "+ Publicar";
        }
    });
}
document.addEventListener('DOMContentLoaded', cargarPendientes);

// Dark mode toggle
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
// Mobile menu functionality for admin
document.addEventListener("DOMContentLoaded", function() {
    const hamburgerBtn = document.getElementById("admin-hamburger-btn");
    const mobileMenuOverlay = document.getElementById("admin-mobile-menu-overlay");
    const mobileMenuClose = document.getElementById("admin-mobile-menu-close");

    if (hamburgerBtn && mobileMenuOverlay) {
        // Open mobile menu
        hamburgerBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileMenuOverlay.classList.add("active");
            hamburgerBtn.classList.add("active");
        });

        // Close mobile menu
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener("click", function() {
                closeAdminMobileMenu();
            });
        }

        // Close on overlay click
        mobileMenuOverlay.addEventListener("click", function(e) {
            if (e.target === mobileMenuOverlay) {
                closeAdminMobileMenu();
            }
        });

        // Close on escape key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                closeAdminMobileMenu();
            }
        });
    }
});

function closeAdminMobileMenu() {
    const mobileMenuOverlay = document.getElementById("admin-mobile-menu-overlay");
    const hamburgerBtn = document.getElementById("admin-hamburger-btn");
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove("active");
    }
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove("active");
    }
}

const nuevoLibro = {
    titulo: document.getElementById('titulo').value,
    categoria: document.getElementById('categoria').value,
    url: document.getElementById('url').value,
    aprobado: true // soy el admin, asi que tengo el poder de aprobar al instante
};

// Función para cargar lo que está pendiente
async function cargarPendientes(recursos) {
    const contenedor = document.getElementById('lista-pendientes');
    contenedor.innerHTML = '<p>Buscando recursos pendientes...</p>';

    const { data, error } = await supabaseClient
        .from('recursos')
        .select('*')
        .eq('aprobado', false); // Traemos solo lo no aprobado

    if (error) {
        notificar("Error al cargar pendientes", "error");
        return;
    }

    if (data.length === 0) {
        contenedor.innerHTML = '<p class="non-books">No hay nada pendiente por ahora. ¡Todo limpio!</p>';
        return;
    }

    contenedor.innerHTML = ''; // Limpiamos
    data.forEach(recurso => {

        const fecha = new Date(recurso.created_at).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'libro-card pendiente';
        card.innerHTML = `
        <div class="card-info">
            <strong>${recurso.titulo}</strong>
            <small>${recurso.categoria}</small>
            <div class="meta-info" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">
                <span><i class="fas fa-user"></i> ${recurso.usuario_nombre || 'Usuario'}</span><br>
                <span><i class="fas fa-calendar"></i> ${new Date(recurso.created_at).toLocaleDateString()}</span>
            </div>
        </div>
            <div class="admin-actions">
                <button onclick="aprobarRecurso(${recurso.id})" class="btn-approve">
                    <i class="fas fa-check"></i> Aprobar
                </button>
                <button onclick="eliminarRecurso(${recurso.id})" class="btn-delete">
                    <i class="fas fa-trash"></i> Rechazar
                </button>
            </div>
        `;
        contenedor.appendChild(card);
        return card;
    });
}

// Función para aprobar (Update)
async function aprobarRecurso(id) {

    if(!confirm("¿Aprobar este recurso? Pasará a estar visible para todos.")) return;

    const { error } = await supabaseClient
        .from('recursos')
        .update({ aprobado: true })
        .eq('id', id);

    if (error) {
        notificar("No se pudo aprobar", "error");
    } 
    else {
        notificar("Recurso aprobado y visible", "success");
        cargarPendientes(); // Recargamos la lista
    }
}

// Función para eliminar/rechazar (Delete)
async function eliminarRecurso(id) {
    if(!confirm("¿rechazar y borrar este recurso?")) return;

    const { error } = await supabaseClient
        .from('recursos')
        .delete()
        .eq('id', id);

    if (error) {
        notificar("Error al eliminar", "error");
    } else {
        notificar("Recurso eliminado", "info");
        cargarPendientes();
    }
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', cargarPendientes);

// Protección Admin
async function protegerAdmin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user || user.email !== 'e306711@gmail.com') {
        window.location.href = 'index.html';
    }
}