var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //for JSON parsing for request body
var passport = require('passport');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

//set ports for server
var PORT = 3000;
var DB_PORT = 27017;

//Connect to MongoDB database
mongoose.connect('mongodb://localhost:' + DB_PORT);
app.use(passport.initialize());
app.use(passport.session());

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {
    console.log.bind(console, 'connection success');
});

var ObjectId = mongoose.Schema.ObjectId;
//Create db schema for users
var userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    description: String,
    location: String,
    local: {
        email: String,
        password: String
    },
    facebook: {
            id: String,
            token: String,
            email: String,
            name: String
    }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


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

//PASSPORT CODE
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        User.findOne({ 'local.email' :  email }, function(err, user) {
            if (err)
                return done(err);

            if (user) {
                return done(null, false, {message: 'User already exists.'});
            } else {
                var newUser = new User();
                newUser.local.email = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }
        });
    })
);
passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {

        User.findOne({ 'local.email' :  email }, function(err, user) {
            if (err)
                return done(err);

            if (!user)
                return done(null, false, {message: "Incorrect Email"});

            if (!user.validPassword(user.generateHash(password)))
                return done(null, false, {message: "Incorrect Password"});
            
            return done(null, user);
        });

    })
);

//starts the server listening on port 3000
var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
});

console.log('Server running at http://127.0.0.1:' + PORT + '/');

app.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        res.send(users);
    });
});

app.get('/cottages', function(req, res) {
    Cottage.find({}, function(err, cottages) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        res.send(cottages);
    });
});

app.get('/cottageByLocation', function(req, res) {
    Cottage.find({'location' : req.body.location}, function(err, cottages) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        res.send(cottages);
    });
});

app.get('/cottageByRating', function(req, res) {
    Cottage.find({'rating' : {$gte: req.body.rating}}, function(err, cottages) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        res.send(cottages);
    });
});

app.get('/login', function(req, res) {
    Cottage.findOne({'email' : req.body.email}, function(err, user) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        if(!user){
            res.status(400);
            res.send({
                    "ErrorCode": "USER_NOT_FOUND"
                });
        }
        if(req.body.password === user.password){
            //Session stuff here?
            res.send(user);
        }
    });
});

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', //TODO: write /profile GET handling for user profile page
    failureRedirect : '/signup', //TODO: write /signup GET handling for singup page
    failureFlash : false
}));

app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', //TODO: same as signup
        failureRedirect : '/login', //TODO: same as signup
        failureFlash : false
    }));