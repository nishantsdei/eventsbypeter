var eventModelFunction = require('./eventmodel');

//var lodashvar = require('./');

module.exports.updateeventactivity = function(event, cb){
	if (typeof event.Records != "undefined") {
		var DynamoReq = event.Records;
		var totalEventsReceived = DynamoReq.length;
		//console.log("Total call in updateevent",JSON.stringify(DynamoReq));
	//	console.log("Total Records are",JSON.stringify(DynamoReq));


		function InsertIntoCodeBase (data, eventActivityParas, callback){
			console.log("Code record being inserted is ",data);
			var num = Math.floor(Math.random() * 90000) + 10000;
			num = num.toString();

			var primaryKey = eventActivityParas.eventId +'#'+num;
			var creationDate = Date.now().toString();
			var codeStatusData = {
										_createTime:{
														N:creationDate
										},
										_updateTime: {
														N: creationDate
										},
								//		code: {
								//						S: num,
								//		},
										id:{
														S: primaryKey,
										},
										eventId:{
													  S: eventActivityParas.eventId,
										},
										imageUrl:{
														S: ' ',
										},
										name:{
														S: eventActivityParas.profileName,
										},
										profileId:{
														S: eventActivityParas.profileId,
										},
										status:{
														S: 'activated',
										}
					};

					eventModelFunction.createCodeStatus(codeStatusData, function(errCode, dataCode){
						if(errCode){
							callback(errCode,"Failed to insert to code table");
						}
						else {
							console.log("Sucessfully created code base entry");
							InsertIntoEventActivityTable(data, eventActivityParas, num, callback);
						}
					});
		}

		function InsertProfileActivityTable (newData, eventActivityParas, num, callback){

			console.log("Inserting Profile Activity");

			var primaryKey = eventActivityParas.universityId+'#'+ eventActivityParas.profileId + "#1";

			var updRoles = newData.roles.L;

			var creationDate = Date.now().toString();


			var profileData = {
											_createTime:{
															N:creationDate
											},
											_updateTime: {
															N: creationDate
											},
											code: {
															N: num,
											},
											eventId:{
															S: eventActivityParas.eventId,
											},
											id:{
															S: primaryKey,
											},
											isActive:{
															N: '1',
											},
											roles:{
															L: updRoles,
											},
											status:{
															S: eventActivityParas.status,
											}
						};
						eventModelFunction.createProfileActivity(profileData, function(errprofile, dataProfile){
							if (errprofile){
								callback(errprofile,"Error creating profile activity");
							}
							else {
								totalEventsReceived--;
								if (totalEventsReceived == 0){  // is this the last event
									callback(null,"Successful");
								}
							}

						});

		}

		function InsertIntoEventActivityTable (newData, eventActivityParas, num, callback){
			console.log("Inserting/updating Event Activity");
			var primaryKey = eventActivityParas.universityId+'#'+eventActivityParas.eventId;

			var updRoles = newData.roles.L;

			var creationDate = Date.now().toString();
			var eventActivityData = {
													_createTime:{
																	N:creationDate
													},
													_updateTime: {
																	N: creationDate
													},
													code: {
																	N: num,
													},
													id:{
																	S: primaryKey,
													},
													isActive:{
																	N: '1',
													},
													name:{
																	S: eventActivityParas.profileName,
													},
													profileId:{
																	S: eventActivityParas.profileId,
													},
													roles:{
																	L: updRoles,
													},
													status:{
																	S: 'activated',
													}
									};

									eventModelFunction.createEventActivity(eventActivityData, function(errEvent, dataEvent){

										if (errEvent){
													callback(errEvent,"Failure to insert into Event Activity");
										}
										else {
											InsertProfileActivityTable(newData, eventActivityParas, num, callback);
										}

									});

		} //


		// function to check if array elements are the same
		function arraysAreIdentical(arr1, arr2){
    	if (arr1.length !== arr2.length) return false;
    		for (var i = 0, len = arr1.length; i < len; i++){
        	if (arr1[i].S !== arr2[i].S){
            return false;
        	}
    	}
    	return true;
		}

		function InsertNewEvent(newData, oldData, callback){
			console.log("inserting for %j", newData);
			var eventActivityId = newData.id.S;
			eventActivityId = eventActivityId.toString();
			var combinedIds =  eventActivityId.split("#");

			var eventActivityParas = {
						code: newData.code.N,
						status: newData.status.S,
						universityId: combinedIds[0],
						eventId: combinedIds[1],
					  profileName: newData.name.S,
						profileId: newData.profileId.S
			};

			// Add entry to codestatus table
			if(eventActivityParas.code == 0 && eventActivityParas.status == "activated"){
				// At this stage a new entry has been added to eventActivity for activation.
				// A new code has to generated and added to CodeBase
				// EventActivity has to be updated with the code
				// An entry has to be made into the profile activity table
				InsertIntoCodeBase(newData, eventActivityParas, callback);
			} else if (eventActivityParas.code != 0 && typeof oldData !== 'undefined'){
				 // Here since code is not empty, this trigger has occured due to a modification
				 // Items in the Profile Activity table need to be updated for changes to
				 // 1. roles
				 // 2. status.

				 // We first check if roles were modified or is status changed
				  var newImageRoles = newData.roles.L;
					var oldImageRoles = oldData.roles.L;
					var oldStatus = oldData.status.S;

					if (!arraysAreIdentical(newImageRoles, oldImageRoles) || oldStatus !== eventActivityParas.status){
						// There was a difference in roles and we proceed to update
						// create update attribute record
 						code = eventActivityParas.code.toString();
						InsertProfileActivityTable(newData, eventActivityParas, code, callback);
					}	else {
						//console.log("Modify event - roles are indentical - Not processing");
						totalEventsReceived--;
					}
				}
				else {
					// catch all ignore this
					totalEventsReceived--;
				}
				if (totalEventsReceived == 0){  // is this the last event
					console.log("Exiting from InsertNewEvent");
					callback(null,"Successful");
				}

		}

		var validateRecord = function(record){

			if (typeof record !== 'undefined' && record.dynamodb.NewImage !== 'undefined' && record.dynamodb.NewImage){
				if (record.eventName == 'INSERT' || record.eventName == 'MODIFY'){

					return true;
				}
			}

			return false;
		}


		var ProcessEventRecords = function (err , succ) {

			console.log("Inside Process Events");

			// Process each event
			var pEventCounter = 0;
			event.Records.forEach(function(record){

				if (validateRecord(record)){
					// if good record .. do something
					pEventCounter++;
					InsertNewEvent(record.dynamodb.NewImage, record.dynamodb.OldImage, cb);
				}
			});

			if (pEventCounter == 0){
				console.log("No valid events");
				cb(null, "No valid events found");
			}
		}


		//recursive();
		ProcessEventRecords();
 	}
}
