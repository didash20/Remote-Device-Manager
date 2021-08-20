//Import modules
const net = require('net');

//Import controllers
const clientdatabase = require('./controllers/client.controller');

// Create Server for Measurements Live communication
const MLserver = net.createServer();

// Measurements Live Server Events
MLserver.on('close', er => { console.log('\n\rConnection with Measurements Live WebServer closed'); });

MLserver.on('connection', async webclient => {

  const currentdatetime = new Date();
  const client = await clientdatabase.getClient(webclient.remoteAddress);
  
  if(client){
    const dates = await clientdatabase.getDates(client);

    if(currentdatetime > dates.dateExpiring){
      webclient.end();
    }
    else{
      const resource = await clientdatabase.getResource(client);
      const webremote = new net.Socket();

      webremote.connect(1313,resource.host, () => {
        console.log('\n\rMeasurements Live WebServer connection successfull');
      });
      webremote.pipe(webclient)
      webclient.pipe(webremote);
    }
  }
});

const listen = (port) => {
  //Server to listen to specified port
  MLserver.listen(port, () => { 
    console.log('server listening to %j',MLserver.address()); 
  });
}

module.exports = {
  listen,
};