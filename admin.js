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

const CLAVE_ACCESO = "CentroMarAzul70305";
function verificarAcceso() {
    const intento = prompt("Introduce la clave de administrador para publicar:");
    
    if (intento !== CLAVE_ACCESO) {
        alert("Acceso denegado. Volviendo al inicio.");
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// Solo si la clave es correcta, el sistema deja que el resto del script funcione
if (!verificarAcceso()) {
    // Si no es correcto, se detiene la ejecución
    throw new Error("Acceso no autorizado");
}

const form = document.getElementById('form-recurso');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página parpadee
    console.log("¡Botón pulsado correctamente!");

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.innerText = "Subiendo...";

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
        form.reset(); // Limpia el formulario para el siguiente libro
    }
    
    btn.disabled = false;
    btn.innerText = "Publicar recurso";
});

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
async function cargarPendientes() {
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
        contenedor.innerHTML = '<p>No hay nada pendiente por ahora. ¡Todo limpio!</p>';
        return;
    }

    contenedor.innerHTML = ''; // Limpiamos
    data.forEach(recurso => {
        const card = document.createElement('div');
        card.className = 'libro-card pendiente';
        card.innerHTML = `
            <strong>${recurso.titulo}</strong>
            <small>${recurso.categoria}</small>
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
    });
}

// Función para aprobar (Update)
async function aprobarRecurso(id) {
    const { error } = await supabaseClient
        .from('recursos')
        .update({ aprobado: true })
        .eq('id', id);

    if (error) {
        notificar("No se pudo aprobar", "error");
    } else {
        notificar("Recurso aprobado y visible", "success");
        cargarPendientes(); // Recargamos la lista
    }
}

// Función para eliminar/rechazar (Delete)
async function eliminarRecurso(id) {
    if(!confirm("¿Seguro que quieres rechazar y borrar este recurso?")) return;

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