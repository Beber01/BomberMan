/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 14/08/13
 * Time: 15:46
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , _ = require('underscore')

var TileSchema = new Schema ({
    item: {type: Schema.ObjectId, ref: 'Item'},
    type: String
})

mongoose.model('Tile', TileSchema)