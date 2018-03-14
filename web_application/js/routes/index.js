'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request');
const express = require('express');
const jwt = require('jsonwebtoken');
const middleware = require('../middleware');
const publicKey = require('../../localData/key.json').publicKey;

const router = express.Router();
let token;

router.get('/', (req, res, next) => {
	return res.render('index', {title: 'Home'});
});

router.route('/profile')
.all(middleware.requiresLogin)
.get((req, res, next) => {
	res.render('profile.pug', {
		title: 'Profile',
		name: req.session.user.username
	});
});

router.route('/login')
.all(middleware.loggedOut)
.get((req, res, next) => {
	return res.render('login', {title: 'Log in'});
})
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		request(
			{
				url: `http://127.0.0.1:3000/login`,
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8'
				},
				json: {
					username: req.body.username,
					password: req.body.password
				}
			},
			(error, response, body) => {
				if(error) return reject(error);
				if(response.statusCode !== 200) return reject(response);
				token = body.token;
				return resolve(body);
			}
		);
	})
	.then((body) => {
		if(body.auth && body.token) 
		{
			token = body.token;
			return jwt.verify(body.token, publicKey, {algorithms: ['HS512']});
		}
		else return redirect('/login');
	})
	.then((decoded) => {
		request(
			{
				url: `http://127.0.0.1:3000/${decoded.username}`,
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'x-access-token': token
				},
				json: {
					username: req.body.username,
					password: req.body.password
				}
			},
			(error, response, body) => {
				if(error) return Promise.reject(error);
				if(response.statusCode !== 200) return Promise.reject(response);
				req.session.user = body;
				return;
			}
		);
	})
	.then(() => {
		return res.render('profile.pug', {
			title: 'Profile',
			name: req.session.user.username
		});
	})
	.catch((error) => {
		return next(error);
	});
});

router.get('/logout', middleware.requiresLogin, (req, res, next) => {
	return new Promise((resolve, reject) => {
		if(req.session)
		{
			req.session.destroy((err) => {
				if(err) return reject(err);
				else return resolve();
			});
		}
		else return ressolve();
	}).then(() => {
		return res.redirect('/');
	}).catch((err) => {
		return next(err);
	});
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
			if(body.auth)
			{
				req.session.token = body.token;
				return res.redirect('/profile');
			}
			else return redirect('/register');
		})
		.catch((error) => {
			return next(error);
		});
});

router.use('/admins', require('./adminRoutes'));
router.use('/users', require('./userRoutes'));

module.exports = router;