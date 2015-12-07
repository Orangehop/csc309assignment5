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
//bind session middleware
var sess = session({
    secret: 'csc309assignment',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: true
    }
});
var cookieSession = require('cookie-session');
app.use(cookieSession({   keys: ['key1', 'key2'] }));
//Serve static files
app.use('/', express.static(__dirname + '/static'));
//Bind middleware for parsing response
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(sess);
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

//Create db schema for comments
var commentSchema = mongoose.Schema({
    commentor: userSchema,
    comment: String
});


//Create db schema for cottages
var cottageSchema = mongoose.Schema({
    name: String,
    location: String,
    address: String,
    rating: Number,
    datesAvailable: String,
    owner: userSchema,
    description: String,
    rentAmount: Number,
    comments: [commentSchema],
    lat: Number,
    lng: Number
});



var User = mongoose.model('User', userSchema);
var Cottage = mongoose.model('Cottage', userSchema);
var Comment = mongoose.model('Comment', commentSchema)

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
        profileFields: ["emails", "displayName", "name"],
        passReqToCallback: true

    },
    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {
            // find the user in the database based on their facebook id
            if (!req.user) {
                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.email = profile.emails[0].value;
                        newUser.facebook.name = profile.name.givenName + " " + profile.name.familyName;
                        newUser.firstName = profile.name.givenName;
                        newUser.lastName = profile.name.familyName;
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            }
            else {
                if (!user.facebook) {
                    var user = req.user;
                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = profile.emails[0].value;
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            }
        });
    })
);

passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        if (!req.user) {
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
        }
        else {
            var user = req.user;
            if (!user.local) {
                user.local.email = email;
                user.local.password = user.generateHash(password);
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        }
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
exports.listen = function(port) {
    console.log('Listening on: ' + port);
    server.listen(port);
};
exports.close = function() {
    server.close();
};
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
    if(!req.user) {
        res.redirect('/');
    }
    else {
        res.send(req.user);
    }
})

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/success',
        failureRedirect : '/failure'
    })
);

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/success',
    failureRedirect : '/failure',
    failureFlash : false
}));

app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/success',
    failureRedirect : '/failure',
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
            User.findById(req.body.owner, function(err,user) {
                if(err) {
                    res.status(500);
                    res.send({
                        "ErrorCode": "INTERNAL_SERVER_ERROR"
                    });
                    console.error(err);
                    return res.end();
                }
                if (user==null) {
                    res.status(404);
                    res.send({
                        "ErrorCode": "USER_NOT_FOUND"
                    });
                    console.error("USER_NOT_FOUND");
                    return res.end();
                }
                newCottage.name = req.body.name;
                newCottage.location = req.body.location;
                newCottage.rating = -1;
                newCottage.datesAvailable = req.body.datesAvailable;
                newCottage.owner = user;
                newCottage.rentAmount = req.body.rentAmount;
                newCottage.lat = req.body.lat;
                newCottage.lng = req.body.lng;
                newCottage.description = req.body.description;
            });
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


app.post('/comment', function(req, res) {
    Cottage.findOne({name : req.body.name}, function(err, cottage){
        if(err){
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        else if(cottage == null){
            res.status(404);
            res.send({
                "ErrorCode": "COTTAGE_NOT_FOUND"
            });
            console.error("COTTAGE_NOT_FOUND");
            return res.end();
        }
        else{
            var comment = new Comment();
            comment.commentor = req.user;
            comment.comment = req.body.comment;
            cottage.comments.push(comment);
        }
    });
});

app.post('/getListing', function(req, res) {
    Cottage.findOne({name : req.body.name}, function(err, cottage){
        if(err){
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        else if(cottage == null){
            res.status(404);
            res.send({
                "ErrorCode": "COTTAGE_NOT_FOUND"
            });
            console.error("COTTAGE_NOT_FOUND");
            return res.end();
        }
        else{
            res.send({
                username : cottage.owner.firstName+" "+cottage.owner.lastName,
                address: cottage.address,
                location: cottage.location,
                pricing: cottage.rentAmount,
                description: cottage.description,
                available: cottage.datesAvailable,
                comments: cottge.comments
            });
        }
    });
});

app.get("/success", function(req,res) {
    res.status(200);
    return res.end();
});

app.get("/failure", function(req,res) {
    res.status(400);
    return res.end();
});