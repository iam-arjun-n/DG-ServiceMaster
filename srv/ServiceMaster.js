const cds = require("@sap/cds");
const SequenceHelper = require("./lib/SequenceHelper");

class ZMDGServiceMaster extends cds.ApplicationService {
  async init() {
    const db = await cds.connect.to("db");
    const { ServiceMasterRequests } = this.entities;

    this.before("CREATE", ServiceMasterRequests, async (req) => {

      let requestIdSequence = new SequenceHelper({
        db: db,
        table: "COM_SAP_SERVICEMASTER_SERVICEMASTERREQUESTS",
        field: "REQUESTID"
      });

      // prefix
      let prefix = "SRV";
      if (req.data.type === "Change") prefix = "CRQ";
      else if (req.data.type === "Extend") prefix = "EXQ";

      // get next number
      const nextNumber = await requestIdSequence.getNextNumber();

      // zero-padding
      const zeroPad = String(nextNumber).padStart(7, "0");

      req.data.requestIdSequence = nextNumber;
      req.data.requestId = `${prefix}${zeroPad}`;
    });

    return super.init();
  }
}

module.exports = ZMDGServiceMaster;
