/** 
 * INDEX.JS
 *
 * @author: Pattey Bleecker
 * Date:    February 15, 2017
 * For:     teamTreehouse Project 12, CAPSTONE
 * 
 * Loads Modules, requires data models, and sets up port
 * Sets up middleware and routes, establishes database connection,
 * Sets up global error handling, and serves up the listening port
 */
'use strict';

// load modules
var express = require('express');
var morgan = require('morgan');
var jsonParser = require('body-parser').json;
var mongoose = require('mongoose');
var path = require('path');
var favicon = require('serve-favicon');
var fs = require('fs');

// Require data models
require('./models/users');
require('./models/dogs');

var routes = require('./routes');

//require('./database');

var app = express();

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));

// set our port
app.set('port', process.env.PORT || 3000);

// morgan gives us http request logging
app.use(morgan('dev'));
app.use(jsonParser());

// Setup the database connection through mongoose
mongoose.connect('mongodb://localhost/dogs');
//mongoose.connect('mongodb://heroku_pklp80h4:s0odka3rb8tou9k02bh14psava@ds133221.mlab.com:33221/heroku_pklp80h4');

var db = mongoose.connection;

db.on('error', function(err) {
    console.error('Connection error: ', err);
});

db.once('open', function() {
    // all database communication goes here
    // seed the database
    //require('./seed');
    console.log('Database connection successful');
});

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));
app.use('/', express.static('app'));
app.use('/', express.static('dist'));

// Set up routes
app.use('/api', routes.user);
app.use('/api', routes.dog);

// Catch 404 errors
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Global error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});
