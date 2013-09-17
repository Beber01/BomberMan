exports.requiresLogin = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    next()
};


/*
 *  User authorizations routing middleware
 */

exports.user = {
    hasAuthorization : function (req, res, next) {
        if (req.profile.id != req.user.id) {
            return res.redirect('/users/'+req.profile.id)
        }
        next()
    }
}

exports.isAdmin = {
        hasAuthorization : function (req, res, next) {
        if (!req.user.isAdmin) {
            return res.redirect('/users/'+req.user.id)
        }
        next()
    }
}