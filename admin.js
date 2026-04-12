const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Función de notificación
function notificar(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icon = tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i><span>${mensaje}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
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
    contenedor.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; min-height: 37px;"><div class="loader-win11"></div></div>';

    const { data, error } = await supabaseClient
        .from('recursos')
        .select('*')
        .eq('aprobado', false); // Traemos solo lo no aprobado

    if (error) {
        notificar("Error al cargar pendientes", "error");
        return;
    }

    if (data.length === 0) {
        contenedor.innerHTML = '<p class="non-books">Nada pendiente por ahora. ¡Todo limpio!</p>';
        return;
    }

    contenedor.innerHTML = ''; // Limpiamos
    data.forEach(recurso => {

        const fecha = new Date(recurso.created_at).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'recurso-card2 pendiente';
        card.innerHTML = `
        <div class="card-info">
            <strong>${recurso.titulo}</strong>
            <small>(${recurso.categoria})</small>
            <div class="meta-info" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">
                <span><i class="fas fa-book-open"></i> ${recurso.autor_nombre || 'Autor desconocido'}</span><br>
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
                <a href="${recurso.url}" target="_blank" class="btn-inspecc">
                    <i class="fas fa-search"></i> inspeccionar
                </a>
            </div>
        `;
        contenedor.appendChild(card);
        return card;
    });
}

// Función para aprobar (Update)
async function aprobarRecurso(id) {
    const confirmar = await mostrarConfirmacion(
        "¿Aprobar Recurso?", 
        "Pasará a estar visible para todos los estudiantes."
    );

    if(!confirmar) return;
    
    const loaderContainer = document.getElementById('loader-container');
    loaderContainer.classList.remove('hidden');
    
    const { error } = await supabaseClient
        .from('recursos')
        .update({ aprobado: true })
        .eq('id', id);

    loaderContainer.classList.add('hidden');
    
    if (error) {
        notificar("No se pudo aprobar", "error");
    } 
    else {
        notificar("Recurso aprobado y visible", "success");
        setTimeout(() => {
            cargarPendientes(); // Recargamos la lista con un pequeño delay
        }, 500);
    }
}

// Función para eliminar/rechazar (Delete)
async function eliminarRecurso(id) {
    const confirmar = await mostrarConfirmacion(
        "¿Rechazar Recurso?", 
        "No sera visible para todos los estudiantes."
    );
    
    if(!confirmar) return;
    
    const loaderContainer = document.getElementById('loader-container');
    loaderContainer.classList.remove('hidden');
    
    const { error } = await supabaseClient
        .from('recursos')
        .delete()
        .eq('id', id);

    loaderContainer.classList.add('hidden');
    
    if (error) {
        notificar("Error al eliminar", "error");
    } else {
        notificar("Recurso rechazado", "success");
        setTimeout(() => {
            cargarPendientes();
        }, 500);
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

function mostrarConfirmacion(titulo, mensaje) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm');
        const btnAceptar = document.getElementById('confirm-accept');
        const btnCancelar = document.getElementById('confirm-cancel');
        
        document.getElementById('confirm-title').innerText = titulo;
        document.getElementById('confirm-msg').innerText = mensaje;
        
        modal.classList.add('active');

        const cerrar = (resultado) => {
            modal.classList.remove('active');
            resolve(resultado);
        };

        btnAceptar.onclick = () => cerrar(true);
        btnCancelar.onclick = () => cerrar(false);
        // Cerrar si hace clic fuera
        modal.onclick = (e) => { if(e.target === modal) cerrar(false); };
    });
}