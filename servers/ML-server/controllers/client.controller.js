//import Resource model
const dbmodels = require("../../db/models");
const Client = dbmodels.client;
const Resource = dbmodels.resource;
const Dates = dbmodels.dates;

const createClient = (address,dates,resource) => {
  //Find Client in database
  Client.findOne({ address: address }, (err, client) => {
    if (err) {
      console.log('On Create Client: Server Error');
      catchError(err);
      return;
    }

    //If client exists then we update it
    if (client) {
      client.dates = dates;
      client.resource = resource;
    }
    //Else we create the resource
    else {
      client = new Client({
        address: address,
        dates: dates,
        resource: resource,
      });
    }

    client.save(err => {
      if (err) {
        console.log('On Create Client: Error while saving');
        catchError(err);
        return;
      }
    });
  });
};

const getClient = async (address) => {
  //find the Schedule model that has path
  return await Client.findOne({ 'address': address });
};

const getResource = async (client) => {
  //Find client's resource
  return await Resource.findById(client.resource);
};

const getDates = async (client) => {
  //Find client's dates
  return await Dates.findById(client.dates);
};

const deleteClient = (address) => {
  //find the Schedule model that has path
  Client.deleteOne({ 'address': address }, (err) => {
    if (err) return catchError(err);
  });
};

function catchError(err) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on TCP Server 'client.controller':\n", err);
  return undefined;
}

module.exports = {
  createClient,
  getClient,
  getResource,
  getDates,
  deleteClient,
}