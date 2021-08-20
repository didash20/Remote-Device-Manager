const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const dbmodels = require("../../db/models");
const Schedule = require("../../db/models/schedule.model");
const User = dbmodels.user;
const Role = dbmodels.role;

const verifyToken = (req, res, next) => {
  let token = req.cookies['x-access-token'];

  if (!token) {
    //No token provided
    req.userId = undefined;
    req.account = undefined;
    return next();
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      require('../controllers/auth.controller').logout();
      return res.send('<script>alert("Session has expired");</script>')
    }

    User.findById(decoded.id, { username: 1, roles: 1 })
      .populate("roles", "-__v")
      .exec((err, user) => {
        if (err) return catchError(err, req, res);

        if(user){
          let roles = []
          user.roles.forEach(role => roles.push(role.name));
  
          req.account = {
            _id: user._id,
            username: user.username,
            roles: roles,
          };
          return next();
        }
        else{
          require('../controllers/auth.controller').logout();
        }
      });
  });
};

const isAdmin = (req, res, next) => {
  //If user is logged in search for roles
  if (req.account) {
    roles = req.account.roles;

    //Search for the role admin inside user roles
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] === "admin") {
        return next();
      }
    }
  }

  //If user isn't registered or doesn't have admin role then return not found
  return res.render('index', {
    page: 'Not found',
    menuId: '',
    contentpath: 'public/not found',
    account: req.account,
  });
};

const isModerator = (req, res, next) => {
  //If user is logged in search for roles
  if (req.account) {
    roles = req.account.roles;

    //Search for the role moderator inside user roles
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] === "moderator") {
        return next();
      }
    }
  }

  //If user isn't registered or doesn't have moderator role then return not found
  return res.render('index', {
    page: 'Not found',
    menuId: '',
    contentpath: 'public/not found',
    account: req.account,
  });
};

const isUser = (req, res, next) => {
  //If user is logged in search for roles
  if (req.account) {
    roles = req.account.roles;

    //Search for the role moderator inside user roles
    for (let i = 0; i < roles.length; i++) {
      if (roles[i] === "user") {
        return next();
      }
    }
  }

  //If user isn't registered or doesn't have user role then return not found
  return res.render('index', {
    page: 'Not found',
    menuId: '',
    contentpath: 'public/not found',
    account: req.account,
  });
};

function catchError(err, req, res) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'middlewares/authJwt.js':\n", err);
  return res.status(500).render('index', {
    page: 'Server Error',
    menuId: '',
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  verifyToken,
  isAdmin,
  isModerator,
  isUser,
};