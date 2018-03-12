module.exports.loggedOut = (req, res, next) => {
	if(req.session && req.session.userId) return res.redirect('/profile');
	else return next();
};

module.exports.requiresLogin = (req, res, next) => {
	if(req.session && req.session.userId) return next();
	else
	{
		const err = new Error('You must be logged in to view this page.');
		err.status = 401;
		return next(err);
	}
};