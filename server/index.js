// Importa las dependencias necesarias
import express from 'express'; 
import logger from 'morgan'; 
import path from 'path'; 
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import { Server } from 'socket.io'; 
import { createServer } from 'node:http'; 

dotenv.config();

const port = process.env.PORT ?? 3000; 
const app = express(); 
const server = createServer(app); 
const io = new Server(server, {
    connectionStateRecovery:{}  // Recuperación del estado de conexión para WebSocket
});

// Módulo de Base de Datos ----------------------------------------------------------------------
const db = createClient({
    url: "libsql://uncommon-raider-binadrish.turso.io",
    authToken: process.env.DB_TOKEN
});

// Crea la tabla `messages` si no existe
await db.execute(`
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        user TEXT
    )
`);
// ----------------------------------------------------------------------------------------------

// Módulo de WebSocket --------------------------------------------------------------------------
// Maneja la conexión, desconexión y mensajes de los clientes
io.on('connection', async (socket) => {
    console.log('a user has connected'); 

    socket.on('disconnect', () => {
        console.log('a user has disconnected'); 
    });

    socket.on('chat message', async (msg) => {
        let result;
        let username = socket.handshake.auth.username ?? 'anonymous';

        try {
            // Inserta el mensaje en la base de datos
            result = await db.execute({
                sql: `INSERT INTO messages (content, user) VALUES (:msg, :username)`,
                args: { msg, username }
            });
        } catch (error) {
            console.error(error);
            return;
        }

        // Reenvía el mensaje a todos los clientes conectados
        io.emit('chat message', msg, result.lastInsertRowid.toString(), username);
    });

    // Recupera los mensajes no sincronizados para el cliente
    if (!socket.recovered) {
        try {
            const results = await db.execute({
                sql: 'SELECT id, content, user FROM messages WHERE id > ?',
                args: [socket.handshake.auth.serverOffset ?? 0]
            });
            results.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id.toString(), row.user);
            });
        } catch (error) {
            console.log(error);
            return;
        }
    }
});
// ----------------------------------------------------------------------------------------------

// Módulo de Middleware y Rutas ------------------------------------------------------------------
app.use(logger('dev')); // Registra las solicitudes HTTP

// Sirve archivos estáticos (CSS, imágenes, JS, etc.)
app.use('/assets', express.static(path.join(process.cwd(), 'client/view/assets')));

// Ruta principal para servir la página HTML del cliente
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client/view/index.html'));
});
// ----------------------------------------------------------------------------------------------

// Inicia el servidor ----------------------------------------------------------------------------
server.listen(port, () => {
    console.log(`server running on port ${port}`);
});
// ----------------------------------------------------------------------------------------------
