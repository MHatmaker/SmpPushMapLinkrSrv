

exports.index = function(req, res){
  console.log("exports.index");
  res.json({message: 'index is here'});
};

exports.indexchannel = function(req, res){
  console.log("exports.indexchannel");
  var name = req.params.name;
  console.log(name);
  res.send('/' + name);
};
