const {resources} = require("../middlewares")
const create = require("../controllers/create.controller");
const clear = require("../controllers/clear.controller");

module.exports = function(app) {
  app.post("/newReservation",create.createSchedule);
  app.post("/getReservedDates",resources.getReservedDates);
  app.post("/clearReservation",clear.clearReservation);
  app.post("/clearAllReservations",clear.clearAllReservations);
  app.post("/clearAllResources",clear.clearAllResources);
};