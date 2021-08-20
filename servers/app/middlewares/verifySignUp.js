const dbmodels = require("../../db/models");
const ROLES = dbmodels.ROLES;
const User = dbmodels.user;

const checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Check Username
  User.findOne({
    username: { $regex: new RegExp('^' + req.body.username,'i')}
  }).exec((err, user) => {
    if (err) return catchError(err,req,res);

    if (user) {
      res.status(400).json({ message: "Failed! Username is already in use!" });
      return;
    }

    // Check Email
    if(req.body.email !== ''){
      User.findOne({
        email: req.body.email
      }).exec((err, user) => {
        if (err) return catchError(err,req,res);
  
        if (user) {
          res.status(400).json({ message: "Failed! Email is already in use!" });
          return;
        }
  
        next();
      });
    }
    else{
      next();
    }
  });
};

//Check if entered roles exist
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).json({ message: `Failed! Role ${req.body.roles[i]} does not exist!`});
        return;
      }
    }
  }

  next();
};

//Check if user entered inputs correctly
const checkInputs = (req, res, next) => {
  const uname = req.body.username,
        email = req.body.email,
        region = req.body.region,
        psw = req.body.password;

  //Form server-side validation
  if(!uname.match(/^[A-za-z][A-za-z0-9_-]{4,32}$/gm)){
    res.status(400).json({ message: "Username pattern does not match" });
    return;
  }
  else if(!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gm)){
    res.status(400).json({ message: "Email pattern does not match" });
    return;
  }
  else if(region === ''){
    res.status(400).json({ message: "Region not selected" });
    return;
  }
  else if(!psw.match(/^(?=.*[0-9])(?=.*[A-Za-z_.-]).{7,32}$/gm)){
    res.status(400).json({ message: "Password pattern does not match" });
    return;
  }

  next();
};

function catchError(err,req,res){
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'middlewares/verifySignUp.js':\n",err);
  return res.status(500).render('index', {
      page:'Server Error',
      menuId:'', 
      account: req.account,
      contentpath: 'public/server error',
    });
}


module.exports = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkInputs,
};