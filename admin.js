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
        alert("Error al subir: " + error.message);
    } else {
        alert("¡Libro agregado con éxito!");
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

