var socketio = require('socket.io')
var gameController = require('../app/controllers/gameController')

module.exports.listen = function(app){
    var io = socketio.listen(app)
    io.set('log level', 1);
    io.sockets.on('connection', gameController.connection);

    return io
}