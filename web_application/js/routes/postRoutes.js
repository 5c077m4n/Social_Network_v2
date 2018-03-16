'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const request = require('request-promise');
const express = require('express');
const resError = require('../respond-error');
const middleware = require('../middleware');

const router = express.Router();
let localTemp;

router.route('/')
.get((req, res, next) => {
	return new Promise((resolve, reject) => {
		return request(
			{
				url: `http://127.0.0.1:3000/users/${req.session.user.username}/posts`,
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Accept-Charset': 'utf-8',
					'x-access-token': req.session.token
				},
				json: true
			}
		)
		.then(body => resolve(body))
		.catch(err => reject(err));
	})
	.then((body) => {
		res.render('posts.pug', {
			title: 'All your posts',
			username: req.session.user.username,
			posts: body
		});
	})
	.catch((err) => {
		return resError(res, err.status, err.message);
	});
})
.post((req, res, next) => {
	request(
		{
			url: `http://127.0.0.1:3000/users/${req.session.user.username}/posts`,
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Accept-Charset': 'utf-8',
				'x-access-token': req.session.token
			},
			body: {
				content: req.body.content,
			},
			json: true
		}
	)
	.then(body => {
		localTemp.post = body;
	})
	.catch(err => reject(err));
})
.put((req, res, next) => {

})
.delete((req, res, next) => {

});

module.exports = router;