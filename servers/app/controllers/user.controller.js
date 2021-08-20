//import models
const dbmodels = require("../../db/models");
const Resource = dbmodels.resource;
const Schedule = dbmodels.schedule;

const openResource = (req, res) => {
  Resource.findById(req.resource, (err,resource) =>{
    if (err) return catchError(err, req, res);

    if(resource){
      return res.render('resource views/mask', {
        page: resource.name,
        dates: JSON.stringify(req.dates),
      });
    }
    return res.render('index', {
      page: 'Not Found',
      menuId: '',
      account: req.account,
      contentpath: 'public/not found',
    });
  });
};

function catchError(err, req, res) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'user.controller':\n", err);
  return res.status(500).render('index', {
    page: 'Server Error',
    menuId: '',
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  openResource,
};