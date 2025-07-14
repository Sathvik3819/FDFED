import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        req.flash('message', 'Please log in first'); 
        return res.redirect('/login');  
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  
        console.log(req.user);
        
        next(); 
    } catch (error) {
        console.log("Invalid token:", error.message);
        res.clearCookie('token');  
        req.flash('message', 'Session expired, please log in again');
        return res.redirect('/login');
    }
};

export default auth;
