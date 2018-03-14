'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const publicKey = require('../../localData/key.json').publicKey;

router.route('/login')
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		return resolve(User.authenticate(req, res, next));
	}).then(user => {
		return new Promise((resolve, reject) => {
			resolve(
				jwt.sign(
					{_id: user._id, username: user.username,  secret: user.secret, isAdmin: user.isAdmin},
					publicKey,
					{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
				)
			)
		}).then((decoded) => {
			return decoded;
		})
		.catch((err) => {
			next(err);
		});
	}).then(token => {
		return res
		.status(200)
		.json({
			auth: true,
			token
		});
	}).catch(err => {
		return next(err);
	});
});

router.route('/register')
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		new User(req.body)
		.save((err, user) => {
			if(err) reject(err);
			if(!user) return reject(new Error('The user has not been created.'));
			jwt.sign(
				{_id: user._id, username: user.username, secret: user.secret, isAdmin: user.isAdmin},
				publicKey,
				{expiresIn: 24 * 60 * 60, algorithm: 'HS512'},
				(err, token) => {
					if(err) return reject(err);
					return resolve([user, token]);
				}
			);
		});
	}).then(([user, token]) => {
		user.password = undefined;
		user.secret = undefined;
		return res.status(201).json({
			user,
			auth: true,
			token
		});
	}).catch((err) => {
		return next(err);
	});
});

module.exports = router;