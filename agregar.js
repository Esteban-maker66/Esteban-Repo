const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Función de notificación
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
    }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    
    const form = document.getElementById('form-recurso');
    const btnGuardar = document.getElementById('btn-guardar');
    const campos = form.querySelectorAll('input[required]');
    const inputOculto = document.getElementById('categoria-input');
    const trigger = document.getElementById('select-trigger');
    const list = document.getElementById('options-list');
    const opciones = document.querySelectorAll('.opcion');

    function validarFormulario() {
        let todosLlenos = true;

        campos.forEach(campo => {
            if (campo.value.trim() === '') {
                todosLlenos = false;
            }
        });

        const categoriaValida = inputOculto.value && inputOculto.value !== "" && inputOculto.value !== "Sin categoría";
        
        if (!categoriaValida) {
            todosLlenos = false;
            trigger.style.borderColor = "var(--border)";
        } else {
            trigger.style.borderColor = "var(--border)";
            trigger.style.background = "var(--background)";
        }

        btnGuardar.disabled = !todosLlenos;
    }

    campos.forEach(campo => {
        campo.addEventListener('input', validarFormulario);
    });

    if (trigger && list) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            list.classList.toggle('active');
        });

        opciones.forEach(opcion => {
            opcion.addEventListener('click', (e) => {
                e.stopPropagation();
                const valorSeleccionado = opcion.getAttribute('data-value') || opcion.getAttribute('value');
                const textoSeleccionado = opcion.innerText;

                trigger.querySelector('span').innerText = textoSeleccionado;
                inputOculto.value = valorSeleccionado;
                list.classList.remove('active');

                validarFormulario();
            });
        });

        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !list.contains(e.target)) {
                list.classList.remove('active');
            }
        });
    }

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        btnGuardar.innerText = "Enviando...";

        const { data: { session } } = await supabaseClient.auth.getSession();
        const emailActivo = session ? session.user.email : "Invitado";
        const nombreActivo = session ? session.user.user_metadata.full_name : "Invitado";

        const nuevoLibro = {
            titulo: document.getElementById('titulo').value,
            categoria: inputOculto.value, 
            url: document.getElementById('url').value,
            aprobado: false,

            usuario_correo: emailActivo,
            usuario_nombre: nombreActivo,
            created_at: new Date().toISOString() 
        };  

        const { error } = await supabaseClient.from('recursos').insert([nuevoLibro]);

        if (error) {

            notificar("Error: " + error.message, "error");
            btnGuardar.disabled = false;
            btnGuardar.innerText = "+ Publicar recurso";
        } else {
            notificar("¡Enviado con éxito!", "success");
            form.reset();
            inputOculto.value = ""; 
            trigger.querySelector('span').innerText = "Sin categoría";
            validarFormulario(); // Reset visual del botón
            btnGuardar.innerText = "+ Publicar recurso";
        }
    });

    validarFormulario();
});