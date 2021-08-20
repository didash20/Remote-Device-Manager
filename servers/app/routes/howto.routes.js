const authJwt = require("../middlewares/authJwt");

module.exports = function(app) {
    app.get('/howto/:page',
    [authJwt.verifyToken],
    (req, res) => {
    return res.render('index', {
      page: req.params.page,
      menuId:'', 
      account: req.account,
      contentpath: 'public/howto/' + req.params.page,
    });
  });
};
