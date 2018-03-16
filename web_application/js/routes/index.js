'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request-promise');
const express = require('express');
const resError = require('../respond-error');
const middleware = require('../middleware');

const router = express.Router();

router.get('/', (req, res, next) => {
	return res.render('index', {title: 'Home'});
});

router.route('/register')
.all(middleware.loggedOut)
.get((req, res, next) => {
	return res.render('register', {title: 'Sign Up'});
})
.post((req, res, next) => {
	if(req.body.password === req.body.confirmPassword)
	{
		request(
			{
				method: 'POST',
				uri: `http://127.0.0.1:3000/register`,
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8'
				},
				body: {
					username: req.body.username,
					name: `${req.body.firstName} ${req.body.lastName}`,
					email: req.body.email,
					gender: req.body.gender,
					bio: req.body.bio,
					password: req.body.password
				},
				json: true
			}
		)
		.then((body) => {
			if(body.auth)
			{
				req.session.token = body.token;
				return res.redirect('/user');
			}
			else return redirect('/register');
		})
		.catch((err) => {
			return next(err);
		});
	}
});

router.route('/login')
.all(middleware.loggedOut)
.get((req, res, next) => {
	return res.render('login', {title: 'Log in'});
})
.post((req, res, next) => {
	if(!(req.body.username && req.body.password))
		return resError(res, 401, 'Both username and password are required here');
	request(
		{
			method: 'POST',
			uri: `http://127.0.0.1:3000/login`,
			headers: {
				'Accept': 'application/json',
				'Accept-Charset': 'utf-8'
			},
			body: {
				username: req.body.username,
				password: req.body.password
			},
			json: true
		}
	)
	.then((body) => {
		if(body.auth && body.token) req.session.token = body.token;
		else return redirect('/login');
		return body.token;
	})
	.then((token) => {
		return request(
			{
				url: `http://127.0.0.1:3000/users/${req.body.username}`,
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'x-access-token': req.session.token
				},
				json: true
			}
		)
		.then((body) => {
			req.session.user = body;
		})
		.catch((err) => {
			return resError(res, err.status, err.message);
		});
	})
	.then(() => {
		return res.redirect('/user');
	})
	.catch((error) => {
		return resError(res, error.status, error.message);
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

router.route('/about')
.get((req, res, next) => {
	if(req.session.user)
		return res.render('about', {
			title: 'About',
			currentUser: req.session.user,
			name: req.session.user.name
		});
	else return res.render('about', {title: 'About'});
});

router.route('/contact')
.get((req, res, next) => {
	if(req.session.user)
		return res.render('contact', {
			title: 'Contact',
			currentUser: req.session.user,
			name: req.session.user.name
		});
	else return res.render('contact', {title: 'Contact Us'});
});

module.exports = router;