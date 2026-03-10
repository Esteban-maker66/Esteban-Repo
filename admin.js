const supabaseUrl = 'https://kzysbbkdqdsxhnmimwct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXNiYmtkcWRzeGhubWltd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM3NzcsImV4cCI6MjA4ODY0OTc3N30.SN7-jaaaF1zsoj5LRzsV-3-MdWf-lZ00UxvXnUhAWyM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById('form-recurso');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página parpadee
    console.log("¡Botón pulsado correctamente!");

    const btn = document.getElementById('btn-guardar');
    btn.disabled = true;
    btn.innerText = "Subiendo...";

    const nuevoLibro = {
        titulo: document.getElementById('titulo').value,
        categoria: document.getElementById('categoria').value,
        url: document.getElementById('url').value
    };

    const { data, error } = await supabaseClient
        .from('recursos')
        .insert([nuevoLibro]);

    if (error) {
        alert("Error al subir: " + error.message);
    } else {
        alert("¡Libro agregado con éxito!");
        form.reset(); // Limpia el formulario para el siguiente libro
    }
    
    btn.disabled = false;
    btn.innerText = "Publicar en el Arrecife";
});