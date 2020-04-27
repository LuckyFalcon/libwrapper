const expressJwt = require('express-jwt');
const config = require('../config.json');
const userService = require('../helpers/user-auth');

function jwt(roles = []) {
    
    
    if (typeof roles === 'string') {
        roles = [roles];
    }

    //Import secret
    const secret = config.secret;

    return [
        // authenticate JWT token and set user to request object (req.user)
        expressJwt({ secret, checkRevoked }).unless({
        path: [
            // Routes that don't require authentication
            '/authenticate',
            '/register',
            '/getPoint'
        ]
        }),
        // authorize based on user role
        (req, res, next) => {
            if (roles.length && !roles.includes(req.user.role)) {
                // user's role is not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }
            // authentication and authorization successful
            next();
        }
    ];
}

async function checkRevoked(req, payload, done) {
    const user = await userService.getById(payload.sub);
    // No user is found remove token
    if (!user) {
        return done(null, true);
    }

    done();
};

module.exports = jwt;