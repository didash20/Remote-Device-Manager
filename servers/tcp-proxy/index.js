//Import modules
const net = require('net');

//Import controllers
const schedulecontroller = require('./controllers/schedule.controller');
const clientdatabase = require('./controllers/client.controller');

// Create an TCP tunneling proxy
const proxy = net.createServer();

//Proxy events
proxy.on('error', err => {
  console.log('\n\rConnection error with Proxy:\n\r%s\n\r', err.message);
});
proxy.on('close', () => {
  console.log('\n\rConnection with Proxy closed');
});


/** When a connection is established with the TCP server
 * Then we have to get the local connection with the instrument ready
 * even though we do not know which instrument the connection will be yet.
 * 
 * To know which instrument is required then we check the 
 * path entered in the brower.
 * 
 * Also we will check availability as users can try to access 
 * the instrument before or after the scheduled time
*/
proxy.on('connection', async (client) => {
    
  //Create the net Socket to communicate with the device
  const remote = new net.Socket();
  //Boolean variable to check if the remote socket communication has been closed
  let remoteclosed = true;

  //Run when connection with device has been established
  remote.on('connect', () => {
    remoteclosed = false;
  });
  
  //Run when an error occurs with device
  remote.on('error', (err) => {
    console.log('\n\rConnection error with device:\n\r%s\n\r', err);
    
    if(err.code === "ETIMEDOUT"){
      client.write(createDocument('Gateway Timeout','504','The device you are trying to reach is unavailable. Contact the Lab administrator.'));
    }
    else if(err.code === "ECONNREFUSED"){
      client.write(createDocument('Bad Gateway','502','The resource you are trying to reach is unavailable. Contact the Lab administrator.'));
    }
    else {
      client.write(createDocument('Internal Server Error','500','The server has failed reading the request. Try refreshing the web page.'));
    }

    
    remote.end();
    client.end();
  });

  //Run when connection with device has closed
  remote.once('close', () => {
    remoteclosed = true;
  });
  
  //Send data to client when receiving data from device
  remote.on('data', remotedata => {
    client.write(remotedata);
  });

  
  //Run when an error occurs with client
  client.on('error', (err) => {
    console.log('\n\rConnection error with Browser:\n\r%s\n\r', err);

    if(err.code === "ECONNRESET"){
      remote.end();
      client.end();
    }
  });

  //Run when the connection with client has closed
  client.once('close', () => {
      console.log('\n\rConnection with client closed');
      remote.end();
  });

  /** When we receive data from a browser 
   * we have to check it the path entered
   * corresponds to an existing path from 
   * the database.
   * 
   * If it does then we check availability
   * 
   * If available then we establish the 
   * connection with the remote device
   */
  client.on('data', async (clientdata) => {

    //Get the string index where the path ends
    const pathendindex = clientdata.toString().search('HTTP');

    //Get the path and HTTP version from the HTTP Request
    const path = clientdata.toString().slice(4,pathendindex).trim();
    const httpversion = clientdata.toString().slice(pathendindex,pathendindex+8).trim();

    //Get the current date and hour when the request is received
    const currentdatetime = new Date();

    //Check if the path is asociated with a schedule
    const schedule = await schedulecontroller.getSchedule(path);

    //Check if schedule-path exists
    if(schedule){

      const refererindex = clientdata.toString().search('Referer: ') + 'Referer: '.length;
      const refererendindex = clientdata.toString().slice(refererindex).search('\r\n') + refererindex;
      const referer = clientdata.toString().slice(refererindex,refererendindex).trim();
      const hostindex = clientdata.toString().search('Host: ') + 'Host: '.length;
      const hostendindex = clientdata.toString().slice(hostindex).search(':') + hostindex;
      const host = clientdata.toString().slice(hostindex,hostendindex).trim();

      if(referer.localeCompare(`http://${host}${path}`) === 0 || referer.localeCompare(`http://${host}/`) === 0){

        const dates = await schedulecontroller.getDates(schedule);
  
        //Check availability
        if(currentdatetime < dates.dateAvailable){
          //Send to Browser not available yet html
          client.write(createDocument('Not Available Yet','403','Your instrument is not available yet'));
        }
        else if(currentdatetime > dates.dateExpiring){
          //Send to Browser expired link html
          client.write(createDocument('Expired Link','403','Your instrument is no longer available'));
        }
        else
        {
          //If the schedule corresponds with the date then get the resource
          const resource = await schedulecontroller.getResource(schedule);

          //Add client to database
          await clientdatabase.createClient(client.remoteAddress,dates,resource);
  
          //encode the source to math the http protocol
          const source = resource.source;
          const dataindex = clientdata.toString().search('\r\n');
  
          //Create HTTP protocol request
          const request = 'GET ' + source + ' HTTP/1.1' + clientdata.toString().slice(dataindex);
  
          //Check if connection with device has not been closed
          if(!remoteclosed){
            //Close the connection
            remote.end();
          }

          setTimeout( () => {
            remote.connect(resource);
            
            //Write request to device
            remote.write(request);
          },100);
        }
      }
      else{
        //Client is new and path doesn't exist then send not found
        client.write(createDocument('Not Found','404','Cannot find: ' + path));
      }
    }
    else {

      //Check if a connection with this client has been established before
      const prevclient = await clientdatabase.getClient(client.remoteAddress);

      //If client has already been connected
      if(prevclient){

        const dates = await clientdatabase.getDates(prevclient);
        const resource = await clientdatabase.getResource(prevclient);

        //create request
        const source = resource.source;
        const dataindex = clientdata.toString().search('\r\n');
        const lastslash = source.lastIndexOf('/');
        const request = 'GET ' + source.slice(0,lastslash).trim() + path + ' HTTP/1.1' + clientdata.toString().slice(dataindex);

        //Check if schedule is still available
        if(!remoteclosed && currentdatetime < dates.dateExpiring){
          //If Socket not closed and available... Send data to device
          remote.write(request);
        }
        else if(currentdatetime < dates.dateExpiring){
          //If schedule hasn't expired re-establish connection
          remote.connect(resource, () => {
            //Connection with device re-established so send data
            remote.write(request);
          });
        }
        else if(currentdatetime >= dates.dateExpiring){
          //If schedule has expired send expired link
          client.write('HTTP/1.0 ' + 302 + ' Found' + '\n\r' + 
                        'Location: ' + path + '\n\r\n\r');
          clientdatabase.deleteClient(prevclient);
          client.end();
          remote.end();
        }
        else{
          //Connection error
          client.write(createDocument('Not Found','404','Cannot find: ' + path));
        }

      }
      else{
        //Client is new and path doesn't exist then send not found
        client.write(createDocument('Not Found','404','Cannot find: ' + path));
      }
    }
  });
});

const createDocument = function(title,status,message){
  //Send to Browser expired link html
  const document =  '<!DOCTYPE html>\n\r' +
  '<html><head><title>' + title + '</title></head>\n\r' +
  '<body>\n\r' +
  '<h2>Access Error: ' + status + ' -- ' + title + '</h2>\n\r' +
  '<pre>' + message + '</pre>\n\r' +
  '</body>\n\r' +
  '</html>\n\r';

  return 'HTTP/1.0 ' + status + ' ' + title + '\n\r' + 
  'Keep-Alive: timeout=5, max=197\n\r' +
  'Content-Length: ' + document.length + '\n\r' +
  'Cache-Control: no-cache\n\r' +
  'Server: Embedthis-http\n\r' +
  'Connection: Keep-Alive\n\r' +
  'Date:' + new Date() + '\n\r\n\r' +
  document;
}

const listen = (port) => {
  //Server to listen to specified port
  proxy.listen(port, () => { 
    console.log('TCP server listening to %j',proxy.address());
  });
}

module.exports = {
  listen,
};