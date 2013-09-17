var path = require('path')
    , rootPath = path.normalize(__dirname + '/..')

module.exports = {
    development: {
        db: 'mongodb://localhost/bomberman',
        root: rootPath,
        app: {
            name: 'BomberMan'
        }
    }
}
