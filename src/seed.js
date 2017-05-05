/** 
 * SEED.JS
 *
 * @author: Pattey Bleecker
 * Date:    February 15, 2017
 * For:     teamTreehouse Project 12, CAPSTONE
 * 
 * Seeds the database with initial data
 */
'use strict';

var seeder = require('mongoose-seeder');
// Data to seed the database
var dogs = require('./data/dogs.json');
var users = require('./data/users.json');

seeder.seed(dogs).then(function() {
    // The database objects are stored in dbData
    console.log('The database has been seeded with dogs.');
}).catch(function(err) {
    // handle error
    if(err) {
        console.log(err);
    }
});

seeder.seed(users).then(function(dbData) {
    // The database objects are stored in dbData
    console.log('The database has been seeded with users.');
}).catch(function(err) {
    // handle error
    if(err) {
        console.log(err);
    }
});