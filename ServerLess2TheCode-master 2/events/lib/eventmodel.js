var AWS = require('aws-sdk');
var config = require('./../config.json');
var dynamodb = new AWS.DynamoDB();
AWS.config.update({region: config.REGION})

module.exports.getEvent = function(event_id, primaryKey,updateAttr,fn){
    var param = {
            TableName: config.DDB_EVENT_TABLE,
            KeyConditionExpression: '#hashkey = :hk_val AND #rangekey = :rk_val',
            ExpressionAttributeNames: {
            '#hashkey': 'id',
            '#rangekey': 'eventId',
            },
            ExpressionAttributeValues: {
            ':hk_val': {
                        S: primaryKey
                    },
            ':rk_val':{
                        S:event_id
                    }
            }
    };
    dynamodb.query(param,fn);
}


// funtion to create new event Activity
module.exports.createEventActivity = function(DataJSON, fn){
    var param =  {
            TableName: config.DDB_EVENTACTIVITY_TABLE,
            Item :DataJSON,
    }
    console.log("create event is",DataJSON);
    dynamodb.putItem(param, fn);

}

//function to update Event Activity
module.exports.updateEventActivity = function(profile_id, primaryKey, updateAttr,fn){

    var param = {
            TableName: config.DDB_EVENTACTIVITY_TABLE,
            Key: {
                    id: {
                            S: primaryKey
                    },
                    profileId:{
                            S:profile_id
                    }
            },
            AttributeUpdates: updateAttr
    };
    //console.log(JSON.stringify(param));
    dynamodb.updateItem(param,fn);
}

//function to get Event activity
module.exports.getEventActivity = function(profileId, i, primaryKey,fn){
    var param = {
            TableName: config.DDB_EVENTACTIVITY_TABLE,
            KeyConditionExpression: '#hashkey = :hk_val AND #rangekey = :rk_val',
            ExpressionAttributeNames: {
            '#hashkey': 'id',
            '#rangekey': 'profileId',
            },
            ExpressionAttributeValues: {
            ':hk_val': {
                        S: primaryKey
                    },
            ':rk_val':{
                        S:profileId
                    }
            }
    };
    dynamodb.query(param,function(err, data){
        if(err){
            fn(err, data);
        }
        else{
            data.indexvalue = i;
            fn(err, data);
        }
    });
}


//function to get Code Status
module.exports.getCodeStatus = function(code,primaryKey, fn){
    var param = {
            TableName: config.DDB_CODESTATUS_TABLE,
            KeyConditionExpression: '#hashkey = :hk_val',
            ExpressionAttributeNames: {
            '#hashkey': 'id',
            },
            ExpressionAttributeValues: {
            ':hk_val': {
                        S: primaryKey
                    }
            }
    };
    dynamodb.query(param,function(err, data){
        if(err){
            fn(err);
        }
        else{
            //data.indexvalue = i;
            fn(null, data);
        }
    });
}

// funtion to create new Code Status
module.exports.createCodeStatus = function(codeStatusData, fn){
    console.log("data for query is ", codeStatusData);
    var param =  {
            TableName: config.DDB_CODESTATUS_TABLE,
            Item :codeStatusData,
    }
    dynamodb.putItem(param, fn);
}




module.exports.updateProfileActivity = function(event_id, primaryKey, updateAttr,fn){
    var param = {
            TableName: config.DDB_PROFILEACTIVITY_TABLE,
            Key: {
                    id: {
                            S: primaryKey
                    },
                    eventId:{
                            S:event_id
                    }
            },
            AttributeUpdates: updateAttr
    };
    console.log("param is ",JSON.stringify(param));
    dynamodb.updateItem(param,fn);
}

// funtion to create create Profile Activity
module.exports.createProfileActivity = function(profileactivityData, fn){
    var param =  {
            TableName: config.DDB_PROFILEACTIVITY_TABLE,
            Item :profileactivityData,
    }
    dynamodb.putItem(param, fn);
}

module.exports.getProfileActivity = function(event_id, primaryKey,fn){
    var param = {
            TableName: config.DDB_PROFILEACTIVITY_TABLE,
            KeyConditionExpression: '#hashkey = :hk_val AND #rangekey = :rk_val',
            ExpressionAttributeNames: {
            '#hashkey': 'id',
            '#rangekey': 'eventId',
            },
            ExpressionAttributeValues: {
            ':hk_val': {
                        S: primaryKey
                    },
            ':rk_val':{
                        S:event_id
                    }
            }
    };
    dynamodb.query(param,fn);
}
