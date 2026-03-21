const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function obtenerUserId() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) return user.id;
    let localId = localStorage.getItem('arrecife_session_id');
    if (!localId) {
        localId = 'anon_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('arrecife_session_id', localId);
    }
    return localId;
}

async function cargarMiEstante() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('grid-recursos');
    const userId = await obtenerUserId();

    const { data: favoritos, error: errFav } = await supabaseClient
        .from('favoritos')
        .select('recurso_id')
        .eq('user_id', userId);

    if (errFav || !favoritos || favoritos.length === 0) {
        grid.innerHTML = "<p class='estante-vacio'>Tu estante está vacío... 📚</p>";
        if (loader) loader.classList.add('hidden');
        return;
    }

    const ids = favoritos.map(f => f.recurso_id);

    const { data: recursos, error: errRec } = await supabaseClient
        .from('recursos')
        .select('*')
        .in('id', ids);

    if (errRec) return console.error(errRec);

        grid.innerHTML = ''; 
        grid.style.display = 'grid';
        
        recursos.forEach(recurso => {
        const card = document.createElement('div');
        card.className = 'recurso-card';
        card.innerHTML = `
            <div class="card-header">
                <small class="categoria-tag">${recurso.categoria || 'Recurso'}</small>
                <button class="btn-remove" onclick="quitarDeEstante(${recurso.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <strong>${recurso.titulo}</strong>
            <div class="card-footer" style="margin-top: 10px;">
                <a href="${recurso.link_recurso}" target="_blank" class="btn-download">
                    <i class="fas fa-book-open"></i> Leer
                </a>
            </div>
        `;
        grid.appendChild(card);
    });

    if (loader) loader.classList.add('hidden');
}

async function quitarDeEstante(recursoId) {
    const userId = await obtenerUserId();
    const { error } = await supabaseClient
        .from('favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('recurso_id', recursoId);

    if (!error) cargarMiEstante();
}

document.addEventListener('DOMContentLoaded', () => {
    cargarMiEstante();
    // Inicializar Dark Mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
});