/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 14/08/13
 * Time: 15:43
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , _ = require('underscore')

var PlayerSchema = new Schema ({
    game: {type: Schema.ObjectId, ref: 'Game'},
    user: {type: Schema.ObjectId, ref: 'User'},
    lives: Number,
    bombMax: Number,
    bombRange: Number,
    position:  {
        x: Number,
        y: Number,
        z: Number
    }
})

mongoose.model('Player', PlayerSchema)