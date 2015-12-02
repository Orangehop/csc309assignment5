var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //for JSON parsing for request body
var session = require('express-session');

//set ports for server
var PORT = 3000;
var DB_PORT = 27017;

//Connect to MongoDB database
mongoose.connect('mongodb://localhost:' + DB_PORT);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log.bind(console, 'connection success');
});

//Create db schema for users
var userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    password: String,
    email: String,
    description: String,
    location: String
});

//Create db schema for cottages
var cottageSchema = mongoose.Schema({
    name: String,
    location: String,
    rating: Number,
    datesAvailable: String,
    owner: ObjectId,
    rentAmount: Number
});

//Create db schema for comments
var commentSchema = mongoose.Schema({
    cottage: ObjectId,
    commentor: ObjectId,
    comment: String
});


var User = mongoose.model('User', userSchema);
var Cottage = mongoose.model('Cottage', userSchema);
var Comment = mongoose.model('Comment', commentSchema)

//Serve static files
app.use('/', express.static(__dirname + '/static'));

//bind session middleware
var sess = session({
    secret: 'csc309assignment',
    cookie: {
        secure: true
    }
})

//Bind middleware for parsing response
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.txt': 'text/plain',
}

//starts the server listening on port 3000
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
});

console.log('Server running at http://127.0.0.1:' + PORT + '/');