//Import modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//Call the express function to initiate an express app
const app = express();

//This tells express to parse incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser())

// Set EJS as templating engine  
app.set("view engine", "ejs");
app.set('etag', false)

//This tells express we are serving static files (front end files)
app.use(express.static(path.join(__dirname, '../../public')));

//Set routes
require('./routes/reservation.routes')(app);
require('./routes/howto.routes')(app);
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/moderator.routes')(app);
require('./routes/admin.routes')(app);

app.use(
  require("./middlewares/authJwt").verifyToken,
  function(req, res, next){
    res.status(404);
    
    // respond with html page
    if (req.accepts('html')) {
      return res.render('index', {
        page: 'Not Found',
        menuId: '',
        account: req.account,
        contentpath: 'public/not found',
        });
    }
    
    // respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }
    
    // default to plain-text. send()
    res.type('txt').send('Not found');
});

const listen = (port) => {
  /** NB: process.env.PORT is required as you would 
  not be able to set the port manually in production */
  const PORT = process.env.PORT || port;

  //app to listen to specified port
  app.listen(PORT, () => {
    console.log(`HTTP/App Server is running on port ${PORT}.`);
  });
}

module.exports = {
  listen,
};