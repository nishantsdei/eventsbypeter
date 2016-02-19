var eventModelFunction = require('./eventmodel');

module.exports.addevents = function(event, cb){
	console.log("addevents console value");
	if (typeof event.Records != "undefined") {
		var totalEventsReceived = 0;

		function InsertIntoEventActivityTable (newData, profileItem, callback){
			console.log("Inserting Event Activity");
			var eventId = newData.id.S;

			var universityId = newData.universityId.S;
			var primaryKey = universityId+'#'+eventId;
			var rolelen = profileItem.roles;

			var updRoles = new Array();
			for(nr=0;nr<rolelen.length;nr++){
				updRoles.push({S:rolelen[nr]});
			}
			var creationDate = Date.now().toString();
			var eventActivityData = {
													_createTime:{
																	N:creationDate
													},
													_updateTime: {
																	N: creationDate
													},
													code: {
																	N: '0',
													},
													id:{
																	S: primaryKey,
													},
													isActive:{
																	N: '1',
													},
													name:{
																	S: profileItem.name,
													},
													profileId:{
																	S: profileItem.profileId,
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
												callback(errEvent, "Failure to insert into Event Activity table");
										}
										else {
											totalEventsReceived--;
											if (totalEventsReceived == 0){  // is this the last event
												callback(null,"Successful");
											}
											//InsertProfileActivityTable(newData, profileItem, num, callback);
										}

									});

	  } //

    function UpdateEventActivityTable(newData, profileItem, callback){
			//var updRoles = profileItem.roles;
			console.log ("In UpdateEvent - Roles = ", profileItem.roles);
			var eventId = newData.id.S;
			var universityId = newData.universityId.S;
			var primaryKey = universityId+'#'+eventId;

			var rolelen = profileItem.roles;
			var updRoles = new Array();
			for(nr=0;nr<rolelen.length;nr++){
				updRoles.push({S:rolelen[nr]});
			}
			console.log("Roles for update = ",updRoles);

			var updateAttrr = {};
							updateAttrr['roles'] = {
																	Action: 'PUT',
																	Value: {
																					L: updRoles
																	}
								};

			console.log("Update attr: ", updateAttrr);
			eventModelFunction.updateEventActivity(profileItem.pId, primaryKey, updateAttrr, function(errEvent, dataEvent){
				if(errEvent){
					callback(errEvent, "Failure to update Event Activity table");
				}
				else{
					totalEventsReceived--;
					if (totalEventsReceived == 0){  // is this the last event
						callback(null,"Successful");
					}

				}
				});

		}




   // validate record to esnure we do not process invalid data
    var validateRecord = function(record){
			console.log("Inside validation");
			if (typeof record !== 'undefined' && record.dynamodb.NewImage !== 'undefined' && record.dynamodb.NewImage){
				if (record.eventName == 'INSERT' || record.eventName == 'MODIFY'){
				  console.log("Record is valid");
					return true;
				}
			}
			console.log("Record is invalid");
			return false;
		}

    //build profile list will create an array of profiles with all the roles for the profile
		var buildProfileList = function(newData){
			var objectArray = new Array();
			console.log("Building Profile Array List",JSON.stringify(newData));

     // Add Planner to profileId
		 if(typeof newData.plannerName != "undefined" &&  typeof newData.plannerId != "undefined"){
				 var pName   = newData.plannerName.S ;
				 var pId = newData.plannerId.S   ;
         objectArray.push({profileId:pId,name:pName,roles:["planner"]})
			}

			// Check leaders
			if(typeof newData.leaders != "undefined"){
				var arrLeader = newData.leaders.L;
				for(l=0;l<arrLeader.length;l++){
					var pId = arrLeader[l].M.id.S ;
					var pName = arrLeader[l].M.name.S ;
					// find Index of profileId here if any
					var index=-1;
					for(var i=0; i<objectArray.length; i++){
								if(objectArray[i].profileId ==pId){
									index = i;
									break ;
								}
					}
					if(index >= 0 ){
					//here check role index in array
						if(objectArray[index].roles.indexOf("leaders") == -1){
							objectArray[index].roles.push("leaders");
						}
					} else {
						objectArray.push({profileId:pId,name:pName,roles:["leaders"]})
					}
				}
			}

			// Check bouncers
			if(typeof newData.bouncers != "undefined"){
				var arrBouncer = newData.bouncers.L;
				for(l=0;l<arrBouncer.length;l++){
					var pId = arrBouncer[l].M.id.S ;
					var pName = arrBouncer[l].M.name.S ;

					// find Index of profileId here if any
						var index=-1;
						for(var i=0; i<objectArray.length; i++){
								if(objectArray[i].profileId == pId){
									index = i;
									break ;
								}
						}
						if(index >= 0 ){
							//here check role index in array
							if(objectArray[index].roles.indexOf("bouncers") == -1){
								objectArray[index].roles.push("bouncers");
							}

						}else{
							//objectArray.push({profileId:pId,name:pName,roles:["bouncers"], _createTime:{N:creationDate},_updateTime: {N: creationDate},code:{N: '0'},id:{S: primaryKey},isActive:{N: '1'},status:{S: 'activated'}})
							objectArray.push({profileId:pId,name:pName,roles:["bouncers"]})
						}
				}

			}
			return objectArray;

		}


		var checkStringArraysAreIdentical = function(arr1, arr2){
		  if (arr1.length !== arr2.length) return false;
		    for (var i = 0, len = arr1.length; i < len; i++){
		      if (arr1[i].S !== arr2[i].S){
		        return false;
		      }
		  }
		  return true;
		};

		// Process eventActivityParas
		var ProcessEventRecords = function (err , succ) {

			console.log("Inside Process Events");

			var pEventCounter = 0;
			// Process each event
			event.Records.forEach(function(record){

				if (validateRecord(record)){
					// if good record .. do something
					var pList =  buildProfileList(record.dynamodb.NewImage);

					if (record.eventName == 'INSERT') { // New insertion
						totalEventsReceived += pList.length;  // this variable is used to determine when to exit lamda
					  console.log("Total events to process = ", totalEventsReceived);
						for(var cnt=0; cnt < pList.length; cnt++){

							var pRecord = pList[cnt];
							pEventCounter++;
							InsertIntoEventActivityTable(record.dynamodb.NewImage, pRecord, cb);

						}
					} else if (typeof record.dynamodb.OldImage != 'undefined'){
						console.log("In modify record");
						var oldList =  buildProfileList(record.dynamodb.OldImage);
						var profilesToUpdate = new Array();
						// compare new with old
						for (var nCnt =0; nCnt < pList.length; nCnt++){
								var profileRec = {};
								var index = -1;
								for (var oCnt=0; oCnt < oldList.length; oCnt++){
									if (pList[nCnt].profileId == oldList[oCnt].profileId)
									{
										index = 1;
										if (!checkStringArraysAreIdentical(pList[nCnt].roles,oldList[oCnt].roles)){
											console.log("Did not Match  - going for update ", pList[nCnt].name);
											profileRec.status = 'Update';
											profileRec.Data = pList[nCnt];
											profilesToUpdate.push(profileRec);
											console.log("New Image Data: ",pList[nCnt], "New Collection = ", profileRec );
										}
										else {
												console.log ("Matched and breaking", pList[nCnt].name);
										}
										break;
									}
								}
								if (index < 0){
									console.log("Found New", pList[nCnt].name);
									profileRec.status = 'New';
						 			profileRec.Data = pList[nCnt];
									profilesToUpdate.push(profileRec);

								}

							}

								//compare with new
								for (var oCnt =0; oCnt < oldList.length; oCnt++){
										var profileRrec = {};
										var index = -1;
										for (var nCnt=0; nCnt < pList.length; nCnt++){
											if (oldList[oCnt].profileId == pList[nCnt].profileId){
												index = 1;
												break;
											}
										}
										// Profile has been deleted - simply make profile attendee
										if (index < 0){
											console.log("Deleted profile ", oList[oCnt].name);
											profileRec.status = 'Update';
											profileRec.Data.push({profileId:oList[oCnt].profileId,name:oList[oCnt].name,roles:["attendee"]})
											profilesToUpdate.push(profileRec);
										}
								}

								// At this stage we have build the list
								totalEventsReceived += profilesToUpdate.length;
								console.log("Modify profile list = ", profilesToUpdate);
								for(var cnt=0; cnt < profilesToUpdate.length; cnt++){
									var pRecord = profilesToUpdate[cnt];
									pEventCounter++;
									if (pRecord.status == 'New') {
										InsertIntoEventActivityTable(record.dynamodb.NewImage, pRecord.Data, cb);
									}
									else {
										console.log("Update Activity - profileRecord = ", pRecord.Data );
										UpdateEventActivityTable(record.dynamodb.NewImage, pRecord.Data, cb);
									}
								}

					}
				}
			});
			// If no valid events were found we need to exit lamda function
			if (pEventCounter == 0){
				//console.log("No events were processed");
				console.log("No valid events");
				cb(null, "No valid events found");
			}

		}

		ProcessEventRecords();
 	}
}
