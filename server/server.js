var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
var port = process.env.PORT || 3000;
var host = process.env.HOST;
var path = require('path');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var db = require('./db');
var handlers = require('./handlers');
var Guid = require('node-uuid');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.static(__dirname + '/../client'));
app.set('views', '../views');
app.set('view engine', 'jade'); //templating engine for dashboard and active map view

var FACEBOOK_APP_ID = 922911927720037;
var FACEBOOK_APP_SECRET = '513872ee43b515e579d4133a0d7e4086';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new FacebookStrategy({
  clientID: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback"
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
  ));

//This is the handler for Facebook authentication. Our application redirects to facebook which will ask for permission and then make a GET req to the route below
app.get('/auth/facebook', passport.authenticate('facebook'), function (req, res) {
});

//Facebook redirects to this URL upon approval
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/signup' }), function (req, res) {
  handlers.setUser(req.user.displayName)
    .then(function (user) {
      res.cookie('u_id', user.id);
    })
    .then(function () {
      res.redirect('/myMap');
    });
});

//Home page
app.get('/', function (req, res) {
  res.sendFile(__dirname, 'index.html');
});

//View Example page now using Jade templates
app.get('/example', function (req, res) {
  res.render('example', { title: 'Bootcamps in San Francisco'});
});

//MyMap page
app.get('/myMap', function (req, res) {
  res.sendFile(path.join(__dirname, '/../client/myMap.html'));
});

//MyMap request for all user maps
app.get('/myMap/user', function (req, res) {
  handlers.getUserMaps(req.cookies.u_id)
    .then(function (maps) {
      res.send(maps);
    });
});

//Active Map View
app.get('/maps/:guid', function (req, res) {
  // handler.getMap(req.params.guid)
  //   .then(function (mapData) {
      res.render('activemap', {name: 'Bootcamps', guid: 'jf90j3fo7', UserId: 1, locations: [
          {
            name: 'Hack Reactor', // unique location name in the locations table
            latitude: 37.783748,
            longitude: 122.40904599999999,
            description: 'This is the longest description for the first location, it is just amazing, omg...',
            address: '944 Market Street #8, San Francisco, CA 94102',
            title: 'Number one user input title' // this is the user input
          },
          {
            name: 'Dev Bootcamp',
            latitude: 37.784585,
            longitude: 122.39721400000002,
            description: 'This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. This is a lot of information to handle in one go. ',
            address: '113 8th Avenue, San Francisco, CA 94019',
            title: 'Number two user input title'
          },
          {
            name: 'MakerSquare',
            latitude: 37.787496,
            longitude: 122.39990899999998,
            description: 'yo dude, here\'s my description',
            address: '88 Colin P Kelly Jr St San Francisco, CA 94107 United States',
            title: 'Number three user input title'
          }
        ]}
    );
});

//User Dashboard
app.get('/dashboard', function (req, res) {
  handlers.getUserMaps(req.cookies.u_id)
    .then(function (userMaps) {
      res.render('dashboard', userMaps);
    });
});

app.get('/api/:guid', function (req, res){
  console.log("GUID: ", req.params.guid);
  var map = handlers.getMap(req.params.guid);
    console.log(map);
});
//createMaps page for individual users
app.route('/createMaps')
  .get(function (req, res) {
    var UserId = req.cookies.u_id;
    res.sendFile(path.join(__dirname, '/../client/createMaps.html'));
  })
  .post(function (req, res) {
    var guid = Guid.v4().slice(0, 8);
    var map = req.body; //map data from client
    map.UserId = req.cookies.u_id; //adds UserId property
    map.Guid = guid;
    handlers.setMap(map);  //Adds this map to the database
    res.send(guid);
  });

//Login
app.post('/login', function (req, res) {
  res.redirect('/auth/facebook');
});

//Sign up
app.post('/signup', function (req, res) {
  res.redirect('/auth/facebook');
});

app.listen(port, function () {
  console.log("Listening on " + port);
});