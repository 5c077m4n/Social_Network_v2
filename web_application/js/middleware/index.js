'use strict';
const resError = require('../respond-error');

module.exports.loggedOut = (req, res, next) => {
	if(req.session && req.session.user) return res.redirect('/login');
	else return next();
};

module.exports.requiresLogin = (req, res, next) => {
	if(req.session && req.session.user) return next();
	else return resError(res, 401, 'You must be logged in to view this page');
};

module.exports.isAdmin = (req, res, next) => {
	if(req.session.user.isAdmin) return next();
	return resError(res, 401, 'Sorry, only administrators are allowed here');
};