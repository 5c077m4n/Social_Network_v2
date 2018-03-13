const fs = require('fs');
const Promise = require('bluebird');
const request = require('request');
const express = require('express');
const router = express.Router();
const middleware = require('../middleware');

let token;

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

router.route('/login')
.all(middleware.loggedOut)
.get((req, res, next) => {
	return res.render('login', {title: 'Log in'});
})
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		request.post(
			'http://127.0.0.1:3000/login',
			{
				json: {
					username: req.body.username,
					password: req.body.password
				}
			},
			(error, response, body) => {
				if(error) return reject(error);
				if(response.statusCode !== 200) return reject(response);
				return resolve(body);
			}
		);
	})
	.then((body) => {
		console.log(body);
		if(body.auth) token = body.token;
		return res.redirect('/profile');
	})
	.catch((error) => {
		return next(error);
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

router.route('/register')
.all(middleware.loggedOut)
.get((req, res, next) => {
	return res.render('register', {title: 'Sign Up'});
})
.post((req, res, next) => {
	if(req.body.password === req.body.confirmPassword)
		return new Promise((resolve, reject) => {
			request.post(
				'http://127.0.0.1:3000/register',
				{
					json: {
						username: req.body.username,
						name: `${req.body.firstName} ${req.body.lastName}`,
						email: req.body.email,
						gender: req.body.gender,
						bio: req.body.bio,
						password: req.body.password
					}
				},
				(error, response, body) => {
					if(error) return reject(error);
					if(response.statusCode !== 200) return reject(response);
					return resolve(body);
				}
			);
		})
		.then((body) => {
			console.log(body);
			if(body.auth) token = body.token;
			return res.redirect('/profile');
		})
		.catch((error) => {
			return next(error);
		});
});

router.use('/admins', require('./adminRoutes'));
router.use('/users', require('./userRoutes'));

module.exports = router;