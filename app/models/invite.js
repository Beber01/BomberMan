/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 14/08/13
 * Time: 15:40
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , _ = require('underscore')

var InviteSchema = new Schema ({
    sender: {type: Schema.ObjectId, ref: 'User'},
    user: {type: Schema.ObjectId, ref: 'User'},
    game: {type: Schema.ObjectId, ref: 'Game'}
})

mongoose.model('Invite', InviteSchema)