/** 
 * COURSES.JS
 *
 * @author: Pattey Bleecker
 * Date:    February 15, 2017
 * For:     teamTreehouse Project 12, CAPSTONE
 * 
 * Router for Courses
 */
'use strict';

const express = require('express');
const router = express.Router();
const Dogs = require('../models/dogs');
const fs = require('fs');
const moment = require('moment');


/** GET /api/dogs
 * Returns all dogs      */
router.get('/dogs', function(req, res, next) {
    Dogs.find({})
      .sort({ breed: 1 })
      .exec(function(err, dogs) {
        if(err) return next(err);
        res.json(dogs);
    });
});

/** POST /api/dogs
 * Creates new dog      */
router.post('/dogs', function(req, res, next) {
    var dog = new Dogs(req.body);
    dog.save(function(err) {
        if (err) {
            var errorMessages = {
                message: 'Validation Failed',
                errors: {}
            };
            if (err.name === 'ValidationError') {
                for (var error in err.errors) {
                    errorMessages.errors[error] = [{
                        code: 400,
                        message: err.errors[error].message
                    }];
                }
                return res.status(400).json(errorMessages);
            } else {
                return next(err);
            }
        }
        res.status(201);
        res.end();
    });
});

router.post('/dogs/file', function(req, res, next) {
    Dogs.find({})
      .exec(function(err, dogs) {
        if(err) return next(err);
        var fileName = 'dogs' + moment().format('YYYYMMDD') + '.json';
        var myJSON = {"dogs": {"_model": "Dog"}};

        for (var i = 0; i < dogs.length; i++) {
            myJSON.dogs[dogs[i].breed] = dogs[i];
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

/* GET /api/dogs/breeds 
*  Returns dog breeds in alphabethical order */
router.get('/dogs/breeds', function(req, res, next) {
    Dogs.find({})
      .select('breed imageURL imageRef imageTitle')
      .sort({ breed: 1 })
      .exec(function(err, dogs) {
        if(err) return next(err);
        res.json(dogs);
    });
});

/* GET /api/dogs/account/favorites 
*  Returns a user's favorite dogs in alphabethical order */
router.get('/dogs/account/favorites', function(req, res, next) {
    var idArray = [];
    for (var id in req.query) {
        idArray.push(req.query[id]);
    }
    Dogs.find({ _id: { $in: idArray }})
      .sort({ breed: 1 })
      .exec(function(err, dogs) {
        if(err) return next(err);
        res.json(dogs);
    }); 
});

router.get('/dogs/admin/:id', function(req, res, next) {
    Dogs.findById(req.params.id, function(err, dog) {
        if(err) return next(err);
        res.json(dog);
    });
});

router.put('/dogs/admin/', function(req, res, next) {
    var updateDog = new Dogs(req.body);
    Dogs.findById(updateDog._id, function(err, dog) {
        if(err) return next(err);
        dog = updateDog;
        Dogs.findByIdAndUpdate(dog._id, dog, { runValidators: true, returnNewDocument: true }, function(err, dog) {
            if (err) {
                var errorMessages = {
                    message: 'Validation Failed',
                    errors: {}
                };
                if (err.name === 'ValidationError') {
                    for (var error in err.errors) {
                        errorMessages.errors[error] = [{
                            code: 400,
                            message: err.errors[error].message
                        }];
                    }
                    return res.status(400).json(errorMessages);
                } else {
                    return next(err);
                }
            }
            res.status(201);
            res.json(dog);
        });
    });
});

/** DELETE /api/dogs/admin/:id 
 * Deletes dog with id = :id */
router.delete('/dogs/admin/dogs/:id', function(req, res, next) {
    Dogs.findByIdAndRemove(req.params.id, function(err) {
        if (err) next(err);
        res.status(204);
        res.end();
    });
});


/** GET /api/dogs/list/:letter 
 * Returns all dogs beginning with letter */
router.get('/dogs/breeds/:letter', function(req, res, next) {
    var end;
    var start;
    if (req.params.letter === 'V-Z') {
        start = 'V';
        end = 'Zz';
    } else {
        start = req.params.letter;
        end = req.params.letter + 'zz';
    }
    Dogs.find({breed: { $gt: start, $lt: end }})
        .select('breed imageURL imageRef imageTitle')
        .sort({ breed: 1 })
        .exec(function(err, dogs) {
        if(err) return next(err);
        res.json(dogs);
    });
});

/** GET /api/breeds/filter?query string
 * Returns all dogs matching query parameters */
router.get('/dogs/filtered', function(req, res, next) {
        Dogs.find(req.query)
          .sort({ breed: 1 })
           .exec(function(err, dogs) {
            if(err) return next(err);
            res.json(dogs);
        }); 
});

router.get('/dogs/bestOf', function(req, res, next) {
    var name = 'bestOf.' + req.query.list;
    var query = {};
    query[name] = true;
        Dogs.find( query )
          .sort({ breed: 1 })
           .exec(function(err, dogs) {
            if(err) return next(err);
            res.json(dogs);
        }); 
});

/** GET /api/dogs/:breed
 * Returns a breed of dog      */
router.get('/dogs/detail', function(req, res, next) {
    if (req.query.id) { 
        Dogs.find({ _id: req.query.id })
        .exec(function(err, dog) {
            if(err) return next(err);
            res.json(dog);
        }); 
    } else if (req.query.breed) {
        Dogs.findOne({ breed: req.query.breed })
        .exec(function(err, dog) {
            if(err) return next(err);
            res.json(dog);
        });
    }
});

module.exports = router;