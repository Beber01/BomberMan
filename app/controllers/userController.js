
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
    , User = mongoose.model('User')
    , Game = mongoose.model('Game')
    , Invite = mongoose.model('Invite')
    , _ = require('underscore');

//exports.signin = function (req, res) {}

/**
 * Auth callback
 */

exports.authCallback = function (req, res, next) {
    res.redirect('/')
}

/**
 * Show login form
 */

exports.login = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/home')
    } else {
        res.render('users/login', {
            title: 'Login',
            message: req.flash('error')
        })
    }
}

/**
 * Show sign up form
 */

exports.register = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/users/'+req.user.id)
    } else {
        res.render('users/register', {
            title: 'Register',
            user: new User()
        })
    }
}

/**
 * Logout
 */

exports.logout = function (req, res) {
    req.logout()
    res.redirect('/login')
}

/**
 * Session
 */

exports.session = function (req, res) {
    res.redirect('/')
}


/**
 * Create user
 */


exports.create = function (req, res) {
    var user = new User(req.body)
    user.save(function (err) {
        if (err) {
            return res.render('users/register', { errors: err.errors, user: user })
        }
        req.logIn(user, function(err) {
            if (err) return next(err)
            return res.redirect('/')
        })
    })
}

/**
 *  Show profile
 */

exports.show = function (req, res) {
    var user = req.profile
    Game.find({owner : user._id})
        .exec(function(err, games) {
            if (err) {
              console.log(err)
            }

            var publicGames = []
            var privateGames = []
            _.each(games, function(game) {
                if (game.isPublic) {
                    publicGames.push(game)
                } else {
                    privateGames.push(game)
                }
            })

            //On vérifie que l'utilisateur n'est pas déjà membre de la partie
            Invite.find({user : user})
                .populate('game')
                .populate('sender')
                .exec(function(err, invites) {
                    res.render('users/show', {
                        title: user.username,
                        user: user,
                        publicGames: publicGames,
                        privateGames: privateGames,
                        invites: invites
                    })
                })
    })
}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
    User
        .findOne({ _id : id })
        .exec(function (err, user) {
            if (err) return next(err)
            if (!user) return next(new Error('Failed to load User ' + id))
            req.profile = user
            next()
        })
}


