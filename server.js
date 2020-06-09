//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT || 8080;

// express routing
app.use(express.static('public'));


// signaling
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (room) {
        console.log('create or join to room ', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
	console.log(socket.id);
	var SocketId = socket.id
        var numClients = myRoom.length;
	socket.emit('create_video_tag',room,SocketId);

        console.log(room, ' has ', numClients, ' clients');

        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room,SocketId);
        } else if (numClients == 1) {
            socket.join(room);
            socket.emit('joined', room,SocketId);
        } else {
            //socket.emit('full', room);
            socket.join(room);
            socket.emit('joined', room,SocketId);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

});

// listener
http.listen(port || 8080, function () {
    console.log('listening on', port);
});
