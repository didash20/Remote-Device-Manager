//import Resource model
const dbmodels = require("../../db/models");
const Resource = dbmodels.resource;
const Schedule = dbmodels.schedule;
const Dates = dbmodels.dates;
const User = dbmodels.user;

const clearResource = (req, res) => {
  const resourceName = req.body.resourceName;
  console.log(resourceName);
  Resource.findOneAndDelete({ name: resourceName }, (err,resource) =>{
    if(err) return catchError(err, req, res); 

    //If resource is found we clear all the dates logged to it
    if(resource){
  
      console.log('On Clear Resource: Cleared Resource \"' + resourceName + '\" successfully.');
      //Now clear all Schedules with same resource
      req.resource = resource._id;
      clearSchedules(req,res);
    } 
    else{
      //The resource was not found in the collection
      console.log('On Clear All Reservations: Resource \"' + resourceName + '\" does not exist.');
      return res.status(404).json({
          ok : false, 
          error : "Resource \'" + resourceName + "\' does not exist",
      });
    }
  });
}

const clearReservation = (req, res) => {
  const resourceName = req.body.resourceName;
  Resource.findOne({ name: resourceName },{datesbooked:1}, (err,resource) =>{
    if(err) return catchError(err, req, res); 

    if(resource){
      //Add date to the resource
      resource.datesbooked = removeDateTime(resource.datesbooked,new Date(req.body.date));

      //Update the resource and save in database
      resource.save( err => {
        if(err){
          //Return not saved error
          console.log('Error while reservation was removed from \"' + resourceName + '\".');
          return catchError(err,req,res)
        }
        clearSchedules(req,res);
      });
    }
    else {
      //Resource Not Found
      return res.json({ok : false, error : 'The Resource was not found'});
    }  
  });
};

const clearAllReservations = (req, res) => {
  const resourceName = req.body.resourceName;
  Resource.findOne({ name: resourceName },{datesbooked:1}, (err,resource) =>{
    if(err) return catchError(err, req, res); 

    //If resource is found we clear all the dates logged to it
    if(resource){
      resource.datesbooked = {
        dates: [],
        numdates: 0,
        timesbooked: 0,
      }
  
      //save Resource
      resource.save( err => {
        if(err){
          //There was an error while saving the resource
          console.log('On Clear All Reservations: Error while saving Resource  \"' + resourceName + '\". Try Again.');
          catchError(err, req, res);
          return;
        }

        console.log('On Clear All Reservations: Cleared Resource \"' + resourceName + '\" reservations successfully.');
        //Now clear all Schedules with same resource
        req.resource = resource._id;
        clearSchedules(req,res);

      });
    } 
    else{
      //The resource was not found in the collection
      console.log('On Clear All Reservations: Resource \"' + resourceName + '\" does not exist.');
      return res.status(404).json({
          ok : false, 
          error : "Resource \'" + resourceName + "\' does not exist",
      });
    }
  });
}

const clearAllResources = (req, res) => {
  Resource.deleteMany({}, err =>{
    if(err) return catchError(err, req, res);
    console.log('On Clear All: Deleted all resources successfully.');
    clearSchedules(req,res);
  });
}

const clearSchedules = (req, res) => {

  const resource = req.resource,
        resourceName = req.body.resourceName,
        schedule_id = req.body.schedule_id;

  //If schedule_id is sent then only delete this schedule
  if(schedule_id){
    Schedule.findByIdAndDelete(schedule_id, (err,schedule) => {
      if(err){
        console.log('Error while deleting');
        return catchError(err,req,res);
      } 

      Dates.deleteOne({_id:schedule.dates}, (err,dates) => {
        if(err){
          console.log('Error while deleting');
          return catchError(err,req,res);
        } 
        const currentdate = new Date();
        if (currentdate < dates.dateExpiring) {
          return res.redirect('/reservations');
        }
        else{
          return res.redirect('/history');
        }
      });
    });
  }

  //Check if a resource is sent then delete all its schedules
  else if(resource){
    Schedule.find({ 'resource': resource }, (err,schedules) => {
      if(err){
        console.log('Error while deleting');
        return catchError(err,req,res);
      }

      if(schedules.length === 0){
        return res.redirect('/resources');
      }
      else{
        schedules.forEach( schedule => {
          Schedule.findByIdAndDelete(schedule._id, (err,schedule) => {
            if(err){
              console.log('Error while deleting');
              return catchError(err,req,res);
            } 
    
            Dates.deleteOne({_id:schedule.dates}, (err) => {
              if(err){
                console.log('Error while deleting');
                return catchError(err,req,res);
              } 
              
            });
          });
        });
        console.log('On Clear All Reservations: Cleared Schedules from \"' + resourceName + '\" successfully.');
        return res.redirect('/resources');
      }
    });
  }

  //If resource is not sent then delete all resources
  else{
    Schedule.deleteMany({}, err => {
      if(err){
        console.log('Error while deleting')
        return catchError(err,req,res);
      }
      Dates.deleteMany({}, err => {
        if(err){
          console.log('Error while deleting')
          return catchError(err,req,res);
        }

        console.log('On Clear All: Deleted all schedules successfully.');
        return res.redirect('/reservations');
      });
    });
  }
}

const clearUser = (req, res) => {
  const user = req.body.user;
  console.log(user);
  User.findOneAndDelete({ _id: user }, (err,user) =>{
    if(err) return catchError(err, req, res); 

    //If resource is found we clear all the dates logged to it
    if(user){
  
      console.log('On Clear User: Cleared User \"' + user.username + '\" successfully.');
      //Now clear all Schedules with same resource
      Schedule.deleteMany({ _id: { $in: user.schedules}}, (err) => {
        if(err){
          console.log('Error while deleting Schedules from \"' + user.username + '\"')
          return catchError(err,req,res);
        }
        console.log('On Clear User: Cleared User\'s Schedules successfully.');
      });
      return res.redirect('/admin/users');
    } 
    else{
      //The resource was not found in the collection
      console.log('On Clear User: User \"' + user.username + '\" does not exist.');
      return res.status(404).json({
          ok : false, 
          error : "User \'" + user.username + "\' does not exist",
      });
    }
  });
}

const cleanExpiredPaths = (req, res) => {
  //Obtain current datetime
  const currentdate = new Date();
  currentdate.setUTCMinutes(0);
  currentdate.setUTCSeconds(0);
  currentdate.setUTCMilliseconds(0);

  //Get dateExpiring database
  Schedule.find({
      'dates.dateExpiring': { $lte : currentdate }
    })
    .exec((err, schedules) => {
      if (err) return catchError(err, req, res);

      schedules.forEach( schedule => {
        //Delete the URL from every expired schedule
        schedule.url = {
          pathname: "",
          completeURL: "",
        }
        schedule.save( err => {
          if(err){
            console.log('Error while saving');
            return catchError(err,req,res);
          } 
        });
      });

      return res.json({
        message: 'success',
        ok: true,
      });
    });
};

function removeDateTime(booked_dates,datetime){    

  //Get the UTC date and time
  const date = new Date(datetime);
  const time = datetime.getUTCHours();

  //Normalize the date (delete hour, minutes, seconds and milliseconds)
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  //Look for the date in the database
  const samebookeddate = booked_dates.dates.find( bookeddate => bookeddate.date.getTime() === date.getTime());

  if(samebookeddate !== undefined){
    //Look for the hour inside the specified date
    const timeindex  = samebookeddate.hours.indexOf(time);
    if(timeindex >= 0){
      //Delete time
      samebookeddate.hours.splice(timeindex,1)
    }
    
    //Update hour num length
    samebookeddate.numhours = samebookeddate.hours.length;

    //If the booked date doesn´t have hours anymore delete date
    if(samebookeddate.numhours === 0){
      const bookeddateindex = booked_dates.dates.indexOf(samebookeddate);
      if(bookeddateindex >= 0){
        //Delete booked date
        booked_dates.dates.splice(bookeddateindex,1)
      }

      //Update dates num length
      booked_dates.numdates = booked_dates.dates.length;
    }
  }

  //return new booked dates with removed datetime
  return booked_dates;
}

function catchError(err,req,res){
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'clear.controller':\n",err);
  return res.status(500).render('index', {
    page:'Server Error',
    menuId:'', 
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  clearReservation,
  clearAllReservations,
  clearAllResources,
  clearSchedules,
  cleanExpiredPaths,
  clearResource,
  clearUser,
}