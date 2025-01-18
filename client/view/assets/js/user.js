// Importa la biblioteca de Socket.IO desde un CDN para manejar WebSockets en el cliente
import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';

const getUsername = async ()=>{
    const username = localStorage.getItem('username')
    if (username){
        console.log(`User existed ${username}`)
    }
    const res = await fetch('https://random-data-api.com/api/users/random_user')
    const { username: randomUsername } = await res.json()

    localStorage.setItem('username', randomUsername)
    return randomUsername
}

// Establece la conexión con el servidor de WebSocket
const socket = io({
    auth:{
        username: await getUsername(),
        serverOffset:0
    }
});




// Obtiene referencias a los elementos del DOM necesarios para el chat
const form = document.getElementById('form'); // El formulario para enviar mensajes
const input = document.getElementById('input'); // El campo de entrada de texto
const messages = document.getElementById('messages'); // La lista donde se mostrarán los mensajes



// Escucha el evento 'chat message' emitido por el servidor
socket.on('chat message', (msg, serverOffset, username) => {
    const item = `<li>
      <p>${msg}</p>
      <small>${username}</small>
    </li>`
    messages.insertAdjacentHTML('beforeend', item)
    socket.auth.serverOffset = serverOffset
    // scroll to bottom of messages
    messages.scrollTop = messages.scrollHeight
  })


// Maneja el envío del formulario para enviar mensajes
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Previene que la página se recargue al enviar el formulario

    // Verifica si el campo de entrada no está vacío
    if (input.value) {
        // Emite el evento 'chat message' con el mensaje ingresado al servidor
        socket.emit('chat message', input.value);
        // Limpia el campo de entrada después de enviar el mensaje
        input.value = '';
    }
});
