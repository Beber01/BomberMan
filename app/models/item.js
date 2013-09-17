/**
 * Created with IntelliJ IDEA.
 * User: Romain
 * Date: 14/08/13
 * Time: 16:22
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose')
    , extend = require('mongoose-schema-extend')
    , Schema = mongoose.Schema
    , _ = require('underscore')

var ItemSchema = new Schema({ }, {
    collection : 'items',
    discriminatorKey : '_type'
});

var BombSchema = ItemSchema.extend({
    owner: {type: Schema.ObjectId, ref: 'Player'},
    power: Number,
    range: Number,
    timeUp: Date
});

var UpgraderSchema = ItemSchema.extend({
    type: String
});

mongoose.model('Item', ItemSchema);
mongoose.model('Bomb', BombSchema);
mongoose.model('Upgrader', UpgraderSchema);