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

router.param('adminUsername', (req, res, next, adminUsername) => {
	return new Promise((resolve, reject) => {
		User
		.findOne({username: req.params.adminUsername})
		.exec((err, admin) => {
			if(err) return reject(err);
			return resolve(admin);
		});
	}).then((admin) => {
		if(!admin) return resError(res, 404, 'The requested admin cannot be found.');
		localTemp.admin = admin;
		req.userID = admin._id;
		return next();
	}).catch((err) => {
		return next(err);
	});
});
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
		localTemp.admin.user = user;
		return next();
	}).catch((err) => {
		return next(err);
	});
});

router.route('/')
.get((req, res, next) => {
	return new Promise((resolve, reject) => {
		User
		.find({isAdmin: true})
		.sort({name: 1})
		.exec((err, admins) => {
			if(err) return reject(err);
			return resolve(admins);
		});
	}).then(admins => {
		return res.status(200).json({
			admins
		});
	}).catch(err => {
		return next(err);
	});
});

router.route('/:adminUsername')
.get((req, res, next) => {
	return res.json(localTemp.admin);
})
.put(middleware.verifyAdmin, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.admin
		.update(req.body, (err, admin) => {
			if(err) return reject(err);
			return resolve(admin);
		});
	}).then((admin) => {
		return res.json(admin);
	}).catch((err) => {
		return next(err);
	});	
})
.delete(middleware.verifyAdmin, (req, res, next) => {
	return new Promise((resolve, reject) => {
		localTemp.admin
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

router.use('/:adminUsername/users', require('./userRoutes'));
router.use('/:adminUsername/posts', require('./postRoutes'));

module.exports = router;