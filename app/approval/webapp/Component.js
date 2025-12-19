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
    var that;
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
            that = this;
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
            try {
                this.getRootControl().setBusy(true);
                let requestId = await this.postData2WFTables(Status);
                return requestId;
            } catch (oResponse) {
                MessageBox.error(this._oBundle.getText("err_requestId"), {
                    details: oResponse
                });
            } finally {
                this.getRootControl().setBusy(false);
            }
        },
        postFinalData2MasterInitial: function () {
            let oContextModel = this.getModel("context");

            if (oContextModel.getProperty("/Type") === "Create") {
                return this.postFinalData2Master();
            } else if (oContextModel.getProperty("/Type") === "Change") {
                return this.postFinalData2MasterChange();
            }
        },
        PayloadDataTest: function (Status) {
            let oData = {};
            let serviceCollection = this.getModel("serviceModel").getData().ServiceCollection || [];

            if (
                this.getModel("task").getProperty("/TaskDefinitionName").includes("Approval") &&
                !this.getModel("task").getProperty("/TaskDefinitionName").includes("Initiator")
            ) {
                oData.requestId = this.selectedReqID;
                oData.workflowStatus = "Completed";
                oData.type = this.requestType;
                oData.serviceMasterItems = [];

                for (let i = 0; i < serviceCollection.length; i++) {

                    let arrObj = {
                        ServiceType: serviceCollection[i].ServiceType,
                        BaseUnitOfMeasure: serviceCollection[i].BaseUnitOfMeasure,
                        ServiceGroup: serviceCollection[i].ServiceGroup,
                        Division: serviceCollection[i].Division,
                        LongText: serviceCollection[i].LongText,
                        UPC: serviceCollection[i].UPC,
                        EANCategory: serviceCollection[i].EANCategory,
                        ShortTextAllowed: serviceCollection[i].ShortTextAllowed,
                        ValuationClass: serviceCollection[i].ValuationClass,
                        TaxIndicator: serviceCollection[i].TaxIndicator,
                        Formula: serviceCollection[i].Formula,
                        Graphic: serviceCollection[i].Graphic,
                        SSC: serviceCollection[i].SSC,
                        HierarchyServiceNumber: serviceCollection[i].HierarchyServiceNumber,
                        Wagetype: serviceCollection[i].Wagetype,
                        PurchasingStatus: serviceCollection[i].PurchasingStatus,
                        ValidityDate: serviceCollection[i].ValidityDate || null,
                        Numberator: serviceCollection[i].Numberator,
                        Denominator: serviceCollection[i].Denominator,
                        SubContractorGroup: serviceCollection[i].SubContractorGroup,
                        CoastingModel: serviceCollection[i].CoastingModel,
                        UnitOfWork: serviceCollection[i].UnitOfWork,
                        TaxTraiffCode: serviceCollection[i].TaxTraiffCode,
                        Edition: serviceCollection[i].Edition,
                        ServiceDescriptions: []
                    };
                    let oDescResults =
                        serviceCollection[i].ServiceDescriptions?.results || [];

                    for (let j = 0; j < oDescResults.length; j++) {
                        arrObj.ServiceDescriptions.push({
                            ActivityNumber: oDescResults[j].ActivityNumber,
                            Description: oDescResults[j].Description
                        });
                    }

                    oData.serviceMasterItems.push(arrObj);
                }
            }

            return oData;
        },
        postData2WFTables: function (Status) {
            return new Promise((resolve, reject) => {
                let payload = this.PayloadDataTest(Status);
                let requestId = this.selectedrequestId;
                let model = this.getModel("mainServiceModel");

                model.update(`/ServiceMasterRequests('${requestId}')`, payload, {
                    success: function (rData) {
                        resolve(rData.requestId);
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
                            that.sendTaskData2WFTables("C").then(() => {
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
        PayloadData: function (oItem) {
            return {
                Service: "",
                MatlGroup: oItem.ServiceGroup || "",
                BaseUom: oItem.BaseUnitOfMeasure || "",
                ServCat: oItem.ServiceCategory || "",
                MasterLangu: "E",
                ShortText: oItem.ShortText || oItem.ServiceType || "",
                Language: "E",
                ChangeId: "I",
                Longtext: oItem.LongText || "",
                TaxTariffCode: oItem.TaxTraiffCode || ""
            };
        },
        postFinalData2Master: function () {
            let that = this;

            return new Promise((resolve, reject) => {

                var serviceModel = that.getModel("serviceModel");
                var ServiceCollectiontext = serviceModel.getProperty("/ServiceCollection");

                let payload = {};
                let model = that.getModel("masterServiceModel");
                model.setDeferredGroups(["group1"]);

                for (let ctr = 0; ctr < ServiceCollectiontext.length; ctr++) {
                    payload = that.PayloadData(ServiceCollectiontext[ctr]);

                    model.create("/ETY_SERVCREATESet", payload, {
                        groupId: "group1",
                        changeSetId: "ctr"
                    });

                    payload = {};
                }
                model.submitChanges({
                    groupId: "group1",

                    success: function (rData) {

                        let finalResultData = [];
                        let finalResultObj = {};

                        var resData = rData.__batchResponses;
                        var resChangeResponses = resData[0].__changeResponses;
                        if (!resChangeResponses) {
                            MessageBox.error(resData[0].response.body);
                            that._oBusyDialog.close();
                            return;
                        }

                        let sActivityNumber = "";
                        var sServiceCollection =
                            that.getModel("serviceModel").getData().ServiceCollection;
                        for (let i = 0; i < resChangeResponses.length; i++) {

                            let sServiceNumber = resChangeResponses[i].data.Service; 
                            if (!sServiceCollection[i].ServiceDescriptions) {
                                sServiceCollection[i].ServiceDescriptions = { results: [] };
                            }

                            if (sServiceCollection[i].ServiceDescriptions.results.length === 0) {
                                sServiceCollection[i].ServiceDescriptions.results.push({
                                    ActivityNumber: sServiceNumber,
                                    Description: sServiceCollection[i].LongText || ""
                                });
                            } else {
                                sServiceCollection[i].ServiceDescriptions.results[0].ActivityNumber =
                                    sServiceNumber;
                            }
                            if (sActivityNumber === "") {
                                sActivityNumber = sServiceNumber;
                            } else {
                                sActivityNumber += "," + sServiceNumber;
                            }

                            finalResultObj.Status = "Success";
                            finalResultObj.RequestId = that.selectedrequestId;
                            finalResultData.push(finalResultObj);
                            finalResultObj = {};
                        }
                        var oResultModel = new JSONModel();
                        oResultModel.setData(finalResultData);
                        that.setModel(oResultModel, "resultModel");
                        if (sActivityNumber) {
                            that.showSuccessMessage(sActivityNumber);
                        } else {
                            MessageBox.information("No Activity Number returned!");
                        }

                        resolve(finalResultData);
                    },

                    error: function (err) {
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
        completeTask: function (approvalStatus) {
            var that = this;
            this.getModel("context").setProperty("/approved", approvalStatus);
            this._patchTaskInstance(approvalStatus === "approve" ? "approve" : "reject")
                .then(function () {
                    that._refreshTaskList();
                })
                .catch(function () {
                });
        },
        _patchTaskInstance: function (status) {
            let comments = this.getModel("commentModel").getData();
            this.getModel("context").setProperty("/Comment", comments);
            var data = {
                status: "COMPLETED",
                decision: status,
                context: this.getModel("context").getData(),
            };
            that.getRootControl().setBusy(true);
            jQuery.ajax({
                url: this._getTaskInstancesBaseURL(),
                method: "PATCH",
                contentType: "application/json",
                async: false,
                data: JSON.stringify(data),
                headers: {
                    "X-CSRF-Token": this._fetchToken(),
                },
                success: function (result, xhr, data) {
                    that.getRootControl().setBusy(false);
                },
                error: function (request, status, error) {
                    that.getRootControl().setBusy(false);
                }
            });
        },
        _fetchToken: function () {
            var fetchedToken;

            jQuery.ajax({
                url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
                method: "GET",
                async: false,
                headers: {
                    "X-CSRF-Token": "Fetch",
                },
                success(result, xhr, data) {
                    fetchedToken = data.getResponseHeader("X-CSRF-Token");
                },
            });
            return fetchedToken;
        },

        _refreshTaskList: function () {
            var oInboxAPI = this.getInboxAPI();

            if (oInboxAPI && oInboxAPI.refreshTaskList) {
                oInboxAPI.refreshTaskList(); 
            }
        },

        getBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replace(/\./g, "/");
            var appModulePath = sap.ui.require.toUrl(appPath);
            return appModulePath;
        },
    });
});