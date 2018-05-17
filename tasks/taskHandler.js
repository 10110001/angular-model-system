/**
 * 使用$q生成promise任务
 * 每个任务会获取到config参数
 * @param config.task task的配置
 * @param config.module module的配置
 * @param config.global 全局配置
 *
 * @return promise
 */

define(['angular',
    '../modelSystemModule',
    './messageTask',
    './loadTask'
  ],
  function(angular, modelSystemModule) {

    modelSystemModule.provider('modelSystem.taskProvider', [function() {
      var taskClasses = {
      };
      var getterSetter = {
        setTask: function(name, task) {
          taskClasses[name] = task;
        },
        getTask: function(name) {
          return taskClasses[name];
        },
        removeTask: function(name){
          delete(taskClasses[name]);
        }
      }
      return {
        $get: function() {
          return getterSetter;
        }
      }
    }])
    .factory('moduleTaskHandler', ['modelSystem.taskProvider', 'moduleMessageTask','moduleLoadTask', function(taskProvider, moduleMessageTask, moduleLoadTask){
      var configSysTask = function(){
        taskProvider.setTask('sys_message', moduleMessageTask);
        taskProvider.setTask('sys_load', moduleLoadTask);
      };
      configSysTask();
      var getTaskList = function(modulesConfig, globalConfig, moduleId){
        var result = [];
        var module = modulesConfig[moduleId];
        if(module.depTasks && module.depTasks instanceof Array){
          for(var i = 0;i < module.depTasks.length; i++){
            var taskConfig = module.depTasks[i];
            var task = taskProvider.getTask(taskConfig.name);
            if(task instanceof Function){
              var taskBody = task({
                task: taskConfig,
                module: module,
                global: globalConfig
              }, moduleId)
              if(taskBody){
                result.push(taskBody);
              }
            }
          }
        }
        return result;
      };

      return getTaskList;
    }])
});
