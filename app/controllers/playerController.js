/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 03/09/13
 * Time: 14:33
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Player = mongoose.model('Player')
    , _ = require('underscore');


/**
 * Créé un objet player associé à une partie et à un utilisateur
 * @param user
 * @param game
 */
exports.createPlayer = function(user, game) {
    var player = new Player({
        game: game._id,
        user: user,
        lives: 3,
        bombMax: 1,
        bombRange: 1,
        position :  {
            x: 0,
            y: 0,
            z: 0
        }
    });
    player.save();
    return player;
}


/**
 * Retourne l'objet Player ayant l'id spécifié
 * @param id
 * @return {Promise}
 */
exports.getPlayer = function(id) {
    Player
        .findOne({ _id : id})
            .exec(function (err, player) {
            if (err) return next(err)
            if (!player) return next(new Error('Failed to load Player ' + id))
            return player
    })
}
