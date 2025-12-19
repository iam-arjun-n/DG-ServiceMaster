sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/mdg/deloitte/approval/model/models",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterType",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter"
], function (UIComponent, Device, models, MessageBox, Fragment, Spreadsheet, JSONModel, FilterType, FilterOperator, Filter) {
    "use strict";

    return UIComponent.extend("com.mdg.deloitte.approval.Component", {
         metadata: {

                manifest: "json"

            },

            /**

             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.

             * @public

             * @override

             */

            init: async function () {

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().initialize();
                this.setModel(models.createDeviceModel(), "device");
                // Set Busy Dialog
                this.busyDialog = new sap.m.BusyDialog();
                this.busyDialog.open();
                await this.setTaskModels();

                this._oBundle = this.getModel("i18n").getResourceBundle();

                const sTaskDef = this.getModel("task").getProperty("/TaskDefinitionName") || "";

                if (sTaskDef.includes("Approval")) {
                    this.getInboxAPI().addAction(
                        {
                            action: "APPROVE",
                            label: "Approve",
                            type: "accept"
                        },
                        function () {
                            if (this.checkComment()) {
                                this.checkTask();
                            }
                        },
                        this
                    );

                    this.getInboxAPI().addAction(
                        {
                            action: "REJECT",
                            label: "Reject",
                            type: "reject"
                        },
                        function () {
                            if (this.checkComment()) {
                                this.rejectTask();
                            }
                        },
                        this
                    );

                    this.getInboxAPI().addAction(
                        {
                            action: "REWORK",
                            label: "Rework"
                        },
                        function () {
                            this.reworkTask();
                        },
                        this
                    );
                }
            },
            setTaskModels: async function () {
                const oComponentData = this.getComponentData();

                if (!oComponentData || !oComponentData.startupParameters) {
                    throw new Error("Startup parameters missing");
                }

                const startupParameters = oComponentData.startupParameters;
                this.setModel(startupParameters.taskModel, "task");

                const sUrl = this._getTaskInstancesBaseURL() + "/context";

                const res = await fetch(sUrl);
                const data = await res.json();

                this.setModel(new sap.ui.model.json.JSONModel(data), "context");
            },
            getInboxAPI: function () {
                var startupParameters = this.getComponentData().startupParameters;
                return startupParameters.inboxAPI;
            },
            _getTaskInstancesBaseURL: function () {
                return (
                    this._getWorkflowRuntimeBaseURL() +
                    "/task-instances/" +
                    this.getTaskInstanceID()
                );
            },
            _getWorkflowRuntimeBaseURL: function () {
                var appId = this.getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);

                return appModulePath + "/bpmworkflowruntime/v1";
            },

            getTaskInstanceID: function () {
                return this.getModel("task").getData().InstanceID;
            },
            reworkTask: function () {
                let that = this;
                MessageBox.warning("Send workitem back to initiator ?", {
                    title: "Rework",
                    emphasizedAction: that._oBundle.getText("confirm_yes"),
                    actions: [that._oBundle.getText("confirm_yes"), MessageBox.Action.CANCEL],
                    onClose: (sAction) => {
                        if (sAction === that._oBundle.getText("confirm_yes")) {
                            that.getModel("context").setProperty("/approved", false);
                            that.getModel("context").setProperty("/rework", true);
                            that._patchTaskInstance("rework");
                            that._refreshTaskList();
                        }
                    }
                });
            },
            checkComment: function () {
                var aComments = this.getModel("commentModel").getData();
                this.getModel("context").setProperty("/commentCollection", aComments);
                let foundNewComment = aComments.find((comment) => {
                    return comment.IsNew === true;
                });
                if (foundNewComment) {
                    return true;
                }
                else {
                    MessageBox.information("To approve / reject, Comments are mandatory !");
                    return false;
                }
            },
            checkTask: function () {
                if (this.getModel("task").getProperty("/TaskDefinitionName") == "Approval") {
                    this.confirmUpdation();
                } else {

                    if (this.getModel("task").getProperty("/TaskDefinitionName").search("Initiator") >= 0) {
                        this.sendTaskData2WFTables('A').then((requestId) => {
                            if (requestId) {
                                this.completeTask(true);
                            }
                            else {
                                MessageBox.error(that._oBundle.getText("err_requestId_updation"));
                            }
                        });
                    }
                }
            },
            sendTaskData2WFTables: async function (Status) {
                this.getRootControl().setBusy(true);
                let requestId = await this.postData2WFTables(Status).catch((oResponse) => {
                    MessageBox.error(that._oBundle.getText("err_requestId"), { details: oResponse });
                    this.getRootControl().setBusy(false);
                });
                this.getRootControl().setBusy(false);
                return requestId;
            },
            postFinalData2MasterInitial: function () {
                that.getModel("context")
                if (that.getModel("context").getData().Type == "Create")
                    return that.postFinalData2Master(that);
                else if (that.getModel("context").getProperty("Type") == "Change")
                    return that.postFinalData2MasterChange(that);
                // else if (that.getModel("context").getProperty("Type") == "Extend")
                //     return that.postFinalData2MasterExtend(that);

            },
            PayloadDataTest: function () {
                var oData = {};
                let CreatedBy = this.currentUser || "defaultUser";
                var serviceCollection = this.getModel("serviceModel").getData().ServiceCollection;
                var arrObj = {};
                if (this.getModel("task").getProperty("/TaskDefinitionName").search("Approval") >= 0 && this.getModel("task").getProperty("/TaskDefinitionName").search("Initiator") < 0) {
                    oData.requestId = this.selectedReqID;
                    oData.workflowStatus = "Completed";
                    oData.type = requestType;
                    oData.serviceMasterItems = [];
                    for (let i = 0; i < serviceCollection?.length; i++) {
                        const convert = (dateStr) => {
                            if (dateStr == null) return "";
                            if (dateStr == undefined) return "";
                            if (dateStr && dateStr != null && JSON.stringify(dateStr) != "null") {
                                const [dd, mm, yyyy] = dateStr.split("-");
                                return `${mm}-${dd}-${yyyy}`;
                            }
                            return "";
                        };
                        arrObj = {};
                        arrObj.ServiceType = serviceCollection[i].ServiceType;
                        arrObj.BaseUnitOfMeasure = serviceCollection[i].BaseUnitOfMeasure;
                        arrObj.ServiceGroup = serviceCollection[i].ServiceGroup;
                        arrObj.Division = serviceCollection[i].Division;
                        arrObj.LongText = serviceCollection[i].LongText;
                        arrObj.UPC = serviceCollection[i].UPC;
                        arrObj.EANCategory = serviceCollection[i].EANCategory;
                        arrObj.ShortTextAllowed = serviceCollection[i].ShortTextAllowed;
                        arrObj.ValuationClass = serviceCollection[i].ValuationClass;
                        arrObj.TaxIndicator = serviceCollection[i].TaxIndicator;
                        arrObj.Formula = serviceCollection[i].Formula;
                        arrObj.Graphic = serviceCollection[i].Graphic;
                        arrObj.SSC = serviceCollection[i].SSC;
                        arrObj.HierarchyServiceNumber = serviceCollection[i].HierarchyServiceNumber;
                        arrObj.Wagetype = serviceCollection[i].Wagetype;
                        arrObj.PurchasingStatus = serviceCollection[i].PurchasingStatus;
                        arrObj.ValidityDate = new Date(convert(serviceCollection[i].ValidityDate));
                        arrObj.Numberator = serviceCollection[i].Numberator;
                        arrObj.Denominator = serviceCollection[i].Denominator;
                        arrObj.SubContractorGroup = serviceCollection[i].SubContractorGroup;
                        arrObj.CoastingModel = serviceCollection[i].CoastingModel;
                        arrObj.UnitOfWork = serviceCollection[i].UnitOfWork;
                        arrObj.TaxTraiffCode = serviceCollection[i].TaxTraiffCode;
                        arrObj.Edition = serviceCollection[i].Edition;


                        arrObj.ServiceDescriptions = [];

                        for (let j = 0; j < serviceCollection[i]?.ServiceDescriptions?.length; j++) {
                            let arrservice_description = {
                                ActivityNumber: serviceCollection[i].ServiceDescriptions[j].ActivityNumber,
                                Description: serviceCollection[i].ServiceDescriptions[j].Description
                                // toBeDeleted: serviceCollection[i].ServiceDescriptions[j].ToBeDeleted,
                                // isNew: serviceCollection[i].serviceDescriptions[j].IsNew
                            }
                            arrObj.ServiceDescriptions.push(arrservice_description);
                        }
                        oData.serviceMasterItems.push(arrObj);

                    }
                }

                console.log(oData);
                return oData;
            },
            postData2WFTables: function (Status) {
                return new Promise((resolve, reject) => {
                    let payload = this.PayloadDataTest(Status);
                    var requestId = this.selectedrequestId;
                    let model = this.getModel("mainServiceModel");

                    model.update(`/ServiceMasterRequests('${requestId}')`, payload, {
                        success: function (rData) {
                            let requestId = rData.requestId;
                            resolve(requestId);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });

            },
            confirmUpdation: function () {
                var sText = "The task will be approved & the Data will be sent to SAP for updation. Do you wish to proceed ?";
                MessageBox.warning(sText, {
                    title: that._oBundle.getText("confirm_title"),
                    emphasizedAction: that._oBundle.getText("confirm_yes"),
                    actions: [that._oBundle.getText("confirm_yes"), MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if (sAction === that._oBundle.getText("confirm_yes")) {
                            if (!that._oBusyDialog) {
                                that._oBusyDialog = new sap.m.BusyDialog({
                                    text: "Processing, please wait..."
                                });
                            }
                            that._oBusyDialog.open();
                            that.postFinalData2MasterInitial().then(function (pdata) {
                                that.sendTaskData2WFTables('C').then((requestId) => {
                                    that.completeTask(true);
                                    that._oBusyDialog.close();
                                });

                            });
                        }
                    }
                });
            },
            completeFinalApprovalTask: function (approvalStatus) {
                this.getModel("context").setProperty("/approved", approvalStatus);
                this.getModel("context").setProperty("/rework", false);
                this._patchTaskInstance("approve");
            },
            postFinalData2Master: function () {
                let that = this;
                return new Promise((resolve, reject) => {
                    var serviceModel = that.getModel("serviceModel");
                    var ServiceCollectiontext = serviceModel.getProperty("/ServiceCollection");
                    var payload = {};
                    let model = this.getModel("masterServiceModel");
                    model.setDeferredGroups(["group1"]);
                    for (let ctr = 0; ctr < ServiceCollectiontext.length; ctr++) {
                        payload = this.PayloadData(ServiceCollectiontext[ctr]);
                        model.create("/ETY_SERVCREATESet", payload, {
                            changeSetId: "ctr",
                            groupId: "group1"
                        });

                        payload = {};
                    }

                    model.submitChanges({
                        groupId: "group1",
                        success: async (rData) => {
                            let finalResultData = [];
                            let finalResultObj = {};
                            let errorRespData = [];
                            var resData = rData.__batchResponses;

                            var reschnageresponses = resData[0].__changeResponses;
                            if (reschnageresponses == undefined) {
                                finalResultObj.Status = "Error";
                                finalResultObj.ErrorMessage = resData[0].message;
                                finalResultObj.ErrorStatusCode = resData[0].response.statusCode;
                                finalResultObj.ErrorStatusText = resData[0].response.statusText;
                                finalResultObj.ErrorBody = resData[0].response.body;

                                MessageBox.error(resData[0].response.body);
                                that._oBusyDialog.close();
                                return;
                            }
                            else {
                                var sBOM = "";
                                finalResultObj.Status = "Success";
                                var sServiceCollection = that.getModel("serviceModel").getData().ServiceCollection;
                                for (let i = 0; i < reschnageresponses.length; i++) {
                                    sServiceCollection[i].AlternativeBOM = reschnageresponses[i].data.BillOfMaterialVariant;
                                    if (sBOM === "") {
                                        sBOM = reschnageresponses[i].data.BillOfMaterial;
                                    }
                                    else {
                                        sBOM = sBOM + "," + reschnageresponses[i].data.BillOfMaterial;
                                    }


                                    finalResultObj.RequestId = that.selectedrequestId;
                                    finalResultData.push(finalResultObj);
                                    finalResultObj = {};
                                    errorRespData = [];
                                }
                            }


                            var oResultModel = new JSONModel();
                            oResultModel.setData(finalResultData);
                            that.setModel(oResultModel, "resultModel");
                            if (resData.length != 0) {
                                that.showSuccessMessage(sBOM);
                                that.getModel("serviceModel").setProperty("/BOMID", sBOM);
                            }
                            else {
                                MessageBox.information("No Result to display !");
                            }
                            resolve(finalResultData);

                        },
                        error: (err) => {
                            MessageBox.error(err);
                            reject(err);
                        }
                    });
                });
            },

            showSuccessMessage: function (requestId) {
                var that = this;
                MessageBox.success("Service Number created successfully: " + requestId, {
                    onClose: function () {


                    }
                });
            },
        getBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replace(/\./g, "/");
            var appModulePath = sap.ui.require.toUrl(appPath);
            return appModulePath;
        },
        });
    });