/** 
 * INDEX.JS
 *
 * @author:  Pattey Bleecker
 * Date:    February 15, 2017
 * For:     teamTreehouse Project 11, Build a RESTful API
 * 
 * Middleware function authenticate() parses the authorization header to
 * capture user name and password, and then authenticates the user in the system.
 * If user exists, return the user record; else return error.
 */
'use strict';

const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const auth = require('basic-auth');

function authenticate(req, res, next) {

    // If header is invalid, userLogin = undefined
    // Else userLogin = object with name and password properties 
    var userLogin = auth(req);

    if (userLogin !== undefined) {
        Users.findOne({ emailAddress: userLogin.name }, function(err, userRecord) {

            if(err) return next(err);
            
            // If user exists
            if (userRecord) {
                // Check to see that the password is a match
                bcrypt.compare(userLogin.pass, userRecord.password, function(err, isMatch) {
                    if (err || !isMatch) {
                        // Password invalid
                        return next(401);
                    }
                    // Passwords match and user is authenticated
                    req.user = userRecord;
                    return next();     
                });
            } else {
                // Email invalid
                return res.status(401).json('Unauthorized access.');
            }
        }); 
    // Else, authentication header is empty
    } else {
        return res.status(401).json('Unauthorized access.');
    }
}

module.exports.authenticate = authenticate;