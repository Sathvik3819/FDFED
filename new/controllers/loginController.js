import Resident from '../models/resident.js';
import Security from '../models/security.js';
import communityManager from '../models/cManager.js';
import Worker from '../models/workers.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken' 
import admin from '../models/admin.js';

async function authenticateUser(model, email, password, req, res) {
    const user = await model.findOne({ email });
    console.log("User :"+user);
    
    if (!user) {
        req.flash('message', "Invalid email or password");
        return 0;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match :"+isMatch);
    console.log(hashedPassword+" : "+user.password);
    
    
    if (!isMatch) {
        req.flash('message', "Invalid email or password");
        return 0;
    }

    const userType = model.modelName;
    
    // Debug logging for Community Manager
    if (userType === 'CommunityManager') {
        console.log('Community Manager found:', {
            assignedCommunity: user.assignedCommunity,
            type: typeof user.assignedCommunity,
            isNull: user.assignedCommunity === null,
            isUndefined: user.assignedCommunity === undefined,
            isEmpty: user.assignedCommunity === ''
        });
    }
    
   
    
    // Create a token payload based on user type
    let tokenPayload = { id: user._id, userType, email };
    
    // Add community field for users that have it (excluding admin)
    if (userType !== 'Admin') {
        if (userType === 'CommunityManager' && user.assignedCommunity) {
            tokenPayload.community = user.assignedCommunity;
        } else if (user.community) {
            tokenPayload.community = user.community;
        }
    }

    const token = jwt.sign(
        tokenPayload, 
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    console.log(token);
    
    res.cookie('token', token, {
        httpOnly: true,  
        secure: process.env.NODE_ENV === 'PRODUCTION', 
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    return 1;
}

async function AuthenticateR(email, password, req, res) {
    return authenticateUser(Resident, email, password, req, res);
}

async function AuthenticateS(email, password, req, res) {
    return authenticateUser(Security, email, password, req, res);
}

async function AuthenticateW(email, password, req, res) {
    return authenticateUser(Worker, email, password, req, res);
}

async function AuthenticateC(email, password, req, res) {
    return authenticateUser(communityManager, email, password, req, res);
}

async function AuthenticateA(email, password, req, res) {
    return authenticateUser(admin, email, password, req, res);
}

export { AuthenticateR, AuthenticateS, AuthenticateW, AuthenticateC, AuthenticateA };