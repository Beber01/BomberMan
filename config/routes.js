
module.exports = function (app, passport, auth) {

    //var declaration
    var users = require('../app/controllers/userController')
    var games = require('../app/controllers/gameController')
    var invites = require('../app/controllers/inviteController')

    // user routes
    app.get('/login', users.login)
    app.get('/register', users.register)
    app.get('/logout',auth.requiresLogin, users.logout)
    app.post('/users', users.create)
    app.post('/users/session', passport.authenticate('local', {failureRedirect: '/login', failureFlash: 'Invalid email or password.'}), users.session)
    app.get('/users/:userId', auth.requiresLogin, users.show)
    app.param('userId', auth.requiresLogin, users.user)

    // invite routes
    app.get('/acceptInvite/:inviteId', auth.requiresLogin, invites.acceptInvite)
    app.post('/invite', auth.requiresLogin, invites.inviteSomeone)
    app.param('inviteId', auth.requiresLogin, invites.invite)

    // game routes
    app.get('/home', auth.requiresLogin, games.list)
    app.get('/createGame', auth.requiresLogin, games.createGame)
    app.post('/games', auth.requiresLogin, games.persistGame)
    app.get('/games/:gameId', auth.requiresLogin, games.showGame)
    app.get('/join/:gameId', auth.requiresLogin, games.playerJoin)
    app.param('gameId', auth.requiresLogin, games.game)

    // home route
    app.get('/', users.login)

}