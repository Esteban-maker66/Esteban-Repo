async function iniciarSesion() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/perfil.html' }
    });
    if (error) notificar("Error al conectar con Google", "error");
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        localStorage.setItem('arrecife_session_id', session.user.id);
        console.log("Usuario conectado:", session.user.email);
    }
});