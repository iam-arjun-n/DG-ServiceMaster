using com.sap.servicemaster as db from '../db/data';

service ZMDGServiceMaster {

    entity ServiceMasterRequests as projection on db.ServiceMasterRequests;
}