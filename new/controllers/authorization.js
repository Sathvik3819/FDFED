const authorizeR = (req, res, next) => {
    if (req.user?.userType !== "Resident") {
        return res.redirect("/login");
    }
    next();
};

const authorizeS = (req, res, next) => {
    if (req.user?.userType !== "Security") {
        return res.redirect("/login");
    }
    next();
};

const authorizeW = (req, res, next) => {
    if (req.user?.userType !== "Worker") {
        return res.redirect("/login");
    }
    next();
};

const authorizeC = (req, res, next) => {
    if (req.user?.userType !== "CommunityManager") {
        return res.redirect("/login");
    }
    next();
};

const authorizeA = (req, res, next) => {
    if (req.user?.userType !== "admin") {
        return res.redirect("/AdminLogin");
    }
    next();
};

export { authorizeR, authorizeS, authorizeW, authorizeC, authorizeA };
