
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.save = function(req, res){
	console.log(req.body);
  res.render('index', { title: 'Express' });
};

exports.load = function(req, res){
  res.render('index', { title: 'Express' });
};