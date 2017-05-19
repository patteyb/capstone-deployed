/** 
 * USERS.JS
 *
 * @author: Pattey Bleecker
 * Date:    March 9, 2017
 * For:     teamTreehouse Project 12, CAPSTONE
 * 
 * Router for Users
 */
'use strict';

const express = require('express');
const router = express.Router();
const Dogs = require('../models/dogs');
const Users = require('../models/users');
const mid = require('../middleware');
const validator = require('validator');
const fs = require('fs');
const moment = require('moment');


/** GET /api/dogs
 * Returns all users      */
router.get('/dogs/users', function(req, res, next) {
    Users.find({})
      .populate({ path: 'favorites', select: 'breed', id: false, model: Dogs})
       .sort({ fullName: 1 })
      .exec(function(err, users) {
        if(err) return next(err);
        res.json(users);
    });
});

router.post('/users/file', function(req, res, next) {
    Users.find({})
      .exec(function(err, users) {
        if(err) return next(err);
        var fileName = 'users' + moment().format('YYYYMMDD') + '.json';
        var myJSON = {"users": {"_model": "User"}};

        for (var i = 0; i < users.length; i++) {
            myJSON.users[users[i].fullName] = users[i];
            myJSON.users[users[i].fullName.isPasswordHashed] = true;
        }
        myJSON = JSON.stringify(myJSON);

        fs.writeFile(fileName, myJSON, function(err) {
            if (err) {
                return res.status(400).json(err);
            } 
            res.json(fileName);
        }); 
    });
});


/** PUT /api/dogs/fav/:userId/:dogId/:state1/:state2 
 * Adds a dog to a user's favorites */
router.put('/dogs/fav/:userId/:dogId', function(req, res, next) {
    Users.findById(req.params.userId, function(err, user) {
        if (err) next(err);
        user.favorites.push(req.params.dogId);
        Users.findByIdAndUpdate(req.params.userId, { $set: { favorites: user.favorites }}, function(err) {
            if (err) next(err);
            res.status(204);
            res.end();
        }); 
    });
});

/** DELETE /api/dogs/fav/:userId/:dogId/:state1/:state2 
 * Adds a dog to a user's favorites */
router.delete('/dogs/fav/:userId/:dogId', function(req, res, next) {
    Users.findById(req.params.userId, function(err, user) {
        if (err) next(err);
        user.favorites.splice(user.favorites.indexOf(req.params.dogId), 1);
        Users.findByIdAndUpdate(req.params.userId, { $set: { favorites: user.favorites }}, function(err) {
            if (err) next(err);
            res.status(204);
            res.end();
        }); 
    });
});

/** PUT /api/dogs/detail/rescue/:userId/:dogId
 * Adds a dog to a user's favorites */
router.put('/dogs/detail/rescue/:userId/:dogId', function(req, res, next) {
    Users.findById(req.params.userId, function(err, user) {
        if (err) next(err);
        user.rescues.push(req.params.dogId);
        Users.findByIdAndUpdate(req.params.userId, { $set: { rescues: user.rescues }}, function(err) {
            if (err) next(err);
            res.status(204);
            res.end();
        }); 
    });
});

/** DELETE /api/dogs/detail/rescue/:userId/:dogId
 * Adds a dog to a user's favorites */
router.delete('/dogs/detail/rescue/:userId/:dogId', function(req, res, next) {
    Users.findById(req.params.userId, function(err, user) {
        if (err) next(err);
        user.rescues.splice(user.rescues.indexOf(req.params.dogId), 1);
        Users.findByIdAndUpdate(req.params.userId, { $set: { rescues: user.rescues }}, function(err) {
            if (err) next(err);
            res.status(204);
            res.end();
        }); 
    });
});

/** PUT /api/dogs/account/fullName
 * Update a user's account fullName */
router.put('/dogs/account/fullName', function(req, res, next) {

    // If all fields are present
    if (req.body.emailAddress &&
        req.body.fullName &&
        req.body.password) {

        Users.findByIdAndUpdate(req.body._id, { $set: {fullName: req.body.fullName}}, function(err) {
            if (err) next(err);
            return res.status(201).send();
        });
    // else fields are missing
    } else {
        var errorMessages = {
            message: 'No Data',
            errors: [{ 
                code: 400,
                message: 'All fields are required.'
            }]
        };
        return res.status(400).json(errorMessages);
    } 
});

/** PUT /api/dogs/account/emailAddress
 * Update a user's account email address */
router.put('/dogs/account/emailAddress', function(req, res, next) {
    var errorMessages = {};

    // If all fields are present
    if (req.body.emailAddress &&
        req.body.fullName &&
        req.body.password) {

        // confirm that it is a valid email
        if( !validator.isEmail(req.body.emailAddress) ) {
            errorMessages = {
                message: 'Invalid Email',
                errors: [{ 
                    code: 400,
                    message: 'The email you provided is not valid.'
                }]
            };
            return res.status(400).json(errorMessages);
        }

        // confirm that email is not already in use
        Users.findOne({ emailAddress: req.body.emailAddress}, function(err, user) {
            if (err) next(err);
            if (user) {
                errorMessages = {
                    message: 'Duplicate Email',
                    errors: [{ 
                        code: 400,
                        message: 'This email has an account already.'
                    }]
                };
                return res.status(400).json(errorMessages);
            } 
        });

        // Email is valid and not in use, go ahead and change it
        Users.findByIdAndUpdate(req.body._id, { $set: {emailAddress: req.body.emailAddress}}, function(err) {
            if (err) next(err);
            return res.status(201).send();
        });
    // else fields are missing
    } else {
        errorMessages = {
            message: 'No Data',
            errors: [{ 
                code: 400,
                message: 'All fields are required.'
            }]
        };
        return res.status(400).json(errorMessages);
    } 
});

/** PUT /api/dogs/account/usercreds
 * Update a user's account password */
router.put('/dogs/account/password', function(req, res, next) {

    // If all fields are present
    if (req.body.emailAddress &&
        req.body.fullName &&
        req.body.password) {
    
        // Need Hooks on Users.save() to hash the password
        Users.findById( req.body._id, function(err, user) {
            if (err) next(err);
            user.password = req.body.password;
            user.save(function(err, updatedUser) {
                // Check for validation error
                if (err) {
                    if (err.name === 'ValidationError') {
                        var errorMessages = {
                            message: 'Validation Failed',
                            errors: {}
                        };
                        // Check for validation error 
                        for (var error in err.errors) {
                            errorMessages.errors[error] = [{
                                code: 400,
                                message: err.errors[error].message
                            }];
                        }
                        return res.status(400).json(errorMessages);
                    // Pass on error to error handler
                    } else {
                        return next(err);
                    }
                }
                // Saved new user with no errors
                return res.status(201).json(updatedUser);
            });
        }); 
    // else fields are missing
    } else {
        var errorMessages = {
            message: 'No Data',
            errors: [{ 
                code: 400,
                message: 'All fields are required.'
            }]
        };
        return res.status(400).json(errorMessages);
    } 
});
        
/** DELETE /api/dogs/admin/:userId
 * Deletes a user's */
router.delete('/dogs/admin/users/:id', function(req, res, next) {
    Users.findByIdAndRemove(req.params.id, function(err) {
        if (err) next(err);
        res.status(204);
        res.end();
    });
});

router.get('/dogs/signin', mid.authenticate, function(req, res) {
        res.json(req.user);
});

router.get('/dogs/signup', function(req, res, next) {
    Users.findOne({ emailAddress: req.body.emailAddress}, function(err, user) {
        if(err) next(err);
        if (user) {
            res.json(req.user);
        }
    });
});

router.post('/dogs/signup', function(req, res, next) {
  // If all fields are present
    if (req.body.emailAddress &&
        req.body.fullName &&
        req.body.password && 
        req.body.confirmPassword) {
            
        // confirm that two password fields match
        if (req.body.password !== req.body.confirmPassword) {
            var errorMessages = {
                message: 'Unmatched passwords',
                errors: [{ 
                    code: 400,
                    message: 'Password and Confirm Password do not match.'
                }]
            };
            res.render('sign-up', errorMessages);
            //return res.status(400).json(errorMessages);
        } 

        // confirm that email is not already in use
        Users.findOne({ emailAddress: req.body.emailAddress}, function(err, user) {
            if (user) {
                var errorMessages = {
                message: 'Duplicate Email',
                errors: [{ 
                    code: 400,
                    message: 'This email has an account already.'
                }]
            };
            return res.status(400).json(errorMessages);
            }
        });

        // All fields present and passes password validation, go ahead and save
        var user = new Users(req.body);
        user.save(function(buggered, user) {
            // Check for error
            if (buggered) {
                if (buggered.name === 'ValidationError') {
                    var errorMessages = {
                        message: 'Validation Failed',
                        errors: {}
                    };
                    // Check for validation error 
                    for (var error in buggered.errors) {
                        errorMessages.errors[error] = [{
                            code: 400,
                            message: buggered.errors[error].message
                        }];
                    }
                    return res.status(400).json(errorMessages);
                // Pass on error to error handler
                } else {
                    return next(buggered);
                }
            }
            // Saved new user with no errors
            return res.status(201).send(user);
        });
    // else fields are missing
    } else {
        var errorMessages = {
            message: 'No Data',
            errors: [{ 
                code: 400,
                message: 'All fields are required.'
            }]
        };
        res.location('/');
        return res.status(400).json(errorMessages);
      }
});


module.exports = router;