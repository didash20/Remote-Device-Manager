const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    region: String,
    institution: String,
    password: String,
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    }],
    schedules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      default : []
    }],
    numschedules: Number,
    dateCreated : {
      type : Date,
      default : Date.now
    },
  })
);

module.exports = User;