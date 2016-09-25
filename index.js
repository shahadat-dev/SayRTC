'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
var express = require('express');
var cors = require('cors');

var users = [];

var app = express();
app.use(cors());
var server = http.createServer(app, function(req, res){
  console.log("get /");
   res.setHeader('Access-Control-Allow-Origin', '*');
});


app.use(express.static(__dirname));

server.listen(8008);


var io = socketIO.listen(server);
io.sockets.on('connection', function(socket) {

  //****************************************event listeners***********************************************

  socket.on('create', function(username) {
    log('Received request to create room ' + username);
    socket.username = username;
    users.push(username);
    socket.join(username);
    socket.emit('login', { username: socket.username });
    io.emit('created', { users: users });  
  });

  socket.on('disconnect', function(){
    console.log('received bye');
    socket.leave(socket.username);
    var i = users.indexOf(socket.username);
    if (i > -1) {
      users.splice(i,1);
    }
    io.emit('bye', { username: socket.username, users: users }); 
  });

  socket.on('join', function (room) {
    io.sockets.in(room).emit('join', room);
    socket.join(room);
    socket.emit('joined', room);
  });

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  //*****************************************functions******************************************************
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }
});