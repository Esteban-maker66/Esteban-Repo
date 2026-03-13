const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'TU_KeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyMEY_AQUI'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Inicializar Modo Oscuro
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Función de notificación (Copiada de app.js para que funcione aquí)
function notificar(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${mensaje}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

    const form = document.getElementById('form-recurso');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-guardar');
        
        btn.disabled = true;
        btn.innerText = "Enviando...";

        const nuevoLibro = {
            titulo: document.getElementById('titulo').value,
            categoria: document.getElementById('categoria').value,
            url: document.getElementById('url').value,
            aprobado: false // Aquí está la clave de tu moderación
        };

        const { error } = await supabaseClient
            .from('recursos')
            .insert([nuevoLibro]);

        if (error) {
            notificar("Error: " + error.message);
            btn.disabled = false;
            btn.innerText = "+ Publicar recurso";
        } else {
            notificar("¡Recurso enviado! Pendiente de aprobación.");
            form.reset();
            btn.disabled = false;
            btn.innerText = "+ Publicar recurso";
        }
    });
});