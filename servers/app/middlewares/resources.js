//import Resource model
const dbmodels = require("../../db/models");
const Resource = dbmodels.resource;

const getResources = (req, res, next) => {
  //get the data from the request's body
  const search = req.query.search;

  Resource.find({}, (err,resources) =>{
    if(err) return catchError(err, req, res); 

    //If search is specified look for a match
    if(search){

      //divide the search string separated by ' ' except when inside of quotes into an array of keywords
      // Example: Measurements Live = [ 'Measurements', 'Live' ]
      // Example: "Measurements Live" = [ 'Measurements Live' ]
      const searcharray = search.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/gi);

      //Delete the quotes and add them regular expression 'and'
      searcharray.forEach( (value,index,array) =>{
        array[index] = "(?=.*" + value.replace(/['"]+/g,'') + ")";
      })

      //Create regular expression
      const regex = new RegExp( searcharray.join(''), "i");

      //Filter the resources which only have the keywords in them
      resources = resources.filter( (resource,index) => {
        //Look only inside of name, creator, instrument and description
        resourcestring = "".concat(resource.name,resource.creator,resource.instrument,resource.description);
        return  resourcestring.match(regex);
      });
    }

    resources.thismonth = resources.filter( (resource,index) => {
      const currentmonth = new Date();
      currentmonth.setDate(1);
      currentmonth.setHours(0,0,0,0);
      return  resource.dateCreated >= currentmonth;
    });
    
    resources.thisweek = resources.filter( (resource,index) => {
      const currentweek = new Date();
      currentweek.setDate(currentweek.getUTCDate() - currentweek.getUTCDay());
      currentweek.setHours(0,0,0,0);
      return  resource.dateCreated >= currentweek;
    });

    resources.forEach( (resource,index,resources) => {

      resources[index].bookedtimes = {};

      resources[index].bookedtimes.thismonth = resource.datesbooked.dates.reduce( (total, bookeddate, index) => {
        const currentmonth = new Date();
        currentmonth.setDate(1);
        currentmonth.setHours(0,0,0,0);
        const nextmonth = new Date();
        nextmonth.setMonth(nextmonth.getMonth()+1,1);
        nextmonth.setHours(0,0,0,0);
        if(bookeddate.date >= currentmonth && bookeddate.date < nextmonth){
          return total + bookeddate.numhours;
        }
        else{
          return total;
        }
      },0);
    
      resources[index].bookedtimes.thisweek = resource.datesbooked.dates.reduce( (total, bookeddate, index) => {
        const currentweek = new Date();
        currentweek.setDate(currentweek.getUTCDate() - currentweek.getUTCDay());
        currentweek.setHours(0,0,0,0);
        const nextweek = new Date();
        nextweek.setDate(nextweek.getUTCDate() - nextweek.getUTCDay() + 7);
        nextweek.setHours(0,0,0,0);
        if(bookeddate.date >= currentweek && bookeddate.date < nextweek){
          return total + bookeddate.numhours;
        }
        else{
          return total;
        }
      },0);

    });

    //Return found resources
    req.resources = resources;
    next();
  });
};

const getReservedDates = (req, res) => {
  Resource.findOne({name: req.body.resourceName},{datesbooked:1}, (err,resource) => {
    if(err) return catchError(err, req, res); 

    // if exists, return its booked dates
    if(resource){
      const datesbooked = resource.datesbooked;
      datesbooked.dates.forEach( bookeddate => {
          datesbooked.date = new Date(bookeddate.date);
      });

      return res.json({
          message : 'success',
          ok : true,
          datesbooked: datesbooked,
      });
    } 
    else {
      //Resource Not Found
      return res.json({ok : false, error : 'The Resource was not found'});
    }  
  });
};

function catchError(err,req,res){
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'middleware/resources.js':\n",err);
  return res.status(500).render('index', {
    page:'Server Error',
    menuId:'', 
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  getResources,
  getReservedDates,
}