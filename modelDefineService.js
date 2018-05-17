/**
 * 业务模型元数据定义服务，负责提供统一的业务模型元数据定义接口
 */

define(['angular', './modelSystemModule', '../services/i18nService'], function(angular, modelSystemModule, i18nService) {
  !angular.emptyFunction && (angular.emptyFunction = function() {});
  var i18n = i18nService.getI18n('modelSystem.inlineCommand');

  function extendDeep(parent, child) {
    var i,
      toStr = Object.prototype.toString,
      astr = "[object Array]";
    child = child || {};
    for (i in parent) {
      if (parent.hasOwnProperty(i)) {
        if (typeof parent[i] === "object") {
          child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
          extendDeep(parent[i], child[i]);
        } else {
          child[i] = parent[i];
        }
      }
    }
    return child;
  }
  modelSystemModule.factory("modelDefineService", ['$injector',
    function($injector) {
      function typeError(msg, type) {
        throw new Error(msg || "the type of param should be" + type || "string");
      }

      function error(msg) {
        throw new Error(msg);
      }
      //(bizType, bizName, bizService, bizActions, extraData)
      function BizModel(config) {
        var defaultModel = {
          bizType: "default",
          bizName: "默认业务",
          bizService: "defaultService",
          bizActions: {
            defaultAction: new BizAction("default", {})
          },
          extraData: {}
        }
        angular.extend(this, defaultModel, config);
      }

      BizModel.prototype.getActionModel = function(actionName) {
        return this.bizActions[actionName] || (console.log("error: no action named '" + actionName + "' in the bizModel '" + this.bizName + "', return default empty bizAction instead") && new BizAction());
      }

      BizModel.prototype.registAction = function(actionName, actionModel) {
        !this.bizActions && (this.bizActions = {});
        !this.bizActions[actionName] ? (this.bizActions[actionName] = actionModel) : error("action '" + actionName + "' has been registed in the bizModel");
      }

      BizModel.prototype.makeRequest = function(actionModel, $scope, responsePreHandler, options, callback) {

        var options = options || {
          params: {}
        };

        var params = actionModel.getActionParam($scope);
        options.params = angular.extend(options.params, params);

        //如果显示定义了隐藏默认错误弹框信息，则使用actionModel中的配置；如果没有显示定义，则判断是否定义了responseHandler,如果定义了，则隐藏，如果没有定义，则显示
        var hideDefaultErroDialog = actionModel.hideDefaultErroDialog !== undefined ? actionModel.hideDefaultErroDialog : (actionModel.responseHandler ? true : false);
        var responseHandler = actionModel.responseHandler != angular.emptyFunction ? actionModel.responseHandler : responsePreHandler.responsePreHandler;

        this.bizService[actionModel.handler](options).then(function(result) {
          var response = responseHandler(result, $injector, true);
          if (response && angular.isFunction(response.then) == false) {
            response = actionModel.afterActionExecuted($scope, response) || response;
            angular.isFunction(callback) && callback(response);
          }
        });
      }

      /**
       * 定义业务元数据
       * @param  {String} bizType    业务类型，可以理解为标示业务唯一度的ID
       * @param  {String} bizName    业务名称，会在界面显示相关信息的地方用到
       * @param  {String} bizService 业务服务名称，会被映射为对应的服务实例
       * @param  {Object} bizActions 业务操作集合
       * @param  {Object} extraData  其他模型需要的数据
       * @return {Object}            业务元数据
       */
      function defineBizModel(bizType, bizName, bizService, bizActions, extraData) {
        (!angular.isString(bizType) || !angular.isString(bizName) || !angular.isString(bizService)) && typeError();
        try {
          bizService = $injector.get(bizService);
        } catch (e) {
          console.error('bizService :"' + bizService + '"不存在，检查你的业务模型 [' + bizType + '] 对应的代码，查看 modelDefineService 函数第三个参数是否为已有的Angular Service 名称');
          throw new Error(e);
        }!angular.isObject(bizService) && typeError("service of the biz '" + bizType + "' should return an object");

        function actionDef(bizName, options) {
          var actionInstances = {}
          if (options) {
            for (var action in options) {
              if (options.hasOwnProperty(action)) {
                actionInstances[action] = new BizAction(bizName, options[action]);
              }
            }
          }
          return actionInstances;
        }
        return new BizModel({
          bizType: bizType,
          bizName: bizName,
          bizService: bizService,
          bizActions: actionDef(bizName, bizActions),
          extraData: extraData
        });
      }

      /**
       * 定义业务操作元数据
       * @param  {Object} options 业务操作相关的配置项
       * @return {Object}         业务操作元数据
       */

      function BizAction(bizName, options) {
        this.bizName = bizName || "默认业务";
        angular.extend(this, options);
      }

      BizAction.prototype = {
        constructor: BizAction,
        /**
         * 定义业务操作获取请求参数的通用函数
         * @param  {Object} scope 执行业务操作时所在的作用域
         * @return {Object}       请求参数
         */
        getActionParam: function(scope) {},
        /**
         * 获取业务操作确认信息的通用函数
         * @param  {Object} instanceItem 某条业务数据
         * @return {String}              执行业务操作的确认提示信息
         */
        getConfirmMsg: function(instanceItem, scope) {
          var message = i18n.formatter(i18n.localMessage.actionConfirm, instanceItem ? (this.name + (i18nService.getLangKey() == 'zh' ? '' : ' ') + this.bizName + ': ' + (instanceItem[scope.keyField] ? instanceItem[scope.keyField] : (instanceItem.instanceId || instanceItem.name || instanceItem.id || ""))) : this.name);
          return message;
        },
        /**
         * 获取业务操作结果信息
         * @param  {Object} result 服务器端返回的数据
         * @return {any}        格式化后的消息
         */
        getActionResultMsg: function(result) {
          return result.message || "";
        },
        /**
         * * 控制器注入器，用来将需要的数据注入到Action执行的scope中
         * @param  {Object} exports scope对外暴露的属性，最好将所有需要的字段都注册到这个暴露在外的属性上
         * @param  {Object} scope   scope对象
         * @return {[type]}         [description]
         */
        injectController: function(exports, scope) {

        },
        setProperty: function(name, value) {
          if (name) {
            this[name] = value;
          }
        },
        afterActionExecuted: angular.emptyFunction,
        responseHandler: angular.emptyFunction,
        hideDefaultErroDialog: undefined
      }

      function ToolbarModel(bizName, model) {
        this.bizName = bizName || "defaultToolBarModel";
        var defaultToolBarModel = {
          template: "",
          templateUrl: "",
          prepareDataForTemplate: function(toolBarModel, rawData, scope) {

          },
          actions: {
            DEFAULT: new ToolbarAction("defaultToolBarModel")
          },
          status: {
            normal: ["DEFAULT"]
          }
        }
        angular.extend(this, model);
      }

      ToolbarModel.prototype = {
        constructor: ToolbarModel,
        registAction: function(actionId, action, overWrite) {
          if (overWrite === true) {
            this.actions[actionId] = action;
            return this;
          }
          var act = this.actions[actionId];
          if (!act) {
            this.actions[actionId] = action;
            return this;
          } else {
            throw new Error("toolbarAction '" + action.getName() + "' has registed");
          }
        },
        _getActionByName: function(name) {
          var act = this.actions[name],
            result = extendDeep(act, {});
          if (!(result instanceof ToolbarAction)) {
            result = new ToolbarAction("", result);
          }
          return result || null;
        },
        getActionListByBizStatus: function(status) {
          var me = this;
          /**
           * 通过按钮名称获取按钮
           * @param  {Array} actions 按钮名称集合
           * @return {Array}         按钮名称对应的按钮集合
           */
          function getAcitonsByName(actions, currentStatus) {
            var collection = [];
            if (angular.isArray(actions)) {
              for (var i = 0, act = null, actName = null; actName = actions[i]; i++) {
                if (typeof(actName) === "string") {
                  actName = actName.split(":");
                  actStatus = (actName[1] || "").toLowerCase();
                  actName = actName[0];
                  act = me._getActionByName(actName);
                  act.setBizStatus(currentStatus);
                  act.setActionStatus(actStatus, actStatus, true);
                } else if (typeof(actName) === "object") {
                  act = actName;
                  if (!(act instanceof ToolbarAction)) {
                    act = new ToolbarAction("", act);
                  }
                  act.setBizStatus(currentStatus);
                }
                actionType = act.getType();
                if (actionType === "menu") {
                  //如果是菜单类型的按钮，则递归获取其children属性中定义的子按钮
                  if (angular.isArray(act.children)) {
                    act.children = getAcitonsByName(act.children);
                  }
                }

                collection.push(act);
              }
            }
            return collection;
          }
          var result = [],
            actionType = '',
            actStatus = '',
            actionNamesOfStatus = [];

          //如果没有传递业务状态，则获取全部的操作按钮模型
          if (!status) {
            var actions = this.actions;
            for (var actName in actions) {
              if (actions.hasOwnProperty(actName)) {
                actionNamesOfStatus.push(actName);
              }
            }
          } else {
            actionNamesOfStatus = this.status[status];
          }
          result = getAcitonsByName(actionNamesOfStatus, status);
          return result;
        },
        getModelBizStatus: function(exports, scope) {
          return "";
        },
        setActionListByBizStatus: function(status, actionNames) {
          if (angular.isString(status) && angular.isArray(actionNames)) {
            this.status[status] = actionNames;
          }
        },
        setActionListOfBizStatusByRawData: function(rawData, actions) {

        },
        getActionSeparator: function() {
          return '<span class=\"text-explode\">|</span> '
        },
        config: function() {

        }
      }

      function ToolbarAction(bizName, options) {
        this.bizName = bizName;
        var defaultOptions = {
          action: "defaultToolBarAction",
          type: "command", //stateLink, urlLink, menu
          text: "默认工具栏按钮",
          actionClass: "",
          bizStatus: "any", //用来获取statusTip使用的，其他地方都禁止使用。
          disabledTip: {
            any: "按钮处于any状态"
          },
          showTip: false,
          tip: "",
          attrs: {
            key: "value"
          },
          rawData: null
        };
        !options && (options = defaultOptions);
        angular.extend(this, options);
        this.rawData = {};
        this.attrs = this.attrs || {};
        this.disabledTip = this.disabledTip || {};
      }
      ToolbarAction.prototype = {
        constructor: ToolbarAction,
        render: function(rawData) {
          return "";
        },
        getAction: function() {
          return this.action || "";
        },
        getType: function() {
          return this.type || "";
        },
        getText: function() {
          return this.text || "";
        },
        getSpmId: function() {
          return this.spmId || "";
        },
        getBizStatus: function() {
          return this.bizStatus || "";
        },
        setBizStatus: function(status) {
          this.bizStatus = status;
        },
        getBizStatusTip: function() {
          return this.disabledTip[this.getBizStatus()] || "";
        },
        getAttrs: function() {
          return this.attrs || {};
        },
        getClass: function() {
          //todo:这里需要做成可配置的
          return this.actionClass || "btn btn-link btn-xs";
        },
        setActionStatus: function(status, statusKey, statusValue) {
          if (status === "disabled") {
            this.showTip = true;
          } else {
            this.showTip = false;
          }
          this.tip = status == '' ? "" : this.getBizStatusTip() || "";
          status != '' && (this.attrs[statusKey] = statusValue, this.attrs['data-ng-' + statusKey] = statusValue);
        },
        setRawData: function(rawData) {
          this.rawData = rawData;
        },
        getRawDataValue: function(key) {
          var result = this.rawData[key] || "";
          return result;
        }
      }

      function BizComponentModel(options) {
        var defaultOptions = {
          id: "",
          title: "测试1",
          titleClass: "",
          componentClass: '',
          componentBodyClass: "",
          componentType: "",
          toolbar: "",
          bizType: "",
          bizAction: "",
          modelType: "",
          attributes: {

          },
          toolbarPosition: "right",
          toolbarClass: "",
          selfRefresh: false,
          intervel: 3000
        };
        !options && (options = defaultOptions);
        angular.extend(this, options);
        this.modelType = this.modelType ? this.modelType : this.bizType;
      }
      BizComponentModel.prototype = {
        constructor: BizComponentModel,
        getId: function() {
          return this.id || "";
        },
        getHeaderClass: function() {
          return this.headerClass || "";
        },
        getClass: function() {
          return this.componentClass || "";
        },
        getToolbarClass: function() {
          return this.toolbarClass || "";
        },
        getToolbarPosition: function() {
          return this.toolbarPosition || "right";
        },
        getTitleClass: function() {
          return this.titleClass || "";
        },
        getTitle: function() {
          return this.title || "";
        },
        getComponentBodyClass: function() {
          return this.componentBodyClass || "";
        },
        getType: function() {
          return this.componentType || "";
        },
        getBizType: function() {
          return this.bizType || "";
        },
        getBizAction: function() {
          return this.bizAction || "";
        },
        getModelType: function() {
          return this.modelType || ""
        },
        refresh: function() {

        },
        setBizModel: function(bizModel) {
          this.bizModel = bizModel;
        },
        getBizModel: function() {
          return this.bizModel || undefined;
        }
      }

      function ChartComponentModel() {

      }
      ChartComponentModel.prototype = {
        refresh: function(returnFn) {

        }
      }

      return {
        defBizModel: defineBizModel,
        defBizAction: function(bizName, actionOption) {
          return new BizAction(bizName, actionOption);
        },
        defToolbarModel: function(bizName, model) {
          return new ToolbarModel(bizName, model);
        },
        defToolbarAction: function(bizName, actionOption) {
          return new ToolbarAction(bizName, actionOption);
        },
        defBizComponentModel: function(bizComponentModel) {
          return new BizComponentModel(bizComponentModel);
        }
      }
    }
  ]);
})
