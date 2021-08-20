const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.resource = require("./resource.model");
db.schedule = require("./schedule.model");
db.client = require("./client.model");
db.dates = require("./dates.model");
db.user = require("./user.model");
db.role = require("./role.model");

//Edit this array to add roles
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;