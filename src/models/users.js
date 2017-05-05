/** 
 * USERS.JS
 *
 * @author: Pattey Bleecker
 * Date:    February 15, 2017
 * For:     teamTreehouse Project 11, Build a RESTful API
 * 
 * Users model schema
 */
'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const Dogs = require('../models/dogs');


const Schema = mongoose.Schema;

const UserSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Your full name is required."]
    },
    emailAddress: {
        type: String,
        unique: true,
        validate: {
            validator: function(v) {
                return validator.isEmail(v);
            },
            message: '{VALUE} is not a valid email.'
        },
        required: [true, 'Email is required.'],
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters."]
    },
    isPasswordHashed: {
        type: Boolean,
        default: false,
    },
    role : {
        type: String,
        required: true,
        default: 'user',
        enum: ['user', 'administrator']
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: Dogs }],
    rescues: [{ type: String }]
}, {
    id: false
});


// hash password before saving to database 
UserSchema.pre('save', function(next) {
    var user = this;
    if (this.isPasswordHashed) {
        next();
    } else {
        bcrypt.genSalt(10, function(err, salt) {
            if (err) next(err);
            bcrypt.hash(user.password, salt, function(err, hash) {
                if (err) next(err);
                user.password = hash;
                next();
            });
        });
    }
});

UserSchema.plugin(uniqueValidator);
    

var User = mongoose.model('User', UserSchema);
module.exports = User;