var createError = require('http-errors');
var database = require('./database');
var express = require('express');
var flash = require('connect-flash');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var RememberMeToken = require('./models/remembermetoken');
var User = require('./models/user');

var app = express();

// --------------------------------------------------
// Read config values
// --------------------------------------------------

const config = {
    secrets: require('./config/secrets')
}

// --------------------------------------------------
// Find plugins
// --------------------------------------------------

// Array storing all plugins
var plugins = [];

// Get all folders in plugins folder
let pluginDirs = fs.readdirSync("./plugins", {
    withFileTypes: true
}).filter(entry => entry.isDirectory());

// Iterate over and parse plugin.js
pluginDirs.forEach(dir => {
    let abs = path.join(__dirname, "plugins", dir.name);
    let plugin = require(path.join(abs, "plugin.js"));
    plugins.push(plugin);
});

// Initialize plugins
plugins.forEach(plugin => {
    if (plugin.onInitialize != null) {
        plugin.onInitialize();
    }
    console.log(`Plugin '${plugin.name}' initialized.`);
});

// --------------------------------------------------
// Setup express
// --------------------------------------------------

let views = pluginDirs.map(pluginDir => path.join(__dirname, "plugins", pluginDir.name, "views"));
views.push(path.join(__dirname, "views"));

// view engine setup
app.set('view engine', 'pug');
app.set('views', views);

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: config.secrets.session
}));
app.use(flash());
app.use(function (req, res, next) {
    res.locals.flash = [];

    let channels = ["error", "info"];
    channels.forEach(channel => {
        req.flash(channel).forEach(msg => {
            res.locals.flash.push({
                message: msg,
                type: channel
            });
        });
    });
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// Use the public folders within each plugin
plugins.forEach(plugin => {
    app.use(express.static(plugin.static));
});

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
        let admin = User.createNew(config.secrets.admin.username, config.secrets.admin.password, true, "public/images/users/default.png");
        admin.save();
        console.log(`Admin account created. Login with username: ${admin.username}, password: ${config.secrets.admin.password}.`)

    } else {
        console.log("Found existing database.");
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

// Use the 'local' passport.js strategy to manage authentication.
passport.use(new LocalStrategy(
    function(username, password, done) {
        // Find a user with matching username
        let user = User.findByUsername(username);
        if (user === null) {
            done(null, false, {
                message: `Unknown username '${username}'.`
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

// Use the 'remember me' passport.js strategy to handle remembering sessions.
passport.use(new RememberMeStrategy(
    // Consume the token
    function (token, done) {
        // Get user ID for token
        let token2 = RememberMeToken.findByToken(token);
        if (token2 === null) {
            return done(null, false, {
                message: "Your 'Remember Me' session has expired. Please login again."
            });
        }

        // Get user object for ID
        let user = User.findByID(token2.userID);
        if (user === null) {
            return done(null, false, {
                message: "Your 'Remember Me' session could not be found. Please login again."
            });
        }

        // Delete token and pass user object along
        token2.delete();
        return done(null, user);
    },

    // Generate new token
    function (user, done) {
        // Create token and store in database
        let token = new RememberMeToken(user.id)
        token.save();

        // Pass token along
        return done(null, token.token);
    }
));

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

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate("remember-me"));

// --------------------------------------------------
// Load routers
// --------------------------------------------------

// Middleware to include plugin and user metadata for
// dashboard pages
app.use(function(req, res, next) {
    // Append data if logged in
    if (req.isAuthenticated()) {
        res.locals.plugins = plugins.map(plugin => {
            return {
                name: plugin.name,
                icon: plugin.icon,
                path: plugin.path,
                active: req.path.includes(plugin.path)
            };
        });

        res.locals.user = {
            image: req.user.imagePath.replace("public/", "/"),
            username: req.user.username
        }
    }
    return next();
});

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

plugins.forEach(plugin => {
    plugin.routers.forEach(pair => {
        app.use(plugin.path + pair.prefix, pair.router);
    });
});

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
