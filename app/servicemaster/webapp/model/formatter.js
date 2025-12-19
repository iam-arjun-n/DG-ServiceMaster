sap.ui.define([], function () {
    "use strict";
    return {
        reqStatus: function (ReqStat) {
            if (!ReqStat) return "Not Defined";

            switch (ReqStat) {
                case "In Approval":
                    return "In Approval";
                case "Rejected":
                    return "Rejected";
                case "Completed":
                    return "Completed";
                default:
                    return "Not Defined";
            }
        },

        getColor: function (ReqStat) {
            if (!ReqStat) return "None";

            switch (ReqStat) {
                case "In Approval":
                    return "Information";
                case "Rejected":
                    return "Error";
                case "Completed":
                    return "Success";
                default:
                    return "None";
            }
        },
        extDate: function (date) {
            if (date) {
                let d = new Date(date);
                if (isNaN(d)) return null;

                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const year = d.getFullYear();

                return `${day}-${month}-${year}`;
            }
            return null;
        },
    }
});