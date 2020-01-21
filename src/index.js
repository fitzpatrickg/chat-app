const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();

//this is another way to create a server, using the http core module, and passing in our express function
const server = http.createServer(app);

//socketio returns a function, we invoke the function on io, passing in the server
const io = socketio(server);


const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');
app.use(express.static(publicDirPath));


let count = 0;

/**
 * On chat.js, there is a socket.on() call that is waiting for the message event.
 * Each time we emit "message", the .on('message') in chat.js catches it, and does it's thing (prints to console)
 */
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    //broadcast sends message to everybody except the user that fired the event (like leaving a chat room)
    

    //join a room
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            callback(error);
        }

        socket.join(room);

        socket.to(room).emit('message', generateMessage('Admin', 'welcome!'));
        socket.broadcast.to(room).emit('message', generateMessage('Admin', `${username} has joined ${room}!`));

        //creates an event that is emitted when a new user joins a room called roomData,
        //it sends an object which contains the room name and a list of users in the room.
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    //you can also pass a callback in for acknowledgement. This callback will emit to the sender's browser. 
    //Not all connected sockets like the message.
    socket.on('sendMessage', (theMessage, callback) => {

        const user = getUser(socket.id);

        //profanity filter
        const filter = new Filter();

        if(filter.isProfane(theMessage)) {
            return callback('Please dont swear on my page!');
        }

        io.to(user.room).emit('message', generateMessage(user.username, theMessage));
        callback('Delivered');
    });

    //build in event for when socket is disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));

            //when a user connects or disconnects from a room, 
            //this event is emitted which updates the number of users in said room.
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

    socket.on('sendLocation', (coords, callback) => {

        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });
});

server.listen(port, () => {
    console.log(`Server started on ${port}...`);
});