//import Resource model
const dbmodels = require("../../db/models");
const Schedule = dbmodels.schedule;
const Resource = dbmodels.resource;
const Dates = dbmodels.dates;

const getSchedule = async (path) => {
  //find the Schedule model that has path
  return await Schedule.findOne({ 'url.pathname': path });
};

const getResource = async (schedule) => {
  //Find client's resource
  return await Resource.findById(schedule.resource);
};

const getDates = async (schedule) => {
  //Find client's dates
  return await Dates.findById(schedule.dates);
};

module.exports = {
  getSchedule,
  getResource,
  getDates,
}