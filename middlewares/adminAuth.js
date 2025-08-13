// middleware/adminAuth.js
function adminAuth(req, res, next) {
    // Check session-based auth
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    
    // Check JWT if using
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    
    res.status(403).json({ 
        success: false,
        message: 'Admin privileges required'
    });
}

module.exports = adminAuth;