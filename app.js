const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const grid = document.getElementById('grid-recursos');
const loader = document.getElementById('loader');

async function obtenerRecursos() {
    loader.classList.remove('hidden');
    
    // Aquí es donde haremos la consulta real a tu tabla
    let { data: recursos, error } = await supabase
        .from('recursos')
        .select('*');

    loader.classList.add('hidden');

    if (error) {
        console.error('Error:', error);
        return;
    }

    renderizar(recursos);
}

function renderizar(lista) {
    grid.innerHTML = '';
    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'libro-card';
        card.innerHTML = `
            <strong>${item.titulo}</strong>
            <small>${item.categoria}</small>
            <a href="${item.url}" class="btn-download">Abrir</a>
        `;
        grid.appendChild(card);
    });
}

// Iniciar carga
// obtenerRecursos(); 