/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 13/09/13
 * Time: 10:38
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Invite = mongoose.model('Invite')
    , User = mongoose.model('User')
    , Player = mongoose.model('Player')
    , _ = require('underscore');


/**
 * Créé un objet invite et redirige sur la page de partie
 * @param req
 * @param res
 */
exports.inviteSomeone = function(req, res) {
    User.findOne({username : req.body.username})
        .exec(function(err, userResult) {
            if (err) {
                console.log(err)
            } else {
                var invite = new Invite({
                    sender: req.user.id,
                    user: userResult,
                    game: req.body.game
                })

                Player.findOne({user : invite.user, game : invite.game})
                    .exec(function(err, playerResult) {
                        if (err) {
                            console.log(err)
                        }
                        if (!playerResult) {
                            invite.save(function(err) {
                                if (err) {
                                    console.log(err)
                                }
                            })
                        }
                        res.redirect('games/'+req.body.game)
                    })
            }
        })
}


/**
 * Supprime l'invitation et redirige le joueur sur la partie
 * @param req
 * @param res
 */
exports.acceptInvite = function(req, res) {
    var invite = req.params.invite
    if (invite) {
        invite.remove(function(err) {
            if (err) {
                console.log(err)
            }
        })
        res.redirect('/games/'+invite.game)
    }
}


/**
 * Retourne l'objet invite en fonction de l'id passé en paramettre
 * @param req
 * @param res
 * @param next
 * @param id
 */
exports.invite = function(req, res, next, id) {
    Invite.findOne({ _id : id })
        .exec(function (err, invite) {
            if (err) return next(err)
            if (!invite) return next(new Error('Failed to load invite ' + id))
            req.params.invite = invite
            next()
        })
}
