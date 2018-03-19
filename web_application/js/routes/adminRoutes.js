'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request');
const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const HOST = require('../../localData/API_address.json').HOST;
const PORT = require('../../localData/API_address.json').PORT;

router.route('/')
.get((req, res, next) => {
	res.render('profile', {
		title: 'Profile',
		username: req.session.user.username,
		name: req.session.user.name
	});
})
.put((req, res, next) => {

})
.delete((req, res, next) => {

});

router.use('/posts', require('./postRoutes'));

module.exports = router;