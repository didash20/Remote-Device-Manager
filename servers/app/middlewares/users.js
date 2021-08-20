const dbmodels = require("../../db/models");
const User = dbmodels.user;

const getUsers = (req, res, next) => {
  //Get the roles from the current account
  if (req.account) {
    roles = req.account.roles;

    let repeat = true;

    //Get the users only if account is admin or moderator
    for (let i = 0; i < roles.length && repeat; i++) {
      if (roles[i] === "admin" || roles[i] === "moderator") {
        repeat = false;

        User.find({}, { password: 0 })
          .populate('roles')
          .populate({
            path: 'schedules',
            select: 'resource',
            populate: {
              path: 'resource',
              select: 'name',
            }
          })
          .exec((err, users) => {
            if (err) return catchError(err, req, res);

            const search = req.query.search;
            if (search) {
              const searcharray = search.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/gi);
              searcharray.forEach((value, index, array) => {
                array[index] = "(?=.*" + value.replace(/['"]+/g, '') + ")";
              })

              const regex = new RegExp(searcharray.join(''), "i");
              users = users.filter((user, index) => {
                userstring = "".concat(user.username, user.institution, user.email, user.region);
                return userstring.match(regex);
              });
            }

            users = users.filter((user) => {
              return user.roles.length === 1 && user.roles[0].name === "user";
            });

            users.forEach(user => {
              user.resources = [];
              user.schedules.forEach(schedule => {
                let resourceindex = user.resources.findIndex(resource => resource.name === schedule.resource.name);
                if (resourceindex >= 0) {
                  user.resources[resourceindex].timesbooked++;
                }
                else {
                  user.resources.push({
                    name: schedule.resource.name,
                    timesbooked: 1,
                  });
                }
              });
              user.resources.sort((rsrc1, rsrc2) => {
                return rsrc2.timesbooked - rsrc1.timesbooked;
              });
            });

            users.thismonth = users.filter((user, index) => {
              const currentmonth = new Date();
              currentmonth.setDate(1);
              currentmonth.setHours(0, 0, 0, 0);
              return user.dateCreated >= currentmonth;
            });

            users.thisweek = users.filter((user, index) => {
              const currentweek = new Date();
              currentweek.setDate(currentweek.getUTCDate() - currentweek.getUTCDay());
              currentweek.setHours(0, 0, 0, 0);
              return user.dateCreated >= currentweek;
            });

            req.users = users;
            return next();
          });
      }
    }
  }
};

const getUsersByInstitution = (req, res, next) => {
  //Get the roles from the current account
  if (req.account) {
    const roles = req.account.roles;

    let moderator = false;

    //Get the users only if account is admin or moderator
    for (let i = 0; i < roles.length && !moderator; i++) {
      if (roles[i] === "admin" || roles[i] === "moderator") {
        moderator = true;

        User.find({}, { password: 0 })
          .populate('roles')
          .populate({
            path: 'schedules',
            select: 'resource',
            populate: {
              path: 'resource',
              select: 'name creator imagepath',
            }
          })
          .exec((err, users) => {
            if (err) return catchError(err, req, res);

            const search = req.query.search;
            //If search is specified look for a match
            if (search) {

              //divide the search string separated by ' ' except when inside of quotes into an array of keywords
              // Example: Measurements Live = [ 'Measurements', 'Live' ]
              // Example: "Measurements Live" = [ 'Measurements Live' ]
              const searcharray = search.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/gi);

              //Delete the quotes and add them regular expression 'and'
              searcharray.forEach((value, index, array) => {
                array[index] = "(?=.*" + value.replace(/['"]+/g, '') + ")";
              })

              //Create regular expression
              const regex = new RegExp(searcharray.join(''), "i");

              //Filter the resources which only have the keywords in them
              users = users.filter((user, index) => {
                //Look only inside of username, institution, email and region
                userstring = "".concat(user.username, user.institution, user.email, user.region);
                return userstring.match(regex);
              });
            }

            let admin = false;
            for (let i = 0; i < roles.length && !admin; i++) {
              if (roles[i] === "admin") {
                admin = true;
              }
            }
            if (!admin) {
              users = users.filter((user) => {
                return user.roles.length === 1 && user.roles[0].name === "user";
              });
            }

            const institutions = [], usersbyinstitution = [];
            users.forEach(user => {
              user.resources = [];
              user.schedules.forEach(schedule => {
                let resourceindex = user.resources.findIndex(resource => resource.name === schedule.resource.name);
                if (resourceindex >= 0) {
                  user.resources[resourceindex].timesbooked++;
                }
                else {
                  user.resources.push({
                    name: schedule.resource.name,
                    creator: schedule.resource.creator,
                    imagepath: schedule.resource.imagepath,
                    timesbooked: 1,
                  });
                }
              });
              user.resources.sort((rsrc1, rsrc2) => {
                return rsrc2.timesbooked - rsrc1.timesbooked;
              });
              const institutionindex = institutions.indexOf(user.institution)
              if (institutionindex >= 0) {
                usersbyinstitution[institutionindex].push(user)
              } else {
                institutions.push(user.institution)
                usersbyinstitution.push([user])
              }
            });
            institutions.push('Other Institutions');
            usersbyinstitution.push([]);
            institutions.forEach((institution, institutionindex, institutions) => {
              if (usersbyinstitution[institutionindex].length === 1 && institution !== 'Other Institutions') {
                usersbyinstitution[institutions.length - 1].push(usersbyinstitution[institutionindex][0])
                usersbyinstitution.splice(institutionindex, 1);
                institutions.splice(institutionindex, 1);
              } else if (institution === 'Other Institutions' && usersbyinstitution[institutionindex].length === 0) {
                usersbyinstitution.splice(institutionindex, 1);
                institutions.splice(institutionindex, 1);
              }
            });

            req.users = {
              institutions: institutions,
              usersbyinstitution: usersbyinstitution,
            };
            return next();
          });
      }
    }
  }
};

function catchError(err, req, res) {
  ///catch any error, and return server error
  console.log("\n\nServer Error Occured on 'middlewares/users.js':\n", err);
  return res.status(500).render('index', {
    page: 'Server Error',
    menuId: '',
    account: req.account,
    contentpath: 'public/server error',
  });
}

module.exports = {
  getUsers,
  getUsersByInstitution,
};