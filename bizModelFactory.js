/**
 *业务模型工厂，负责整个项目业务元数据实体的注册、分发功能
 *TODO:待重构，对于没有的业务模型返回空实例。现在返回的是null
 */

define(['angular', './modelSystemModule'], function(angular, modelSystemModule, cons) {
  modelSystemModule.factory("bizModelFactory", ['$injector','aliyunConsoleDefaultModelConfig',
    function($injector,defaultModelConfig) {
      function typeError(msg, type) {
        throw new Error(msg || "the type of param should be" + type || "string");
      }

      function error(msg) {
        throw new Error(msg);
      }
      /**
       * 业务元数据工厂对象
       * @type {Object}
       */
      var bizModelFactory = {
        /**
         * 初始化BizModelFactory
         * @return {[type]} [description]
         */
        init: function() {
          this.bizModels = {};
          var me = this,
            bizTypes = defaultModelConfig.bizTypes;

          angular.forEach(bizTypes, function(item, index) {
            var model = null;
            try{
              model = $injector.get(item + "BizModel");
            }catch(e){

            }
            if (model) {
              me.regist(item, model);
            }
          })
        },
        /**
         * 注册业务元数据
         * @param  {string} bizType  业务元数据唯一标识符
         * @param  {Object} bizModel 业务元数据实体
         * @return {Bool}          是否注册成功
         */
        regist: function(bizType, bizModel) {
          var data = this.bizModels[bizType];
          if (data === undefined) {
            this.bizModels[bizType] = bizModel;
            return true;
          } else {
            error("the bizModel '" + bizType + "' has been registed!");
          }
        },
        /**
         * 获取业务元数据对象
         * @param  {String} bizType 业务类型
         * @return {Object}         业务元数据
         */
        getBizModel: function(bizType) {
          var result = null;
          if (angular.isString(bizType)) {
            return this.bizModels[bizType] || null;
          }
          return result;
        }
      }

      bizModelFactory.init();
      return {
        getBizModel: function(bizType) {
          return bizModelFactory.getBizModel(bizType);
        },
        registBizModel: function(bizType, bizModel) {
          bizModelFactory.regist(bizType, bizModel);
        }
      }
    }
  ]);
})
