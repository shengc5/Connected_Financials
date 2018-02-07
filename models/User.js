var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// The schema for user in the mongodb
var userSchema = new Schema({
	email: {
		type: String,
	},
    password: {
        type: String,
    },
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	alertLine: {
		type: Number
	}
});

mongoose.model('users', userSchema);