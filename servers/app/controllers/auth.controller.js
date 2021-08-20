const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/auth.config");
const dbmodels = require("../../db/models");
const User = dbmodels.user;
const Role = dbmodels.role;

const signup = (req, res) => {
  const fname = req.body.firstname,
        lname = req.body.lastname,
        uname = req.body.username,
        email = req.body.email,
        region = req.body.region,
        institution = req.body.institution,
        psw = req.body.password;

  const user = new User({
    firstname: fname,
    lastname: lname,
    username: uname,
    email: email,
    region: region,
    institution: institution,
    password: bcrypt.hashSync(psw, 8)
  });

  user.save((err, user) => {
    if (err) return catchError(err,req,res);

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) return catchError(err,req,res);

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) return catchError(err,req,res);

            return login(req, res);
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) return catchError(err,req,res);

        user.roles = [role._id];
        user.save(err => {
          if (err) return catchError(err,req,res);

            return login(req, res);
        });
      });
    }
  });
};

const login = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) return catchError(err,req,res);

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      const authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      let options = {
      path:"/",
      sameSite:true,
      maxAge: 1000 * 60 * 60 * 24, // would expire after 24 hours
      httpOnly: true, // The cookie only accessible by the web server
      };

      res.cookie('x-access-token',token, options);
      return res.send({ message: "Logged in successfully!" });

    });
};

const logout = (req, res) => {
  res.clearCookie('x-access-token');
  res.redirect('/');
  return;
};

function catchError(err,req,res){
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'auth.controller.js':\n",err);
  return res.status(500).render('index', {
      page:'Server Error',
      menuId:'', 
      account: req.account,
      contentpath: 'public/server error',
    });
}

module.exports = {
  signup,
  login,
  logout,
};