const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Sequelize = require('sequelize');
const config = require('./config');
var TeleSignSDK = require('telesignsdk');
const cron = require('node-cron');
const Op = Sequelize.Op;

// Set up Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite', // Update with your SQLite file path
    logging: false // Disable logging to console
});

const smsApi = new TeleSignSDK(config.telesign.customerID, config.telesign.apiKey);

const User = require('./models/User')(sequelize, Sequelize.DataTypes);
const Post = require('./models/Post')(sequelize, Sequelize.DataTypes);
const Link = require('./models/Link')(sequelize, Sequelize.DataTypes);
const Image = require('./models/Image')(sequelize, Sequelize.DataTypes);

// Establish relationships
User.hasMany(Link);
Link.belongsTo(User);
User.hasMany(Image);
Image.belongsTo(User);
User.hasMany(Post);
Post.belongsTo(User);

//check for stale rows every minute.
cron.schedule('* * * * *', function () {
    User.destroy({
        where: {
            setup: false,
            createdAt: {
                [Op.lt]: new Date(new Date() - 10 * 60 * 1000) //created more than 10 minutes ago.
            }
        }
    })
        .then(numDeleted => {
            //console.log(`Deleted ${numDeleted} rows`);
        })
        .catch(err => {
            console.error('Error deleting rows:', err);
        });
});

//check for stale rows every minute.
cron.schedule('* * * * *', function () {
    User.destroy({
        where: {
            setup: false,
            createdAt: {
                [Op.lt]: new Date(new Date() - 10 * 60 * 1000) //created more than 10 minutes ago.
            }
        }
    })
        .then(numDeleted => {
            //console.log(`Deleted ${numDeleted} rows`);
        })
        .catch(err => {
            console.error('Error deleting rows:', err);
        });
});

// Sync the model with the database
sequelize.sync()
    .then(() => {
        console.log('Database and tables created!');
    })
    .catch((err) => {
        console.error('Unable to create database and tables:', err);
    });

// Initialize Express
const app = express();

const setCorsHeaders = (req, res, next) => {
    // List of allowed origins
    const allowedOrigins = config.corsOptions.origin

    // Get the origin from the request headers
    const origin = req.headers.origin;

    // Check if the origin is in the list of allowed origins
    if (allowedOrigins.includes(origin)) {
        // Set the CORS headers to allow the request
        res.header('Access-Control-Allow-Origin', origin);
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Credentials', config.corsOptions.credentials);
    }

    next();
    next();
};

// Use the CORS middleware for all routes
app.use(setCorsHeaders);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Passport
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
    (username, password, done) => {
        User.findOne({ where: { number: username } })
            .then(async (user) => {
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                const pincode = user.req_id;
                if (password == pincode) {
                    //matches
                    await user.update({ setup: true });
                    return done(null, user);
                } else {
                    //doesnt match
                    return done(null, false, { message: 'Invalid Verification Code.' });
                }
            })
            .catch(err => done(err));
    }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.number);
});

passport.deserializeUser((number, done) => {
    User.findByPk(number)
        .then(user => done(null, user))
        .catch(err => done(err));
});

function generatePIN() {
    return Math.floor(1000 + Math.random() * 9000);
}

app.post('/verify', (req, res) => {
    //send a request to verify the given phone number
    const data = req.body;
    const pincode = generatePIN();
    const number = data['number'];
    const message = "Your lil-Feed pin code is " + pincode;
    const messageType = "ARN";
    smsApi.sms.message(async (error, responseBody) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error Sending Message');
            return;
        }
        //create a user with the temporary request id
        //update a user if a new login is requested
        try {
            const [user, created] = await User.upsert({
                number: number,
                req_id: pincode,
            });
            if (created) {
                console.log('created');
                res.status(201).json({ message: 'User created successfully' });
            } else {
                console.log('updated');
                res.status(200).json({ message: 'User updated successfully' });
            }
        } catch (err) {
            console.error(err);

            res.status(500).json({ message: 'Error creating or updating user' });
        }
    }, number, message, messageType);

});
app.get('/login', (req, res) => { res.send('lgoin page'); });

app.post('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.status(200).send('logged out');
    });
});
// Routes
app.post('/confirm',
    passport.authenticate('local', { failureMessage: 'Failed', }),
    function (req, res) {
        res.redirect('/user/' + req.user.number);
    });

app.put('/user', (req, res) => {
    if (req.isAuthenticated()) {
        var fields = req.body;
        console.log(fields);

        User.update(fields, {
            where: { number: req.user.number }
        })
            .then(() => {
                console.log('User updated successfully');
            })
            .catch((error) => {
                console.error('Error updating user:', error);
            });
        res.status(200).send(req.user);
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/user/:number', (req, res) => {
    if (req.isAuthenticated() && req.user.number == req.params['number']) {
        User.findOne({
            include: [{ model: Post, as: 'Posts' }],
            where: { number: req.params['number'] }
        })
            .then(user => {
                if (!user) {
                    //number doesnt exist
                    res.status(404).send('Not Found');
                } else {

                    //send other person's page
                    res.status(200).send({ 'user': user, 'self': true });
                }
            }
            );
    } else {

        User.findOne({
            include: [{ model: Post, as: 'Posts' }],
            where: { number: req.params['number'] }
        })

    .then(user => {
        if (!user) {
            //number doesnt exist
            res.status(404).send('Not Found');
        } else {
            //send other person's page
            res.status(200).send({ 'user': user, 'self': false });

        }
    }
    );
    }
});

app.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        User.findOne({ where: { number: req.user.number } })
            .then(user => {
                if (!user) {
                    //error
                    res.status(500).send('Error Fetching');
                } else {
                    res.status(200).send({ 'user': user, 'self': true });
                }
            }
            );
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.post('/post', (req, res) => {
    if (req.isAuthenticated()) {
        const postData = req.body;
        Post.create({
            title: postData['title'],
            content: postData['content'],
            UserNumber: req.user.number
        });
        res.status(200).send('Uploaded');
    }
    else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/protected', (req, res) => {
    console.log(req.user);
    if (req.isAuthenticated()) {
        res.send('Success!');
    } else {
        res.send('Fail.');
    }
});

// Start the server
const PORT = process.env.PORT || 2600;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});