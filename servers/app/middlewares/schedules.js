//import Resource model
const dbmodels = require("../../db/models");
const Schedule = dbmodels.schedule;
const Dates = dbmodels.dates;
const User = dbmodels.user;

const checkSchedule = (req, res, next) => {
  //get the unique name from the req params (e.g olamide from shorten.me/olamide)
  const temporalPath = '/' + req.params.temporalPath;

  //find the Schedule model that has that temporalPath
  Schedule.findOne({ 'url.pathname': temporalPath })
    .exec((err, schedule) => {
      if (err) return catchError(err, req, res);

      /* if such Schedule exists, check for Availability */
      if (schedule && schedule.url.pathname !== "") {
        const currentdate = new Date();

        Dates.findById(schedule.dates, (err, dates) => {
          if (err) return catchError(err, req, res);

          if (currentdate < dates.dateAvailable) {
            //not available
            return res.render('index', {
              page: 'Not Available Yet',
              menuId: '', 
              contentpath: 'resource views/not available yet',
              account: req.account,
              dates: JSON.stringify(dates),
            });
          }
          else if (currentdate > dates.dateExpiring) {
            //Expired Link
            req.message = 'Expired Link';
            return res.render('index', {
              page: 'Expired Link',
              menuId: '', 
              contentpath: 'resource views/expired link',
              account: req.account,
            });
          }
          else {
            //Resource is available
            req.resource = schedule.resource;
            req.dates = dates;
            next();
          }
        });

      } else {
        //Not Found
        return res.render('index', {
          page: 'Not Found',
          menuId: '',
          account: req.account,
          contentpath: 'public/not found',
        });
      }
    });
};

const getAllSchedules = (req, res, next) => {
  Schedule.find( {} )
    .populate('dates')
    .populate('resource','name creator imagepath instrument')
    .exec( (err,schedules) => {
      if (err) return catchError(err, req, res);
    
      schedules.sort((schedule1, schedule2) => {
        return schedule1.dates.dateAvailable.getTime() - schedule2.dates.dateAvailable.getTime();
      });      

      schedules.thismonth = schedules.filter( (schedule,index) => {
        const currentmonth = new Date();
        currentmonth.setDate(1);
        currentmonth.setHours(0,0,0,0);
        return  schedule.dates.dateCreated >= currentmonth;
      });
      
      schedules.thisweek = schedules.filter( (schedule,index) => {
        const currentweek = new Date();
        currentweek.setDate(currentweek.getUTCDate() - currentweek.getUTCDay());
        currentweek.setHours(0,0,0,0);
        return  schedule.dates.dateCreated >= currentweek;
      });

      req.schedules = schedules;
      next();
      return;
    });
};

const getCurrentSchedules = (req, res, next) => {
  //get the data from the request's body
  const account = req.account._id;

  //Obtain current datetime
  const currentdate = new Date();
  currentdate.setUTCMinutes(0);
  currentdate.setUTCSeconds(0);
  currentdate.setUTCMilliseconds(0);

  //Find current account's no occured schedules
  User.findById(account, (err, account) => {
      if (err) return catchError(err, req, res);

      Schedule.find({ _id : { $in : account.schedules } })
        .populate({
          path: 'dates',
          match: {
            dateAvailable: { $gte : currentdate },
          }
        })
        .populate('resource')
        .exec( (err, schedules) => {
          if (err) return catchError(err, req, res);
    
          schedules = schedules.filter( (schedule) => {
            return schedule.dates;
          });
    
          schedules.sort((schedule1, schedule2) => {
            return schedule1.dates.dateAvailable.getTime() - schedule2.dates.dateAvailable.getTime();
          });
    
          req.schedules = schedules;
          next();
          return;
        });
    });
};

const getPastSchedules = (req, res, next) => {
  //get the data from the request's body
  const account = req.account._id;

  //Obtain current datetime
  const currentdate = new Date();
  currentdate.setUTCMinutes(0);
  currentdate.setUTCSeconds(0);
  currentdate.setUTCMilliseconds(0);

  //Find current account's occured schedules
  User.findById(account, (err, account) => {
    if (err) return catchError(err, req, res);

    Schedule.find({ _id : { $in : account.schedules } })
      .populate({
        path: 'dates',
        match: {
          dateExpiring: { $lte : currentdate },
        }
      })
      .populate('resource')
      .exec( (err, schedules) => {
        if (err) return catchError(err, req, res);
  
        schedules = schedules.filter( (schedule) => {
          return schedule.dates;
        });
  
        schedules.sort((schedule1, schedule2) => {
          return schedule1.dates.dateAvailable.getTime() - schedule2.dates.dateAvailable.getTime();
        });
  
        req.schedules = schedules;
        next();
        return;
      });
  });
};

function catchError(err, req, res) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'middlewares/schedules.js':\n", err);
  return res.status(500).render('index', {
    page: 'Server Error',
    menuId: '',
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  checkSchedule,
  getAllSchedules,
  getCurrentSchedules,
  getPastSchedules,
}