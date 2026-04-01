var jwt = require("jsonwebtoken");

const getuser = (req, res, next) => {
    //getting user from jwt token and adding ID to req object
    const token = req.header('authorization-token');
    if(!token){
        res.status(401).send({error: "Invalid Token"});
    }
    try {
        const data = jwt.verify(token, "psss");
        req.user = data.user;
        next(); 
    } catch (error) {
        res.status(401).send({error: "Invalid Token"});
    }
}

module.exports = getuser;