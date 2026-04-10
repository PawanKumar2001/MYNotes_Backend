const express = require("express");
const User = require("../Models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var getuser = require('../Middleware/getuser');
const { body, validationResult } = require("express-validator");

// Route 1 - User creation
// Endpoint - /api/authorization/createuser
router.post("/createuser", [
    body("name", "Enter a longer name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password length too short").isLength({ min: 8 }),
  ],
  async (req, res) => {
    //error handling
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //check if user exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({ error: "user already exists" });
      }

      //using bcryptjs to secure the user password
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      //creating new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      //using JWT to create a token and use user ID to verify it
      const data = {
        user: {
          id: user.id,
          name: user.name
        },
      };

      const authorizationToken = jwt.sign(data, "psss");

      res.json({ authorizationToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Error from server side :(");
    }
  }
);

// Route 2 - Authenticating a user
// Endpoint - /api/authorization/login
router.post("/login", [
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    //error handling, returning bad request
    var success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            
            return res.status(400).json({success, error: "please enter valid credentials"});
        }
        const passCompare = await bcrypt.compare(password, user.password);
        if(!passCompare){
            return res.status(400).json({error: "please enter valid credentials"}); 
        }

        const data = {
            user: {
              id: user.id,
              name: user.name
            },
          };

          success = true;
          const authorizationToken = jwt.sign(data, "psss" );
          res.json({ success, authorizationToken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error from server side :("); 
    }
  }
);

// Route3 - Get the user details
// Endpoint - /api/authorization/getuser
router.post("/getuser", getuser, async (req, res) => {
try {
    var userID = req.user.id;
    const user = await User.findById(userID).select("-password");
    res.send(user);
} catch (error) {
    console.error(error.message);
        res.status(500).send("Error from server side :("); 
}
});

// Route 4 - Update user details
// Endpoint - /api/authorization/updateuser
router.put("/updateuser", getuser, [
    body("name", "Enter a longer name").optional().isLength({ min: 3 }),
    body("password", "Password length too short").optional().isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, password } = req.body;

      // At least one field must be provided
      if (!name && !password) {
        return res.status(400).json({ error: "Provide a new name or password to update." });
      }

      const updatedFields = {};

      if (name) {
        updatedFields.name = name;
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updatedFields.password = await bcrypt.hash(password, salt);
      }

      // Update user in DB
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updatedFields },
        { new: true }
      );

      // Issue a fresh token with updated name
      const data = {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
        },
      };

      const authorizationToken = jwt.sign(data, "psss");
      res.json({ success: true, authorizationToken });

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Error from server side :(");
    }
  }
);

module.exports = router;
