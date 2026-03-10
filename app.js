const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const grid = document.getElementById('grid-recursos');
const loader = document.getElementById('loader');

let todosLosRecursos = [];

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
    renderizar(todosLosRecursos);
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
                <p>No hay recursos que coincidan con tu búsqueda. 🌊</p>
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

obtenerRecursos();