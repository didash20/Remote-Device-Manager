//import Modules and Models
const fs = require('fs');
const dbmodels = require("../../db/models");
const Resource = dbmodels.resource;
const Schedule = dbmodels.schedule;
const Dates = dbmodels.dates;
const User = dbmodels.user;
const Role = dbmodels.role;

const createResource = (req, res) => {
  //get the data from the request's body
  const resourceName = req.body.name.trim(),
    resourceCreator = req.body.creator.trim(),
    resourceHost = req.body.host,
    resourcePort = req.body.port,
    resourceInstrument = req.body.instrument.toUpperCase().trim(),
    image = req.file,
    description = req.body.description,
    source = req.body.source;

  //Find Resource in database
  Resource.findOne({ name: resourceName }, (err, resource) => {
    if (err) {
      console.log('On Create Resource: Server Error');
      console.log(resource);

      //Delete saved resource image
      fs.unlink('/Images/Resources/' + image.filename);

      //Send error
      catchError(err, req, res);
      return;
    }

    //If resource exists then we update it
    if (resource) {
      if (resourceCreator)
        resource.creator = resourceCreator;
      if (resourceHost)
        resource.host = resourceHost;
      if (resourcePort)
        resource.port = resourcePort;
      if (resourceInstrument)
        resource.instrument = resourceInstrument;
      if (description)
        resource.description = description;
      if (source)
        resource.source = source;
      if (image)
        resource.imagepath = '/Images/Resources/' + image.filename;
    }
    //Else we create the resource
    else {
      resource = new Resource({
        name: resourceName,
        creator: resourceCreator,
        host: resourceHost,
        port: resourcePort,
        instrument: resourceInstrument,
        description: description,
        source: source,
        imagepath: image?'/Images/Resources/' + image.filename:undefined,
        datesbooked: {
          dates: [],
          numdates: 0,
          timesbooked: 0,
        }
      });
    }

    resource.save(err => {
      if (err) {
        console.log('On Create Resource: Error while saving Resource \"' + resourceName + '\".');
        console.log(resource);

        //Delete saved resource image
        fs.unlink('/Images/Resources/' + image.filename);
        catchError(err, req, res);
        return;
      }

      console.log('On Create Resource: Resource \"' + resourceName + '\" created successfully.');
      //return to Resources page
      return res.redirect('/resources');
    });
  });
};

const createSchedule = async (req, res) => {
  //Find schedule's resource
  Resource.findOne({ name: req.body.resourceName },
    { datesbooked: 1 },
    async (err, resource) => {
      if (err) return catchError(err, req, res);

      if (resource) {
        //Add date to the resource
        resource.datesbooked = addDateTime(resource.datesbooked, new Date(req.body.dates.dateAvailable));

        if (resource.datesbooked === undefined) {
          //Return Date already exists
          return res.json({ message: 'unavailable' });
        }
        else {
          //Update the resource and save in database
          resource.save( (err) => {
            if (err) return catchError(err, req, res);
          });

          /* Now create new schedule */

          //get the data from the request's body
          const account = req.body.account._id,
                baseUrl = req.body.baseUrl;
          let exists, temporalPath;

          const dates = new Dates({
            dateAvailable: req.body.dates.dateAvailable,
            dateExpiring: req.body.dates.dateExpiring,
            dateCreated: new Date(),
          });

          dates.save( (err) => {
            if (err) return catchError(err, req, res);
          });

          //generate temporal path
          do {
            //5 character random string
            temporalPath = '/' + (Math.random().toString(36) + '00000000000000000').slice(2, 7);
            exists = await Schedule.findOne({ 'url.pathname': temporalPath });
          } while (exists);

          //create missing parameters
          const temporalURL = baseUrl + temporalPath;

          const schedule = new Schedule({
            resource: resource,
            url: {
              pathname: temporalPath,
              completeURL: temporalURL,
            },
            dates: dates,
          });
          //save
          schedule.save(err => {
            if (err) return catchError(err, req, res);
          });

          /* Add Schedule to account */

          User.findById(account, (err,account) => {
            if (err) return catchError(err, req, res);

            account.schedules.push(schedule._id);
            account.numschedules = account.schedules.length;

            account.save(err => {
              if (err) return catchError(err, req, res);
            });
          });

          //return success message
          return res.json({
            ok: 'true',
            message: 'saved',
          });
        }
      }
      else {
        //Resource Not Found
        return res.json({ ok: false, message: 'not found' });
      }
    });
};

function addDateTime(booked_dates, datetime) {

  //Get the UTC date and time
  const date = new Date(datetime);
  const time = datetime.getUTCHours();

  //Normalize the date (delete hour, minutes, seconds and milliseconds)
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  //Look for the date in the database
  const samebookeddate = booked_dates.dates.find(bookeddate => bookeddate.date.getTime() === date.getTime());

  if (samebookeddate === undefined) {
    //Save date and time
    booked_dates.dates.push({
      date: date,
      hours: [time],
      numhours: 1,
    });
  }
  else {

    //Look for the hour inside the specified date
    const samehour = samebookeddate.hours.find(hour => hour === time);
    if (samehour === undefined) {
      //Save time
      samebookeddate.hours.push(time)
    }
    else {
      //Date already exists
      return undefined;
    }

    //Update hour num length
    samebookeddate.numhours = samebookeddate.hours.length;
  }

  //Sort dates
  booked_dates.dates.sort(function (date1, date2) {
    return date1.date.getTime() - date2.date.getTime();
  });

  //Update numdates length
  booked_dates.numdates = booked_dates.dates.length;
  booked_dates.timesbooked++;

  //return new booked dates with added datetime
  return booked_dates;
}

const createUser = (req, res) => {
  const uname = req.body.username,
        email = req.body.email,
        region = req.body.region,
        institution = req.body.institution,
        psw = req.body.password;

  const user = new User({
    username: uname,
    email: email,
    region: region,
    institution: institution,
    password: require("bcryptjs").hashSync(psw, 8)
  });

  user.save((err, user) => {
    if (err) return catchError(err,req,res);

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) return catchError(err,req,res);

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) return catchError(err,req,res);

            res.send({ message: "Created Successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) return catchError(err,req,res);

        user.roles = [role._id];
        user.save(err => {
          if (err) return catchError(err,req,res);

          return res.send({ message: "Created Successfully!" });
        });
      });
    }
  });
};

function catchError(err, req, res) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'create.controller':\n", err);
  return res.status(500).render('index', {
    page: 'Server Error',
    menuId: '',
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  createResource,
  createSchedule,
  createUser
}