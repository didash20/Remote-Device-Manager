//Import server modules
const app = require("./servers/app");
const tcpproxy = require("./servers/tcp-proxy");
const MLserver = require("./servers/ML-server");
const db = require("./servers/db");

//Set App/HTTP Server port, listen for requests
app.listen(80);

//Connect to database by calling our connect method
db.connect();

//Create the roles for the database if they do not exist
db.initial();

//Set TCP Server port, listen for requests
tcpproxy.listen(9000)

//Set ML Server port, listen for requests
MLserver.listen(1313)