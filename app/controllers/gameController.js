/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 23/08/13
 * Time: 14:02
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Game = mongoose.model('Game')
    , currentGame
    , Player = mongoose.model('Player')
    , playerController = require('./playerController')
    , _ = require('underscore');

/**
 * Affiche la liste des parties existantes
 * @param req
 * @param res
 */
exports.list = function (req, res) {
    Game.find({isPublic : true})
        .populate('owner')
        .exec(function(err, result) {
            var games = []
            if (!err) {
                res.render('game/home', {
                    title: 'Home',
                    games: result,
                    message: req.flash('error')
                })
            } else {
                console.log(err)

            }
        })
}




/**
 * Affiche l'interface de création d'une partie
 * @param req
 * @param res
 */
exports.createGame = function (req, res) {
    if (req.isAuthenticated()) {
        res.render('game/createGame', {
            title: 'Create game',
            game: new Game(),
            message: req.flash('error')
        })
    } else {
        res.redirect('/login');
    }
}


/**
 * Enregistre la nouvelle partie
 * @param req
 * @param res
 */
exports.persistGame = function (req, res) {
    var game = new Game(req.body);
    game.owner = req.user;
    game.members.push(playerController.createPlayer(game.owner, game))
    game.save(function (err) {
        if (err) {
            return res.render('game/createGame', { errors: err.errors, game: game });
        }
        return res.redirect('games/'+game._id);
    })
}


/**
 * Affiche la partie
 * @param req
 * @param res
 */
exports.showGame = function(req, res) {
    Game.findOne({_id : req.params.game})
        .populate('members')
        .exec(function(err, game) {
            if (err) {
                console.log(err)
            } else {
                currentGame = game
                var player
                var isMember = false
                game.members.forEach(function(p) {
                    if (p.user == req.user.id) {
                        isMember = true
                        player = p
                    }
                })
                res.render('game/showGame', {
                    title: game.name,
                    game: game,
                    player: player,
                    isMember: isMember
                })
            }
        })
}


/**
 * Retourne la partie en fonction de l'id en paramettre
 * @param req
 * @param res
 * @param next
 * @param id
 */
exports.game = function (req, res, next, id) {
    Game.findOne({ _id : id })
        .exec(function (err, game) {
            if (err) return next(err)
            if (!game) return next(new Error('Failed to load game ' + id))
            req.params.game = game
            next()
        })
}


/**
 * Ajoute un objet player
 * @param req
 * @param res
 */
exports.playerJoin = function(req, res) {
    var game = new Game(req.params.game)
    game.members.push(playerController.createPlayer(req.user.id, game))
    Game.update({ _id : game.id}
        , { $set : { 'members' : game.members}}
        , function (err) {
            if (err) { throw err; }
            console.log('game modified')
    })
    res.redirect('/games/'+game._id)
}





exports.connection = function(socket) {

    // on envoie les id et positions de tous les joueurs
    var playersPositions = [];

    var game = currentGame
    Player.find({ game: game }).exec(function (err, players) {
        _.each(players, function(player){
            playersPositions.push({userid : player.id, position : player.position })
        })
        socket.emit(
            'playersPositions', playersPositions
        )
    })

    socket.on('data', function (data) {

        Player.findOne({_id : data.userid}, function(err, player) {
            player.position = data.centerp;
            player.save();
        });
    });

    socket.on('moveCharac', function (data) {
        socket.broadcast.emit('moveCharac', data);
    });
}