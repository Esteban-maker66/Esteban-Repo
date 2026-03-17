const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function cargarMiEstante() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('grid-recursos');
    const userId = localStorage.getItem('arrecife_session_id');

    if (!userId) {
        grid.innerHTML = "<p>Aún no has guardado nada. ¡Explora el Arrecife!</p>";
        loader.classList.add('hidden');
        return;
    }

    const { data: favoritos, error: errFav } = await supabaseClient
        .from('favoritos')
        .select('recurso_id')
        .eq('user_id', userId);

    if (errFav || favoritos.length === 0) {
        grid.innerHTML = "<p class='estante-vacio'>Tu estante está vacío... 📚</p>";
        loader.classList.add('hidden');
        return;
    }

    // Extrae solo los IDs en un array: [1, 5, 8]
    const ids = favoritos.map(f => f.recurso_id);

    const { data: libros, error: errLib } = await supabaseClient
        .from('recursos')
        .select('*')
        .in('id', ids);

    if (errLib) {
        console.error(errLib);
        return;
    }

    renderizarEstante(libros);
}

function renderizarEstante(lista) {
    const grid = document.getElementById('grid-recursos');
    grid.innerHTML = '';
    
    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'libro-card';
        card.innerHTML = `
            <div class="card-header">
                <small class="categoria-tag">${item.categoria}</small>
                <button class="btn-remove" onclick="quitarDeEstante(${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <strong class="titulo">${item.titulo}</strong>
            <a href="${item.url}" target="_blank" class="btn-download"><i class="fas fa-external-link"></i>Abrir</a>
        `;
        grid.appendChild(card);
    });
    document.getElementById('loader').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', cargarMiEstante);

async function quitarDeEstante(recursoId) {
    const userId = localStorage.getItem('arrecife_session_id');
    
    const { error } = await supabaseClient
        .from('favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('recurso_id', recursoId);

    if (!error) {
        location.reload();
    }
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