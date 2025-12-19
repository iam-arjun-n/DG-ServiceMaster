{
	"contents": {
		"be9db490-729a-4cdc-8593-6dc751ca6594": {
			"classDefinition": "com.sap.bpm.wfs.Model",
			"id": "servicemasterapproval.workflowservicemaster",
			"subject": "workflowservicemaster",
			"businessKey": "${context.reqId}",
			"name": "workflowservicemaster",
			"documentation": "",
			"lastIds": "62d7f4ed-4063-4c44-af8b-39050bd44926",
			"events": {
				"11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3": {
					"name": "StartEvent1"
				},
				"2798f4e7-bc42-4fad-a248-159095a2f40a": {
					"name": "EndEvent1"
				}
			},
			"activities": {
				"0261372e-b54b-4b6a-aa1e-d39dd043df3a": {
					"name": "Approval"
				}
			},
			"sequenceFlows": {
				"8aaaec62-93cd-4efb-8c8a-8cb64e68971e": {
					"name": "SequenceFlow2"
				},
				"7b8906c2-4623-4508-b03b-46bc070e33f1": {
					"name": "SequenceFlow3"
				}
			},
			"diagrams": {
				"42fa7a2d-c526-4a02-b3ba-49b5168ba644": {}
			}
		},
		"11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3": {
			"classDefinition": "com.sap.bpm.wfs.StartEvent",
			"id": "startevent1",
			"name": "StartEvent1"
		},
		"2798f4e7-bc42-4fad-a248-159095a2f40a": {
			"classDefinition": "com.sap.bpm.wfs.EndEvent",
			"id": "endevent1",
			"name": "EndEvent1"
		},
		"0261372e-b54b-4b6a-aa1e-d39dd043df3a": {
			"classDefinition": "com.sap.bpm.wfs.UserTask",
			"subject": "${context.reqId} - Service Master Approval",
			"priority": "MEDIUM",
			"isHiddenInLogForParticipant": false,
			"supportsForward": true,
			"userInterface": "sapui5://fa369bc9-4c2e-4cb8-87af-ff6998197ea4.MDGServiceMaster.commdgdeloitteapproval/com.mdg.deloitte.approval",
			"recipientGroups": "ServiceMaster_Approver",
			"id": "usertask1",
			"name": "Approval"
		},
		"8aaaec62-93cd-4efb-8c8a-8cb64e68971e": {
			"classDefinition": "com.sap.bpm.wfs.SequenceFlow",
			"id": "sequenceflow2",
			"name": "SequenceFlow2",
			"sourceRef": "11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3",
			"targetRef": "0261372e-b54b-4b6a-aa1e-d39dd043df3a"
		},
		"7b8906c2-4623-4508-b03b-46bc070e33f1": {
			"classDefinition": "com.sap.bpm.wfs.SequenceFlow",
			"id": "sequenceflow3",
			"name": "SequenceFlow3",
			"sourceRef": "0261372e-b54b-4b6a-aa1e-d39dd043df3a",
			"targetRef": "2798f4e7-bc42-4fad-a248-159095a2f40a"
		},
		"42fa7a2d-c526-4a02-b3ba-49b5168ba644": {
			"classDefinition": "com.sap.bpm.wfs.ui.Diagram",
			"symbols": {
				"df898b52-91e1-4778-baad-2ad9a261d30e": {},
				"53e54950-7757-4161-82c9-afa7e86cff2c": {},
				"61f3c69d-325a-4fa2-a8a2-96387b2094df": {},
				"6633c163-3c15-4cb3-b1eb-034e4feeb66f": {},
				"0618565c-ff59-4594-b453-5c4d5655c439": {}
			}
		},
		"df898b52-91e1-4778-baad-2ad9a261d30e": {
			"classDefinition": "com.sap.bpm.wfs.ui.StartEventSymbol",
			"x": 100,
			"y": 100,
			"width": 32,
			"height": 32,
			"object": "11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3"
		},
		"53e54950-7757-4161-82c9-afa7e86cff2c": {
			"classDefinition": "com.sap.bpm.wfs.ui.EndEventSymbol",
			"x": 212,
			"y": 434,
			"width": 35,
			"height": 35,
			"object": "2798f4e7-bc42-4fad-a248-159095a2f40a"
		},
		"61f3c69d-325a-4fa2-a8a2-96387b2094df": {
			"classDefinition": "com.sap.bpm.wfs.ui.UserTaskSymbol",
			"x": 186,
			"y": 238,
			"width": 100,
			"height": 60,
			"object": "0261372e-b54b-4b6a-aa1e-d39dd043df3a"
		},
		"6633c163-3c15-4cb3-b1eb-034e4feeb66f": {
			"classDefinition": "com.sap.bpm.wfs.ui.SequenceFlowSymbol",
			"points": "117,126 236,126 236,238.5",
			"sourceSymbol": "df898b52-91e1-4778-baad-2ad9a261d30e",
			"targetSymbol": "61f3c69d-325a-4fa2-a8a2-96387b2094df",
			"object": "8aaaec62-93cd-4efb-8c8a-8cb64e68971e"
		},
		"0618565c-ff59-4594-b453-5c4d5655c439": {
			"classDefinition": "com.sap.bpm.wfs.ui.SequenceFlowSymbol",
			"points": "232.75,297.5 232.75,434.5",
			"sourceSymbol": "61f3c69d-325a-4fa2-a8a2-96387b2094df",
			"targetSymbol": "53e54950-7757-4161-82c9-afa7e86cff2c",
			"object": "7b8906c2-4623-4508-b03b-46bc070e33f1"
		},
		"62d7f4ed-4063-4c44-af8b-39050bd44926": {
			"classDefinition": "com.sap.bpm.wfs.LastIDs",
			"sequenceflow": 3,
			"startevent": 1,
			"endevent": 1,
			"usertask": 1
		}
	}
}