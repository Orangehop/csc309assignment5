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
var FacebookStrategy = require('passport-facebook').Strategy;

var configAuth = {
    'facebookAuth' : {
        'clientID'      : '942260929195115',
        'clientSecret'  : '5e1a9f1178c0fbf79e3b46d24cb57e63',
        'callbackURL'   : 'http://localhost:3000/auth/facebook/callback'
    }
};

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new FacebookStrategy({
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ["emails", "displayName"]

    },
    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {
            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);
                if (user) {
                    return done(null, user);
                } else {
                    var newUser = new User();
                    newUser.facebook.id    = profile.id;
                    newUser.facebook.token = token;
                    newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                    newUser.facebook.email = profile.emails[0].value;
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    })
);

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

            if (!user.validPassword(password))
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

/*app.get('/login', function(req, res) {
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
            return res.end();
        }
        if(req.body.password === user.password){
            //Session stuff here?
            res.send(user);
        }
    });
});*/


/**
 * /signup /login redirects here
 * assuming same field information from request is propogated
 **/
app.get('/profile', function(req,res) {
    User.findOne({email: req.body.email}, function(err, user) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        else if(user == null){
            res.status(400);
            res.send({
                "ErrorCode": "USER_NOT_FOUND_ERROR"
            });
            console.error(err);
            return res.end();
        }
        res.send(user);
    });
})

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/profile',
        failureRedirect : '/'
    })
);

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', //TODO: write /profile GET handling for user profile page
    failureRedirect : '/',
    failureFlash : false
}));

app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', //TODO: same as signup
    failureRedirect : '/',
    failureFlash : false
}));



app.post('/createListing', function(req, res) {
    Cottage.findOne({name : req.body.name}, function(err, cottage){
        if(err){
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        else if(cottage != null){
            res.status(400);
            res.send({
                "ErrorCode": "COTTAGE_NAME_TAKEN"
            });
            console.error("COTTAGE_NAME_TAKEN");
            return res.end();
        }
        else{
            var newCottage = new Cottage;
            newCottage.name = req.body.name;
            newCottage.location = req.body.location;
            newCottage.rating = -1;
            newCottage.datesAvailable = req.body.datesAvailable;
            newCottage.owner = req.body.owner;
            newCottage.rentAmount = req.body.rentAmount;
        }
        newCottage.save(function (err) {
                    if (err) {
                        res.status(500);
                        res.send({
                            "ErrorCode": "INTERNAL_SERVER_ERROR"
                        });
                        console.error(err);
                        return res.end();
                    }
                    else{
                        res.status(200);
                        console.log("Listing added successfuly");
                        return res.end();
                    }
        });
    });
});
