var createError = require('http-errors');
var database = require('./database');
var express = require('express');
var flash = require('connect-flash');
var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var User = require('./models/user');

var app = express();

// view engine setup
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'secrettext'}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------
// Prepare database
// --------------------------------------------------

process.on('exit', database.close);
try {
    if (!fs.existsSync('./database.db')) {
        // Create database
        database.initialize();
        console.log("Database created.");

        // Create admin account
        let admin = User.createNew("admin", "admin", true, "public/images/users/default.png");
        admin.save();
        console.log("Admin account created. Login with username: admin, password: admin.")

    } else {
        console.log("Database already exists.");
    }

} catch (err) {
    console.error("Error initializing database: " + err.message);
    fs.unlinkSync('./database.db');
    process.exit(1);
}

// --------------------------------------------------
// Initialize passport for authentication
// --------------------------------------------------

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        // Find a user with matching username
        let user = User.findByUsername(username);
        if (user === null) {
            done(null, false, {
                message: `Unknown username: '${username}'.`
            });
            return;
        }

        // Check if password is correct
        if (user.verifyPassword(password) === false) {
            done(null, false, {
                message: `Incorrect password.`
            });
            return;
        }

        // If correct pass user object along
        done(null, user);
    }
));

// passport.use(new RememberMeStrategy(
//     // Consume the token
//     function (token, done) {
//         // Get user id from tokens
//         var uid = tokens[token];
//         delete tokens[token];

//         // Return unsuccessful if no uid associated with token
//         if (!uid) {
//             return done(null, false);
//         }

//         // Return user for id
//         return done(null, "correct");
//     },

//     // Generate new token
//     function (user, done) {
//         // Store user id with token
//         var token = "thisisatesttoken";
//         tokens[token] = user;

//         return done(null, token);
//     }
// ));

// Serialize a user object to it's ID
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// Deserialize a user ID to it's object
passport.deserializeUser(function(id, done) {
    // Get user for ID
    let user = User.findByID(id);
    if (user === null) {
        done(null, false, {
            message: "Couldn't find user."
        });
        return;
    }

    // Pass object along
    done(null, user);
});

// --------------------------------------------------
// Load routers
// --------------------------------------------------

var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');

app.use(function (req, res, next) {
    res.locals.flash = req.flash('error');
    next();
});
app.use('/auth', authRouter);
app.use('/', indexRouter);

// --------------------------------------------------
// Error handlers
// --------------------------------------------------

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
