/** 
 * DOGS.JS
 *
 * @author: Pattey Bleecker
 * Date:    February 23, 2017
 * For:     teamTreehouse Project 12, CAPSTONE
 * 
 * Dog model schema
 */
'use strict';

const mongoose = require('mongoose');
//const integerValidator = require('mongoose-integer');

const Schema = mongoose.Schema;

const DogSchema = new Schema({
    breed: {
        type: String,
        unique: [true, 'A dog of this breed already exists.'],
        required: [true, 'Title is required.']
    },
    imageURL: {
        type: String,
    },
    imageRef: {
        type: String,
    },
    imageTitle: {
        type: String,
    },
    imageURL2: {
        type: String,
    },
    energyLevel: {
        type: String,
        required: [true, 'Energy Level is required.'],
        enum: ['Low', 'Medium', 'High']
    },
    size: {
        type: String,
        required: [true, 'Size is required.'],
        enum: ['Small', 'Medium', 'Large']
    },
    akcRank: {
        type: Number
    },
    shortDesc: {
        type: String,
        required: [true, 'A short description is required.']
    },
    longDesc: {
        type: String
    },
    breedStandard: {
        type: String
    },
    club: {
        type: String,
        required: [true, 'A breed club is required.']
    },
    clubURL: {
        type: String,
        required: [true, 'A breed club URL is required.']
    },
    grooming: {
        type: String,
        required: [true, 'Grooming info is required.']
    },
    groomIcon: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: [true, 'Grooming info is required.']
    },
    exercise: {
        type: String,
        required: [true, 'Exercise info is required.']
    },
    exerciseIcon:{
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: [true, 'Grooming info is required.']
    },
    health: {
        type: String,
        required: [true, 'Health info is required.']
    },
    function: {
        type: String,
        enum: ['Companion', 'Guard', 'Hunting', 'Herding', 'Working', 'Sled', 'Sporting']
    },
    type: {
        type: String,
        enum: ['Bichon', 'Terrier', 'Hound', 'Toy', 'Shepherd', 'Spaniel', 'Retriever', 'Spitz', 'Mastiff', 'Gun dog']
    },
    hypoallergenic: Boolean,
    shedding: {
        type: String,
        enum: ['No', 'Low', 'Average', 'Profuse']
    },
    bestOf: {
        apartment: {type: Boolean},
        family: {type: Boolean},
        active: {type: Boolean},
        guard: {type: Boolean},
        quiet: {type: Boolean},
        lowMaintenance: {type: Boolean}
    }
}/*, {
    id: false
}*/,
{
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

// Create virtual energyLevelClass field
DogSchema.virtual('energyLevelClass').get(function() {
    var energyLevelClass = '';
    if (this.energyLevel) {
        if (this.energyLevel.toLowerCase() ==='low') {
            energyLevelClass = 'mdi-walk';
        } else if (this.energyLevel.toLowerCase()==='medium') {
            energyLevelClass = 'mdi-run';
        } else {
            energyLevelClass = 'mdi-run-fast';
        }
    }
    return energyLevelClass;
});

// Create virtual ordinal field
DogSchema.virtual('ordinal').get(function() {
    var ordinal = '';
    if (this.akcRank) {
        var rank = this.akcRank.toString();
        if (rank === '11' || rank === '12' || rank === '13') {
            ordinal = 'th';
        } else {
            var lastDigit = rank.charAt(rank.length-1);
            if ( lastDigit === '1') { 
                ordinal = 'st';
            } else if ( lastDigit === '2') {
                ordinal = 'nd';
            } else if ( lastDigit === '3') {
                ordinal = 'rd';
            } else {
                ordinal = 'th';
            }
        }
    }
    return ordinal;
});

// Create virtual akcRankHeart field
DogSchema.virtual('akcRankHeart').get(function() {
    var akcRankHeart = 'Blank';
    if (this.akcRank) {
        var rank = parseInt(this.akcRank);
        if (rank <= 25) {
            akcRankHeart = 'Red';
        } else if (rank > 25 && rank <= 50) {
            akcRankHeart = 'Pink';
        } else if (rank > 50 && rank <= 75) {
            akcRankHeart = 'Yellow';
        } else if (rank > 75 && rank <= 100) {
            akcRankHeart = 'Orange';
        } else if (rank > 100) {
            akcRankHeart = 'Green';
        }
    }
    return akcRankHeart;
});

// Create virtual favClass field
DogSchema.virtual('favClass').get(function() {
    var favClass = 'paw fav-off';
    return favClass;
});

var Dog = mongoose.model('Dog', DogSchema);
module.exports = Dog;