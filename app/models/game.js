/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 14/08/13
 * Time: 15:38
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , _ = require('underscore')

var GameSchema = new Schema ({
    name: String,
    isPublic: Boolean,
    tiles: [{type: Schema.ObjectId, ref: 'Tile'}],
    members: [{type: Schema.ObjectId, ref: 'Player'}],
    owner: {type: Schema.ObjectId, ref: 'User'}
})

mongoose.model('Game', GameSchema)