import express from 'express'
import logger from 'morgan'
import path from 'path';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

const port = process.env.PORT ?? 3000

const app = express()
const server=createServer(app)
const io=new Server(server)

io.on('connection', (socket)=>{
    console.log('a user has connected')
    socket.on('disconnect', ()=>{
        console.log('a user has disconnected')
    })

    socket.on('chat message', (msg)=>{
        io.emit('chat message', msg)
    })
})

app.use(logger('dev'))

// Sirve los archivos estáticos (CSS, imágenes, JS, etc.)
app.use('/assets', express.static(path.join(process.cwd(), 'client/view/assets')));

app.get('/', (req,res)=>{
    res.sendFile(path.join(process.cwd(), 'client/view/index.html'));
})

server.listen(port,()=>{
    console.log(`server running on port ${port}`)
})