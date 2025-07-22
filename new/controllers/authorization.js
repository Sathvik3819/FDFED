const authorizeR = (req, res, next) => {
    if (req.user.userType !== "Resident") {
        return res.status(403).json({ "message": "Unauthorized" });
    }
    next();
};

const authorizeS = (req, res, next) => {
    if (req.user.userType !== "Security") {  
        return res.status(403).json({ "message": "Unauthorized" });
    }
    next();
};

const authorizeW = (req, res, next) => {
    if (req.user.userType !== "Worker") {  
        return res.status(403).json({ "message": "Unauthorized" });
    }
    next();
};

const authorizeC = (req, res, next) => {
    if (req.user.userType !== "CommunityManager") {
        return res.status(403).json({ "message": "Unauthorized" });
    }
    next();
};
const authorizeA = (req, res, next) => {
    if (req.user.userType !== "admin") {
        return res.status(403).json({ "message": "Unauthorized" });
    }
    next();
};

export { authorizeR, authorizeS, authorizeW, authorizeC, authorizeA };
