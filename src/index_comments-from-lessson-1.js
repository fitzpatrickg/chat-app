const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');

const app = express();

//this is another way to create a server, using the http core module, and passing in our express function
const server = http.createServer(app);

//socketio returns a function, we invoke the function on io, passing in the server
const io = socketio(server);


const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');
app.use(express.static(publicDirPath));


let count = 0;

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    //anything we provide after the first arg in our socket.emit is available as an arg in the callback on the client side.
    //note that the first arg is the name of the event the client side will be listening too.
    socket.emit('countUpdated', count);

    socket.on('increment', () => {
        count++;
        
        //socket.emit will emit to a single client, while io.emit will emit to all clients
        //socket.emit('countUpdated', count);
        io.emit('countUpdated', count);
    });
});

server.listen(port, () => {
    console.log(`Server started on ${port}...`);
});