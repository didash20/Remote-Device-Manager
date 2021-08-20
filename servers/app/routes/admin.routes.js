const {authJwt, resources, schedules, users, imagestorage, verifySignUp} = require("../middlewares");
const create = require("../controllers/create.controller");
const clear = require("../controllers/clear.controller");

module.exports = function(app) {

  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    res.set('Cache-Control', 'no-store');
    next();
  })

  app.post(
    "/createResource",
    [authJwt.verifyToken,authJwt.isAdmin,imagestorage.singleresourceimage],
    create.createResource
  );

  app.post(
    "/clearResource",
    [authJwt.verifyToken,authJwt.isAdmin],
    clear.clearResource
  );

  app.get(
    '/admin/createResource', 
    [authJwt.verifyToken,authJwt.isAdmin],
    (req, res) => { 
    return res.render('index', {
      page:'Create Resource',
      menuId:'createResource', 
      account: req.account,
      contentpath: 'admin/create resource',
    });
  });

  app.get(
    '/admin/createUser', 
    [authJwt.verifyToken,authJwt.isAdmin],
    (req, res) => { 
    return res.render('index', {
      page:'Create User',
      menuId:'createUser', 
      account: req.account,
      contentpath: 'admin/create user',
    });
  });
  
  app.get(
    '/admin/users', 
    [
      authJwt.verifyToken,
      authJwt.isAdmin,
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

  app.post(
    '/admin/createUser', 
    [
      authJwt.verifyToken,
      authJwt.isAdmin,
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    create.createUser
  );

  app.post(
    '/admin/clearUser', 
    [
      authJwt.verifyToken,
      authJwt.isAdmin,
    ],
    clear.clearUser
  );

};