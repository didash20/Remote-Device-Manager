const {authJwt, resources, schedules, accounts, users} = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.get(
    '/moderator/statistics', 
    [
      authJwt.verifyToken,
      authJwt.isModerator,
      users.getUsers,
      resources.getResources,
      schedules.getAllSchedules,
    ],
    (req, res) => { 
    return res.render('index', {
      page:'Statistics',
      menuId:'statistics', 
      account: req.account,
      resources: req.resources,
      schedules: req.schedules,
      users: req.users,
      contentpath: 'moderator/statistics',
    });
  });
  
  app.get(
    '/moderator/users', 
    [
      authJwt.verifyToken,
      authJwt.isModerator,
      users.getUsersByInstitution,
    ],
    (req, res) => { 
    return res.render('index', {
      page:'Users',
      menuId:'users', 
      account: req.account,
      users: req.users,
      contentpath: 'moderator/users',
    });
  });
};