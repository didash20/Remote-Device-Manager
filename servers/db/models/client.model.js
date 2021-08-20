const mongoose = require("mongoose");

const Client = mongoose.model(
  "Client",
  new mongoose.Schema({
    address: String,
    dates: {
      type : mongoose.Schema.Types.ObjectId,
      ref : 'Dates',
    },
    resource: {
      type : mongoose.Schema.Types.ObjectId,
      ref : 'Resource',
    },
  })
);

module.exports = Client;