const mongoose = require('mongoose');

const Schedule = mongoose.model(
    'Schedule', 
    new mongoose.Schema({
        resource : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Resource',
        },
        dates: {
          type : mongoose.Schema.Types.ObjectId,
          ref : 'Dates',
        },
        url : {
            pathname : String,
            completeURL : String,
        },
    })
);

module.exports = Schedule;