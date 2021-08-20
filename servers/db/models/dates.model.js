const mongoose = require("mongoose");

const Dates = mongoose.model(
  "Dates",
  new mongoose.Schema({
    dateAvailable : Date,
    dateExpiring : Date,
    dateCreated : {
      type : Date,
      default : Date.now
    },
  })
);

module.exports = Dates;