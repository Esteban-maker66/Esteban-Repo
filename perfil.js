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

document.addEventListener('DOMContentLoaded', async () => {
    // 1 Aplicar tema guardado
    const checkbox = document.querySelector('#checkbox');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if(checkbox) checkbox.checked = true;
    }

    // 2 Escuchar cambios de tema
    checkbox?.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // 3 Verificar si el usuario ya está logueado
    const { data: { session } } = await supabaseClient.auth.getSession();
    actualizarInterfaz(session);

    // 4 Escuchar cambios de autenticación en tiempo real
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        actualizarInterfaz(session);
    });
});

async function loginConGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/perfil.html'
        }
    });
    if (error) alert("Error al conectar: " + error.message);
}

async function logout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('arrecife_session_id');
    location.reload();
}

function actualizarInterfaz(session) {
    const logOutDiv = document.getElementById('auth-logged-out');
    const logInDiv = document.getElementById('auth-logged-in');

    if (session) {
        logOutDiv.style.display = 'none';
        logInDiv.style.display = 'block';

        const user = session.user.user_metadata;
        document.getElementById('user-avatar').src = user.avatar_url;
        document.getElementById('user-name').innerText = user.full_name;
        document.getElementById('user-email').innerText = session.user.email;
        
        
        localStorage.setItem('arrecife_session_id', session.user.id);
    } else {
        logOutDiv.style.display = 'block';
        logInDiv.style.display = 'none';
    }
}