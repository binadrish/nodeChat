// Importa la biblioteca de Socket.IO desde un CDN
import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';

// Módulo para gestionar el nombre de usuario ---------------------------------------------------
const getUsername = async () => {
    const username = localStorage.getItem('username');
    if (username) {
        console.log(`User existed ${username}`);
        return username;
    }

    // Obtiene un nombre de usuario aleatorio si no existe en el almacenamiento local
    const res = await fetch('https://random-data-api.com/api/users/random_user');
    const { username: randomUsername } = await res.json();

    localStorage.setItem('username', randomUsername);
    return randomUsername;
};
// ----------------------------------------------------------------------------------------------

// Configura la conexión con el servidor de WebSocket -------------------------------------------
const socket = io({
    auth: {
        username: await getUsername(), // Obtiene el nombre de usuario del almacenamiento local o genera uno nuevo
        serverOffset: 0 // Inicializa el desplazamiento del servidor para mensajes
    }
});
// ----------------------------------------------------------------------------------------------

// Módulo de interacción con el DOM -------------------------------------------------------------
const form = document.getElementById('form'); // Formulario para enviar mensajes
const input = document.getElementById('input'); // Campo de entrada de texto
const messages = document.getElementById('messages'); // Lista para mostrar los mensajes

// Escucha los mensajes recibidos del servidor y los agrega a la lista
socket.on('chat message', (msg, serverOffset, username) => {
    const item = `
        <li>
            <p>${msg}</p>
            <small>${username}</small>
        </li>`;
    messages.insertAdjacentHTML('beforeend', item);
    socket.auth.serverOffset = serverOffset; // Actualiza el desplazamiento del servidor

    // Desplaza automáticamente hacia el final de la lista de mensajes
    messages.scrollTop = messages.scrollHeight;
});

// Maneja el envío de mensajes desde el formulario
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario

    if (input.value) {
        socket.emit('chat message', input.value); // Envía el mensaje al servidor
        input.value = ''; // Limpia el campo de entrada
    }
});
// ----------------------------------------------------------------------------------------------
