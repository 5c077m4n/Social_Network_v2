'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const resError = require('../respond-error');
const middleware = require('../middleware');
const User = require('../models/user');
const Post = require('../models/post');
const secret = require('../../localData/key.json').secret;

let localTemp = {};

router.param('username', (req, res, next, username) => {
	return new Promise((resolve, reject) => {
		User
		.findOne({username: req.params.username})
		.exec((err, user) => {
			if(err) return reject(err);
			return resolve(user);
		});
	}).then((user) => {
		if(!user) return resError(res, 404, 'The requested user cannot be found.');
		localTemp.user = user;
		req.userID = user._id;
		return next();
	}).catch((err) => {
		return next(err);
	});
});

router.route('/')
.get((req, res, next) => {
	return new Promise((resolve, reject) => {
		User
		.find({isAdmin: false})
		.sort({name: 1})
		.exec((err, users) => {
			if(err) reject(err);
			resolve(users);
		});
	}).then((users) => {
		if(!users) resError(res, 404, 'The requested users cannot be found.');
		return res.json(users);
	})
	.catch((err) => {
		return next(err);
	});
});

router.route('/:username')
.get((req, res, next) => {
	return res.json(localTemp.user);
})
.put(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.user
		.update(req.body, (err, user) => {
			if(err) return reject(err);
			return resolve(user);
		});
	}).then((user) => {
		return res.json(user);
	}).catch((err) => {
		return next(err);
	});	
})
.delete(middleware.verifyUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.user
		.remove((err, user) => {
			if(err) return reject(err);
			return resolve(user);
		});
	}).then((user) => {
		return res.json({"deleted": user});
	}).catch((err) => {
		return next(err);
	});
});

router.use('/:username/posts', require('./postRoutes'));

module.exports = router;