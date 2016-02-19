/**
 * Lib
 */
module.exports.respond = function(event, cb) {
	//console.log("event Data");
	// console.log(JSON.stringify(event));
  var response = {
    message: "Your Serverless function ran successfully!"
  };

  //return cb(null, event);
  return cb(null, response);
};
