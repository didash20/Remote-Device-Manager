const mongoose = require('mongoose');

const ResourceModel = mongoose.model(
    'Resource',
    new mongoose.Schema({
        name: String,
        creator: String,
        host: String,
        port: String,
        instrument: String,
        description: String,
        source: String,
        imagepath: String,
        datesbooked: {
            dates: [{
                date: Date,
                hours: [Number],
                numhours: Number
            }],
            numdates: Number,
            timesbooked: Number,
        },
        dateCreated : {
            type : Date,
            default : Date.now
        },
    })
);

module.exports = ResourceModel;