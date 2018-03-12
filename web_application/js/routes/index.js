const fs = require('fs');
const Promise = require('bluebird');
const request = require('request');
const express = require('express');
const router = express.Router();
const middleware = require('../middleware');

router.get('/', (req, res, next) => {
	return res.render('index', {title: 'Home'});
});

router.get('/profile', middleware.requiresLogin, (req, res, next) => {
	return new Promise((resolve, reject) => {
		User.findById(req.session.userId).exec((error, user) => {
			if(error) return reject(error);
			else return resolve(user);
		});
	}).then((user) => {
		return res.render('profile', {title: 'Profile', name: user.username});
	}).catch(err => next(err));
});

router.post('/login', middleware.loggedOut, (req, res, next) => {
	User.authenticate(req.body.email, req.body.password)
	.then((user) => {
		req.session.userId = user._id;
		return res.redirect('/profile');
	})
	.catch((err) => {
		next(err);
	});
});

router.get('/logout', middleware.requiresLogin, (req, res, next) => {
	if(req.session) req.session.destroy((err) => {
		if(err) return next(err);
		else return res.redirect('/');
	});
	else return res.redirect('/');
});

router.get('/about', (req, res, next) => {
	return res.render('about', {title: 'About'});
});

router.get('/contact', (req, res, next) => {
	return res.render('contact', {title: 'Contact'});
});

router.get('/register', middleware.loggedOut, (req, res, next) => {
	return res.render('register', {title: 'Sign Up'});
});

router.post('/register', middleware.loggedOut, (req, res, next) => {
	return new Promise((resolve, reject) => {
		request.post(
			'http://127.0.0.1:3000/register',
			{json: {
				username: req.body.username,
				password: req.body.password
			}},
			(error, response, body) => {
				if(error) reject(error);
				if (!error && response.statusCode == 200)
				{
					
				}
			}
		);
	})
	.then((body) => {
		console.log(body);
	})
	.catch((error) => {
		return next(error);
	});
});

module.exports = router;