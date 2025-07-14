import Resident from '../models/resident.js';
import Security from '../models/security.js';
import communityManager from '../models/cManager.js';
import Worker from '../models/workers.js';
import bcrypt from 'bcrypt';

async function registerUser(model, email, password, req , res) {
    console.log(email);
    
    let user = await model.findOne({ email });
    console.log(user);
    

    if (user.password != null) {
        req.flash('message', "User already exists");
        return 0;  
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save(); 

    return 1;  
}

async function authenticateR(email, password, req , res) {
    return registerUser(Resident, email, password, req , res);
}

async function authenticateS(email, password, req , res) {
    return registerUser(Security, email, password, req , res);
}

async function authenticateW(email, password, req , res) {
    return registerUser(Worker, email, password, req , res);
}

async function authenticateC(email, password, req , res) {
    return registerUser(communityManager, email, password, req , res);
}

export { authenticateR, authenticateS, authenticateW, authenticateC };
