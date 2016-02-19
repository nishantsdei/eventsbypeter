var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var snsObj = new AWS.SNS();

module.exports.sns_test = function(event, cb){
	var params = {
	  PlatformApplicationArn: AWS_SANDBOX_KEY,
	};
	snsObj.listEndpointsByPlatformApplication(params, function(err, data) {
	  if (err){ 
	  	return cb(null, err);
	  }	
	  else{
	  	return cb(null, data);
	  }
	});
}