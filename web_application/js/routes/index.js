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
	if(req.body.email && req.body.name && req.body.favoriteBook && req.body.password && req.body.confirmPassword)
	{
		if(req.body.password !== req.body.confirmPassword)
		{
			const err = new Error('The two passwords must match.');
			err.status = 400;
			return next(err);
		}
		const userData = {
			email: req.body.email,
			name: req.body.name,
			favoriteBook: req.body.favoriteBook,
			password: req.body.password
		};
		User.create(userData, (err, user) => {
			if(err) return next(err);
			else
			{
				req.session.userId = user._id;
				return res.redirect('/profile');
			}
		});
	}
	else
	{
		const err = new Error('All fields required.');
		err.status = 400;
		return next(err);
	}
});

module.exports = router;