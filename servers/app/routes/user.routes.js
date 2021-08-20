const {authJwt, resources, schedules} = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
        );
        res.set('Cache-Control', 'no-store');
        next();
    });

    app.get('/',
        [authJwt.verifyToken],
        (req, res) => { 
        return res.render('index', {
            page:'Home',
            menuId:'home', 
            account: req.account,
            contentpath: 'public/home',
        });
    });

    app.get('/resources',
        [authJwt.verifyToken,resources.getResources],
        (req, res) => {
        return res.render('index', {
            page:'Resources',
            menuId:'resources', 
            account: req.account,
            contentpath: 'public/resources',
            resources: req.resources,
        });
    }); 

    app.get(
        '/reservations',
        [authJwt.verifyToken,authJwt.isUser,schedules.getCurrentSchedules] ,
        (req, res) => {
        return res.render('index', {
          page:'My Reservations',
          menuId:'reservations', 
          account: req.account,
          contentpath: 'user/reservations',
          schedules: req.schedules,
        });
    }); 

    app.get(
        '/history', 
        [authJwt.verifyToken,authJwt.isUser,schedules.getPastSchedules],
        (req, res) => {
        return res.render('index', {
            page:'My History',
            menuId:'history', 
            account: req.account,
            contentpath: 'user/history',
            schedules: req.schedules,
        });
    }); 

    app.get(
        '/:temporalPath',
        [authJwt.verifyToken,schedules.checkSchedule],
        controller.openResource
    );
};