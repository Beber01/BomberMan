var express = require('express')
    , fs = require('fs')
    , passport = require('passport')

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// if test env, load example file
var env = process.env.NODE_ENV || 'development'
    , config = require('./config/config')[env]
    , auth = require('./config/authorization')
    , mongoose = require('mongoose')

// Bootstrap db connection
mongoose.connect(config.db)

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
    require(models_path+'/'+file)
})

// bootstrap passport config
require('./config/passport')(passport, config)

var app = express()
// express settings
require('./config/express')(app, config, passport)

// Bootstrap routes
require('./config/routes')(app, passport, auth)

var server = require('http').createServer(app);


// Start the app by listening on <port>
var port = process.env.PORT || 3000
//app.listen(port)
server.listen(port);
console.log('Express app started on port '+port)

// expose app
exports = module.exports = app

var io = require('./config/sockets').listen(server)

