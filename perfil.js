const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Initialize dark mode on page load
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const toggleSwitch = document.querySelector('#checkbox');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleSwitch) toggleSwitch.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleSwitch) toggleSwitch.checked = false;
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
    
    const checkbox = document.querySelector('#checkbox');
    const body = document.body;

    // 1. Sincronización Inicial (Estado -> Interfaz)
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (checkbox) checkbox.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if (checkbox) checkbox.checked = false;
    }

    // 2. Escuchar cambios (Único listener)
    checkbox?.addEventListener('change', () => {
        if (checkbox.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // 3. Autenticación Supabase (Mantén esto igual)
    const { data: { session } } = await supabaseClient.auth.getSession();
    actualizarInterfaz(session);


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