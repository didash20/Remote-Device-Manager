//import mongoose library
const db = require("./models");

//import configuration options
const dbConfig = require('./config/db.config');

//MONGO_URI 
const MONGO_URI = process.env.MONGO_URI || `mongodb+srv://${dbConfig.USER}:${dbConfig.PASS}@${dbConfig.CLUSTER}.vmqaa.mongodb.net/${dbConfig.DB}?retryWrites=true&w=majority`
//`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`; 

//Connect to DB function
const connect = () => {
  db.mongoose.connect(MONGO_URI, {useNewUrlParser : true, useUnifiedTopology : true})
  .then(() => console.log('DB connected'))
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });
}

const ROLES = db.ROLES
const Role = db.role;
const User = db.user

//Creates 3 main roles [user,moderator,admin] and an admin account
const initial = () => {
  Role.estimatedDocumentCount((err, count) => {
    //If there are not roles 
    if (!err && count !== ROLES.length) {
      //Add a Role for each element in ROLES
      ROLES.forEach( role => {
        //Look if role already exists
        Role.findOne({name: role}, (err,exists) => {
          if (err) {
            return console.log("error", err);
          }

          //If it doesnt exist then create one
          if(!exists){
            new Role({
              name: role,
            }).save(err => {
              if (err) {
                return console.log("error", err);
              }
                
              console.log(`added '${role}' to roles collection`);
            });
          }
        });
      });
    }
  });

  Role.findOne({name: "admin"}, (err,adminrole) => {
    if (err) {
      return console.log("error", err);
    }

    if(adminrole){
      User.find({roles: adminrole._id}, (err,results) => {
        if (err) {
          return console.log("error", err);
        }
        const username = 'admin',
              password = 'admin';

        //If there are no admins create one
        if(!results.length){
          const bcrypt = require("bcryptjs");
          //Create new admin
          new User({
            username: username,
            password: bcrypt.hashSync(password, 8),
            institution: 'General Admin',
          }).save( (err,user) => {
            if (err) {
              return console.log("error", err);
            }
        
            //Look for roles id to add them to user
            Role.find({ name: { $in: ["admin","moderator","user"] } }, (err, roles) => {
              if (err) {
                return console.log("error", err);
              }
              
              //Adding every role to user
              roles.forEach(role => {
                user.roles.push(role._id)
              });
              user.save(err => {
                if (err) {
                  return console.log("error", err);
                }
                           
                console.log(`added 'admin' to user collection\nUsername: '${username}'\nPassword: '${password}'\n`);
              });
            });
          });
        }
      });
    }
  });
}

//export the connect function, to use in server.js
module.exports = { 
  connect,
  initial,
}; 