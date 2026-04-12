const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let recursosCargados = []; // Almacenar todos los recursos cargados

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

function renderizarRecursos(recursos) {
    const grid = document.getElementById('grid-recursos');
    grid.innerHTML = '';

    if (recursos.length === 0) {
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.alignItems = 'center';
        grid.style.justifyContent = 'center';
        grid.style.minHeight = 'calc(100vh - 200px)';
        grid.innerHTML = `
            <div style="text-align: center;">
                <p class='books'>📚</p>
                <p class='estante-vacio'>No hay recursos que coincidan con los filtros...</p>
            </div>
        `;
        return;
    }

    grid.style.display = 'grid';
    grid.style.minHeight = 'auto';
    
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
            <small>${recurso.autor_nombre}</small>
            <div class="card-footer" style="margin-top: 10px;">
                <a href="${recurso.url}" target="_blank" class="btn-download">
                    <i class="fas fa-book-open"></i> Leer
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
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

    recursosCargados = recursos; // Guardar recursos cargados
    renderizarRecursos(recursos);

    if (loader) loader.classList.add('hidden');
}

async function quitarDeEstante(recursoId) {
    const confirmar = await mostrarConfirmacion(
        "¿Quitar del estante?", 
        "Podrás volver a agregarlo desde el inicio si lo deseas."
    );
    if(!confirmar) return;

    const loaderContainer = document.getElementById('loader-container');
    loaderContainer.classList.remove('hidden');

    const userId = await obtenerUserId();
    const { error } = await supabaseClient
        .from('favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('recurso_id', recursoId);

    loaderContainer.classList.add('hidden');
    if (!error) cargarMiEstante();
}

function aplicarFiltro() {
    const filterTitle = document.getElementById('filter-title').value.toLowerCase().trim();
    const filterCategory = document.getElementById('filter-categoria-input').value.trim();

    let recursosFiltrados = recursosCargados;

    if (filterTitle) {
        recursosFiltrados = recursosFiltrados.filter(recurso =>
            recurso.titulo.toLowerCase().includes(filterTitle)
        );
    }

    if (filterCategory) {
        // Comparación case-insensitive para categorías
        recursosFiltrados = recursosFiltrados.filter(recurso =>
            recurso.categoria.toLowerCase().trim() === filterCategory.toLowerCase().trim()
        );
    }

    renderizarRecursos(recursosFiltrados);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarMiEstante();
    // Inicializar Dark Mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');

    // Manejar el modal de filtro
    const btnFiltro = document.getElementById('btn-filtro');
    const filterModal = document.getElementById('filter-modal');
    const filterForm = document.getElementById('filter-form');
    const filterReset = document.getElementById('filter-reset');
    const filterTrigger = document.getElementById('filter-select-trigger');
    const filterList = document.getElementById('filter-options-list');
    const filterOpciones = filterList.querySelectorAll('.opcion');
    const filterCategoriaInput = document.getElementById('filter-categoria-input');

    // Sistema de dropdown personalizado para categorías en el filtro
    if (filterTrigger && filterList) {
        filterTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            filterList.classList.toggle('active');
        });

        filterOpciones.forEach(opcion => {
            opcion.addEventListener('click', (e) => {
                e.stopPropagation();
                const valorSeleccionado = opcion.getAttribute('data-value') || '';
                const textoSeleccionado = opcion.innerText;

                filterTrigger.querySelector('span').innerText = textoSeleccionado;
                filterCategoriaInput.value = valorSeleccionado;
                filterList.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!filterTrigger.contains(e.target) && !filterList.contains(e.target)) {
                filterList.classList.remove('active');
            }
        });
    }

    if (btnFiltro) {
        btnFiltro.addEventListener('click', (e) => {
            e.stopPropagation();
            filterModal.classList.add('active');
        });
    }

    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            aplicarFiltro();
            filterModal.classList.remove('active');
        });
    }

    if (filterReset) {
        filterReset.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('filter-title').value = '';
            filterCategoriaInput.value = '';
            filterTrigger.querySelector('span').innerText = 'Todas las categorías';
            renderizarRecursos(recursosCargados);
            filterModal.classList.remove('active');
        });
    }

    // Cerrar modal al hacer clic fuera
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            filterModal.classList.remove('active');
        }
    });
});

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