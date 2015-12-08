var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser'); //for JSON parsing for request body
var passport = require('passport');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var compress = require('compression');
app.use(compress());


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
    name: String,
    description: String,
    location: String,
    phone: String,
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
    ratingcount: Number,
    raters: [ObjectId],
    datesAvailable: String,
    owner: ObjectId,
    description: String,
    rentAmount: String,
    comments: [commentSchema],
    lat: Number,
    lng: Number
});



var User = mongoose.model('User', userSchema);
var Cottage = mongoose.model('Cottage', cottageSchema);
var Comment = mongoose.model('Comment', commentSchema);

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
                        newUser.name = newUser.facebook.name;
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            }
            else {
                if (req.user.facebook == "{}") {
                    var user = req.user;
                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.name = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = profile.emails[0].value;
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
                else {
                    return done(null, req.user);
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
            if (user.local == "{}") {
                user.local.email = email;
                user.local.password = user.generateHash(password);
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
            else {
                return done(null, req.user);
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
            console.log("logged in");
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

app.get("/", function(req,res) {
    console.log("did it do it?");
    if(req.user) {
        res.redirect("/");
    }
    else {
        res.sendFile("/static/index.html");
        return res.end();
    }
    
});

app.post('/cottages', function(req, res) {
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

app.post('/cottageByLocation', function(req, res) {
    console.log(Number(req.body.lat)-1, req.body.lat-(-1),req.body.lng-2,Number(req.body.lng)+2);
    Cottage.find({$and : [{'lat': {$gt : Number(req.body.lat)-1, $lt: Number(req.body.lat)+1}}, {'lng': {$gt : Number(req.body.lng)-2, $lt: Number(req.body.lng)+2}}]}, function(err, cottages) {
          if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        if (!cottages) {
            res.status(404);
            res.send({
                "ErrorCode": "NO COTTAGES IN RANGE"
            })
            res.send(null);
        }
        cottages.sort(comparator(req.body.lat,req.body.lng))
        res.send(cottages);           
    });
});

app.post('/cottageByRating', function(req, res) {
    Cottage.find({'rating' : {$gte: req.body.rating}}, function(err, cottages) {
        if (err) {
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        cottages.sort(compareRating);
        res.send(cottages);
    });
});

function comparator(lat, lng) {
    return function(a,b) {
        return Math.sqrt(Math.pow(b.lat-lat)+Math.pow(b.lng-lng))-Math.sqrt(Math.pow(a.lat-lat)+Math.pow(a.lng-lng));
    }
}

function compareRating(a,b) {
    return b.rating-a.rating;
}

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

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
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
            if (!req.user) {
                res.status(400);
                res.send({
                    "ErrorCode": "NOT_LOGGED_IN"
                });
                console.error("NOT_LOGGED_IN");
                return res.end();
            }
            else {
                console.log(req.body.name, req.body.location, req.body.datesAvailable, req.user, req.body.rentAmount, req.body.lat, req.body.lng, req.body.description);
                var newCottage = new Cottage();
                newCottage.name = req.body.name;
                newCottage.location = req.body.location;
                newCottage.rating = -1;
                newCottage.ratingcount = 0;
                newCottage.raters = [];
                newCottage.datesAvailable = req.body.datesAvailable;
                newCottage.address = req.body.address;
                newCottage.owner = req.user._id;
                newCottage.rentAmount = req.body.rentAmount;
                newCottage.lat = req.body.lat;
                newCottage.lng = req.body.lng;
                newCottage.description = req.body.description;
            }
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
            comment.save();
            cottage.comments.push(comment);
            cottage.save();
        }
    });
});

app.post('/getListing', function(req, res) {
    Cottage.findOne({name : req.body.listingName}, function(err, cottage){
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
            User.findById(cottage.owner, function(err,user) {
                if(err) {
                    res.status(500);
                    res.send({
                        "ErrorCode": "INTERNAL_SERVER_ERROR"
                    });
                    console.error(err);
                    return res.end();
                }
                if (!user) {
                    res.status(404);
                    res.send({
                        "ErrorCode": "COTTAGE_OWNER_DOES_NOT_EXIST"
                    });
                    console.error("COTTAGE_OWNER_DOES_NOT_EXIST");
                    return res.end();
                }
                var email;
                if (user.local) {
                    email = user.local.email;
                }
                else {
                    email = user.facebook.email;
                }
                res.send({
                    username : user.name,
                    name: cottage.name,
                    address: cottage.address,
                    location: cottage.location,
                    pricing: cottage.rentAmount,
                    description: cottage.description,
                    available: cottage.datesAvailable,
                    comments: cottage.comments,
                    email: email,
                    rating: cottage.rating
                });
            });
        }
    });
});

app.post('/getUserByEmail', function(req, res) {
    if (req.body.email) {
        User.findOne({$or:[ { 'local.email' :  req.body.email }, { 'facebook.email' :  req.body.email } ]}, function(err, user) {
            if (err){
                res.status(500);
                res.send({
                    "ErrorCode": "INTERNAL_ERROR"
                });
                console.error("INTERNAL_ERROR");
                return done(err);
            }

            if (!user) {
                res.status(404);
                res.send({
                    "ErrorCode": "USER_NOT_FOUND"
                });
                console.error("USER_NOT_FOUND");
                return res.end();
            } else {
                res.status(200);
                res.send(user);
            }
        });
    }
    else {
        res.send(req.user);
    }
});

app.post('/editProfile', function(req, res) {
    if (!req.user) {
        res.status(400);
        res.send({
            "ErrorCode": "NOT_LOGGED_IN"
        });
        console.error("NOT_LOGGED_IN");
    }
    else {
        req.user.name = req.body.fullname;
        req.user.description = req.body.description;
        req.user.location = req.body.location;
        req.user.phone = req.body.phone;
        req.user.save();
        res.status(200);
        return res.end();
    }
});

app.post('/editListing', function(req, res) {
    Cottage.findOne({name : req.body.name}, function(err, cottage){
        if(err){
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_SERVER_ERROR"
            });
            console.error(err);
            return res.end();
        }
        else if(!cottage){
            res.status(404);
            res.send({
                "ErrorCode": "COTTAGE_NOT_FOUND"
            });
            console.error("COTTAGE_NOT_FOUND");
        }
        else{
            if (!req.user) {
                res.status(400);
                res.send({
                    "ErrorCode": "NOT_LOGGED_IN"
                });
                console.error("NOT_LOGGED_IN");
                return res.end();
            }
            else {
                cottage.name = req.body.name;
                cottage.location = req.body.location;
                cottage.datesAvailable = req.body.datesAvailable;
                cottage.rentAmount = req.body.rentAmount;
                cottage.lat = req.body.lat;
                cottage.lng = req.body.lng;
                cottage.description = req.body.description;
                cottage.save(function (err) {
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
                        console.log("Listing added edited");
                        return res.end();
                    }
                });
            }
        }
    });
});

app.post("/cottageByUser", function(req,res) {
    User.findOne({$or:[ { 'local.email' :  req.body.email }, { 'facebook.email' :  req.body.email } ]}, function(err, user) {
        if (err){
            res.status(500);
            res.send({
                "ErrorCode": "INTERNAL_ERROR"
            });
            console.error("INTERNAL_ERROR");
            return done(err);
        }

        if (!user) {
            res.status(404);
            res.send({
                "ErrorCode": "USER_NOT_FOUND"
            });
            console.error("USER_NOT_FOUND");
            return res.end();
        } else {
            Cottage.find({"owner": user._id}, function(err, cottages) {
                if (err) {
                    res.status(500);
                    res.send({
                        "ErrorCode": "INTERNAL_SERVER_ERROR"
                    });
                    console.error(err);
                    return res.end();
                }
                if (!cottages) {
                    res.status(404);
                    res.send({
                        "ErrorCode": "NO COTTAGES IN RANGE"
                    })
                    res.send(null);
                }
                cottages.sort(compareRating);
                res.send(cottages);           
            });
        }
    });
})

app.post("/rate", function(req,res) {
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
        }
        else{
            if (!req.user) {
                res.status(400);
                res.send({
                    "ErrorCode": "NOT_LOGGED_IN"
                });
                console.error("NOT_LOGGED_IN");
                return res.end();
            }
            else {
                if(cottage.raters.indexOf(req.user._id) == -1) {
                    cottage.ratingcount++;
                    cottage.rating = cottage.rating*((cottage.ratingcount-1)/(cottage.ratingcount)) + parseInt(req.body.rating)/cottage.ratingcount;
                    cottage.raters.push(req.user._id);
                    cottage.save(function (err) {
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
                            return res.end();
                        }
                    });
                }
            }
        }
    });
});

app.get("/success", function(req,res) {
    res.status(200);
    res.redirect("/application");
    res.send();
});

app.get("/application", function(req,res) {
    if(req.user){
        res.redirect("/application.html");
        return res.end();
    }
    else res.redirect("/");
});

app.get("/failure", function(req,res) {
    res.status(401);
    res.send();
});
