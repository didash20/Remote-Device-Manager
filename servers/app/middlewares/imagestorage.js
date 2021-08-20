//Import file storage module
const multer = require('multer');
const fs = require('fs');


// Set storage for uploaded resource images
const resourcestorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/Images/Resources');
    },
    filename: function (req, file, cb) {
      cb(null, req.body.name + file.originalname.toString().match(/[.]\w+/))
    },
    path: function (req, file, cb) {
      cb(null, '/Images/Resources/' + file.filename);
    }
})
   
const singleresourceimage = multer({ storage: resourcestorage }).single('image');

const deletesingleresourceimage = function (req,res,next) {
  fs.unlink(req.file.path);
  next();
}

module.exports = {
  singleresourceimage,
  deletesingleresourceimage,
}