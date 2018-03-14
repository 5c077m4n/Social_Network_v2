'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const resError = require('../respond-error');
const config = require('../config');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new Schema({
	username: {type: String, minlength: 3, maxlength: 100, unique: [true, 'This username has already been taken.'], required: true},
	email: {type: String, trim: true, maxlength: 100, unique: [true, 'This email is currently in use.']},
	password: {type: String, required: true, select: false, minlength: 3, maxlength: 100},
	secret: {type: String, required: true, select: false, default: config.generateSecret()},
	name: {type: String, default: "", maxlength: 100},
	profilePic: {type: String, default: ""},
	bio: {type: String, maxlength: 200},
	dateOfBirth: {type: Date, default: "1970-01-01"},
	gender: {type: String, enum: ["male", "female"]},
	createdAt: {type: Date, default: Date.now},
	modifiedAt: {type: Date, default: Date.now},
	isAdmin: {type: Boolean, default: false},
	following: [ObjectId]
});
UserSchema.pre('save', function(next) {
	const user = this;
	return new Promise((resolve, reject) => {
		bcrypt.hash(user.password, 14, function(err, hash) {
			if(err) reject(err);
			resolve(hash);
		});
	}).then((hash) => {
		user.password = hash;
		return next();
	}).catch((err) => {
		return next(err);
	});
});

UserSchema.statics.authenticate = function(req, res, next) {
	return new Promise((resolve, reject) => {
		if(req.body.username && req.body.password)
		{
			this.findOne({username: req.body.username})
			.select('+password')
			.select('+secret')
			.exec((error, user) => {
				if(error) return reject(error);
				else if(!user) return resError(res, 401, 'Incorrect username/password inserted.');
				bcrypt.compare(req.body.password, user.password, (err, same) => {
					if(err) return reject(err);
					if(same) return resolve(user);
					return resError(res, 401, 'Incorrect username/password inserted.');
				});
			});
		}
		else return resError(res, 401, 'Both the usermane and password are required.');
	}).then((user) => {
		user.password = undefined;
		return user;
	}).catch((err) => {
		return next(err);
	});
};

module.exports = mongoose.model('User', UserSchema);