/**
 * 模型工厂，负责初始化整个项目中用到的各个模型
 */
define(['angular', './modelSystemModule', './moduleManager', './lazyModule'], function(angular, modelSystemModule, ModuleManager, lazyModule) {
  var runTimeModelTypes = [],
    runTimeBizTypes = [],
    moduleManger = ModuleManager.getInstance();

  /**
   * 模型注册器
   */
  function ModelRegister() {
    this.constructors = {
      BizModel: new BizModelRegister(),
      BizActionModel: new BizModelRegister(),
      CommandModel: new BizModelRegister(),
      StepModel: new BizModelRegister(),
      BuySubtotalModel: new BizModelRegister(),
      BuyCartModel: new BizModelRegister(),
      BuyFrameworkModel: new BizModelRegister(),
      GridModel: new NormalModelRegister(),
      ToolbarModel: new NormalModelRegister(),
      BizModuleModel: new ModuleModelRegister()
    }
    this.regist = function() {}
  }
  ModelRegister.prototype.factory = function(type) {
    return this.constructors[type] || new NormalModelRegister();
  }

  ModelRegister.registBizType = function(bizType) {
    var exist = runTimeBizTypes[bizType];
    if (exist < 0 || exist === undefined) {
      runTimeBizTypes[bizType] = runTimeBizTypes.length;
      runTimeBizTypes.push(bizType);
    }
  }

  ModelRegister.registModelType = function(modelType) {
    var exist = runTimeModelTypes[modelType];
    if (exist < 0 || exist === undefined) {
      runTimeModelTypes[modelType] = runTimeModelTypes.length;
      runTimeModelTypes.push(modelType);
    }
  }

  /**
   * 普通模型注册器
   */
  function NormalModelRegister() {}
  NormalModelRegister.prototype.regist = function(bizType, modelType, model) {
    var modelName = bizType + modelType;
    modelSystemModule.provider(modelName, function() {
      this.model = model;
      this.$get = function() {
          return this.model;
        }
        //这里是影响全局的
      this.setModel = function(fieldName, value) {
        var setModelFn = function(model, fieldName, value) {
          model[fieldName] = value;
          return model;
        }
        if (angular.isFunction(fieldName) && arguments.length == 1) {
          setModelFn = fieldName;
        }
        this.model = setModelFn(this.model, fieldName, value);
      }
    });
  }

  /**
   * 业务模型注册器
   */
  function BizModelRegister() {}
  BizModelRegister.prototype.regist = function(bizType, modelType, model) {
    var modelName = bizType + modelType;
    modelSystemModule.factory(modelName, model);
  }

  function ModuleModelRegister() {

  }

  ModuleModelRegister.prototype.regist = function(modelId, modelType, model) {
    var moduleManger = ModuleManager.getInstance(),
      bizModule = moduleManger.registModule(modelId, model),
      modelName = modelId + modelType;
    modelSystemModule.provider(modelName, function() {
      this.model = bizModule;
      this.$get = function() {
        return this.model;
      }
    });
  }

  modelSystemModule.factory("modelFactory", ['$injector', 'aliyunConsoleDefaultModelConfig',
    function($injector, defaultModels) {
      var models = {
        bootStrap: function() {

        },
        init: function() {
          this.models = {};
          var me = this,
            bizTypes = defaultModels.bizTypes.concat(runTimeBizTypes),
            modelTypes = defaultModels.modelTypes.concat(runTimeModelTypes);

          angular.forEach(bizTypes, function(item, index) {
            for (var i = 0, modelType = null; modelType = modelTypes[i]; i++) {
              !me[modelType] && (me[modelType] = {
                models: {}
              })
              var model = '';
              try {
                model = $injector.get(item + modelType);
              } catch (e) {

                model = null;
                console.error(e);
              }
              if (model) {
                me[modelType].models[item] = model;
              }
            }
          })
        },
        regist: function(bizType, modelType, model) {
          if (this.getModel(bizType, modelType) == null) {
            this[modelType].models[bizType] = model;
          }
          return model;
        },
        getModel: function(bizType, modelType) {
          var result = null;
          if (angular.isString(bizType) && angular.isString(modelType)) {
            !this[modelType] && (this[modelType] = {
              models: {}
            });
            result = this[modelType].models[bizType];
            if (result === null || result === undefined) {
              try {
                result = $injector.get(bizType + modelType);
                this[modelType].models[bizType] = result;
              } catch (e) {
                result = null;
                console.error(e);
                console.error('moselSystem:modelFactory:get model "' + bizType + '" which type is "' + modelType + '" failed. check your code.')
              }
            }
            if (result === null) {
              result = defaultModels[modelType];
            }
          }
          // (result === undefined || result === null) && console.log("类型为" + modelType + "的模型: '" + bizType + "' 加载失败，检查是否将模型文件引入了项目中")
          return angular.copy(result);
        },
        setModel: function(bizType, modelType) {
          // var setModelFn = function (model, fieldName, value) {
          //   model[fieldName]  = value;
          //   return model;
          // }
          // if(angular.isFunction(fieldName) && arguments.length ==1){
          //   setModelFn = fieldName;
          // }
          // this.gridModel = setModelFn(this.gridModel, fieldName, value);
        }
      };
      // models.init();
      return {
        getModel: function(bizType, modelType) {
          return models.getModel(bizType, modelType);
        },
        getModels: function(bizTypes, modelType) {
          var result = [];
          if (angular.isArray(bizTypes)) {
            for (var i = 0, bizType = ""; bizType = bizTypes[i]; i++) {
              result.push(models.getModel(bizType, modelType));
            }
          }
          return result;
        },
        setModel: function(bizType, modelType) {
          var args = Array.prototype.slice.call(arguments, 0);
          return models.setModel.apply(models, args);
        },
        regist: function(bizType, modelType) {
          return models.regist(bizType, modelType);
        }
      }
    }
  ]);
  var registorFactory = new ModelRegister();
  return {
    regist: function(bizType, modelType, model) {
      //判断当前是否运行时
      if (lazyModule.isInLazyMod && !modelSystemModule.$$isInLazyMod) {
        modelSystemModule = lazyModule.makeLazy(modelSystemModule);
      }
      var registor = registorFactory.factory(modelType);
      ModelRegister.registModelType(modelType);
      ModelRegister.registBizType(bizType);
      if (model instanceof Object && !model.bizType) {
        model.bizType = bizType;
      }
      registor.regist(bizType, modelType, model);
      return this;
    },
    bizModel: function(modelId, model) {
      return this.regist(modelId, "BizModel", model);
    },
    bizActionModel:function  (modelId, model) {
      return this.regist(modelId, "BizActionModel", model);
    },
    module: function(modelId, model) {
      return this.regist(modelId, "BizModuleModel", model);
    },
    page: function(modelId, model) {
      return this.regist(modelId, "PageModel", model);
    },
    bizComponent: function(modelId, model) {
      return this.regist(modelId, "BizComponentModel", model);
    },
    chart: function(modelId, model) {
      return this.regist(modelId, "ChartModel", model);
    },
    form: function(modelId, model) {
      return this.regist(modelId, "FormModel", model);
    },
    grid: function(modelId, model) {
      return this.regist(modelId, "GridModel", model);
    },
    toolbar: function(modelId, model) {
      return this.regist(modelId, "ToolbarModel", model);
    },
    step: function(modelId, model) {
      return this.regist(modelId, "StepModel", model);
    }
  }
})
