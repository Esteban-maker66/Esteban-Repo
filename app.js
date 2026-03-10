const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const grid = document.getElementById('grid-recursos');
const loader = document.getElementById('loader');

let todosLosRecursos = [];

async function obtenerRecursos() {
    loader.classList.remove('hidden');
   
    loader.classList.remove('hidden');
     
    // Aquí es donde haremos la consulta real a la tabla
    let { data: recursos, error } = await supabaseClient
        .from('recursos')
        .select('*');

    loader.classList.add('hidden');

    if (error) {
        console.error('Error:', error);
        return;
    }
    
    todosLosRecursos = recursos; // Guarda la "copia" original
    renderizar(todosLosRecursos);
}

document.getElementById('busqueda').addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    
    const filtrados = todosLosRecursos.filter(item => 
        item.titulo.toLowerCase().includes(termino) || 
        item.categoria.toLowerCase().includes(termino)
    );
    
    renderizar(filtrados); // Dibuja solo los que coinciden
});

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
obtenerRecursos(); 