define(['angular', './directives'],
  function(angular, directiveModule) {

    /**
     * 获取字段值
     * @param  {Object} obj 当前指令所在作用域
     * @param  {String} key 支持xx.xxx.xx类似的表达式
     * @return {Object}     对应的值
     */
    function getFieldValue(obj, key) {
      if (obj === undefined) {
        return undefined
      }
      if (!key) {
        return obj;
      }
      var value = obj,
        keys = [];
      if (key.indexOf('.') > 0) {
        keys = key.split(".");
      } else {
        keys.push(key);
      }

      for (var i = 0, k = ""; k = keys[i]; i++) {
        if (value[k] !== undefined) {
          value = value[k];
        } else {
          return undefined;
        }
      }
      return value;
    }

    /**
     * 继承方法
     * @param  {Function} superClass 父类
     * @param  {Function} subClass   子类
     */
    function inherit(superClass, subClass) {
      if (!angular.isFunction(superClass)) {
        throw new Error("superClass should be a function!");
      }
      if (!angular.isFunction(subClass)) {
        throw new Error("subClass should be a function!");
      }

      function F() {}
      F.prototype = superClass.prototype;
      subClass.prototype = new F();
      subClass.prototype.constructor = subClass;
    }

    /**
     * 比较器策略类
     * @param {string} operator  比较器
     * @param {any} value     原始值
     * @param {any} compareTo 比较值
     */
    function ValueCompareStrategy(operator, value, compareTo) {
      this.operator = operator;
      this.value = this.getValue(value);
      this.compareTo = this.getCompareTo(compareTo);
    }

    /**
     * 将不同类型的比较器注册到ValueCompareStrategy
     * @param  {string} dataType 比较器类型
     * @param  {function} fun  比较器构造函数
     */
    ValueCompareStrategy.regist = function(dataType, fun) {
      if (this[dataType]) {
        return false;
      }
      this[dataType] = fun;
    }

    /**
     * 根据数据类型，获取对应的比较器构造函数
     * @param  {String} dataType 数据类型
     * @return {Function}        数据类型对应的构造函数
     */
    ValueCompareStrategy.get = function(dataType) {
      return ValueCompareStrategy[dataType] || ValueCompareStrategy;
    }

    /**
     * 获取比较值，该值为比较操符作左边的元素
     * @param  {any} value 比较数
     * @return {any}       经过格式转换的值
     */
    ValueCompareStrategy.prototype.getValue = function(value) {
      return value;
    }

    /**
     * 获取被比较值，该值为比较操作符右边的元素
     * @param  {any} compareTo 被比较值
     * @return {any}           经过数据格式转换的被比较值
     */
    ValueCompareStrategy.prototype.getCompareTo = function(compareTo) {
      return compareTo;
    }

    /**
     * 默认的比较方法
     * @param  {string} op        比较操作符
     * @param  {any} value        比较值
     * @param  {any} compareTo    被比较值
     * @return {boolean}          比较结果
     */
    ValueCompareStrategy.prototype.compare = function(op, value, compareTo) {
      var value = this.value,
        compareTo = this.compareTo,
        result = true;

      switch (op) {
        case "eq":
          result = (compareTo == value);
          break;
        case "eqeqeq":
          result = (compareTo === value);
          break;
        case "lt":
          result = (value < compareTo);
          break;
        case "gt":
          result = (value > compareTo);
          break;
        case "le":
          result = (value <= compareTo);
          break;
        case "ge":
          result = (value >= compareTo);
          break;
      }
      return result;
    }

    /**
     * 验证比较值和被比较值是否合法，如果不合法，则应该把字段合法性的验证权交给下一个表单校验器
     * @return {boolean} 是否合法
     */
    ValueCompareStrategy.prototype.valuesValidate = function() {
      return true;
    }

    /**
     * 初始化比较器
     * 注意：做扩展时，需要首先定义对应数据格式的构造器类，然后在该函数中添加对应的DATATYPES即可
     * @return {[type]} [description]
     */
    function initValidateCompare() {
      /**
       * 支持比较的数据类型常量
       * @type {Object}
       */
      var CONST = {
        DATATYPES: {
          number: NumberComapre,
          date: DateCompare
        }
      }
      var dataTypes = CONST.DATATYPES,
        constructor = "";

      //将不同数据格式的比较器注册，并且继承默认的比较器策略类
      for (var dataType in dataTypes) {
        if (dataTypes.hasOwnProperty(dataType)) {
          constructor = dataTypes[dataType];
          ValueCompareStrategy.regist(dataType, constructor);
          inherit(ValueCompareStrategy, constructor);
        }
      }
    }

    initValidateCompare();

    function NumberComapre() {
      ValueCompareStrategy.apply(this, Array.prototype.slice.call(arguments, 0));

    }

    NumberComapre.prototype.getValue = function(value) {
      return value * 1;
    }

    NumberComapre.prototype.getCompareTo = function(compareTo) {
      return compareTo * 1;
    }

    NumberComapre.prototype.valuesValidate = function() {
      return this.value === this.value && this.compareTo === this.compareTo;
    }

    function DateCompare() {
      ValueCompareStrategy.apply(this, Array.prototype.slice.call(arguments, 0));
      this.originVlaue = arguments[1];
      this.originCompareToValue = arguments[2];
    }

    DateCompare.prototype.getValue = function(value) {
      if (angular.isString(value)) {
        value = Date.parse(value);
      } else if (angular.isDate(value)) {
        value = value.getTime();
      } else {
        //如果value的值不是时间字符串或者时间对象，则直接乘1做转换。
        //如果值是合法的数字，则不会对结果产生影响；如果值是NaN，则会在合法性判断中返回false，会把控制权交给其他验证器
        value = value * 1;
      }
      return value;
    }

    DateCompare.prototype.getCompareTo = function(value) {
      if (angular.isString(value)) {
        value = Date.parse(value);
      } else if (angular.isDate(value)) {
        value = value.getTime();
      } else {
        //如果value的值不是时间字符串或者时间对象，则直接乘1做转换。
        //如果值是合法的数字，则不会对结果产生影响；如果值是NaN，则会在合法性判断中返回false，会把控制权交给其他验证器
        value = value * 1;
      }
      return value;
    }

    DateCompare.prototype.valuesValidate = function() {
      return this.value === this.value && this.compareTo === this.compareTo;
    }



    directiveModule.directive('compare',
      function() {
        return {
          require: 'ngModel',
          // scope: {
          //   // compare: "@",
          //   compareDataType: "@",
          //   watchComparefield: "@",
          //   compareOperation: "@"
          // },
          link: function(scope, el, attrs, ctrl) {
            var dataType = attrs.compareDataType || "number",
              CompareHandler = ValueCompareStrategy.get(dataType),
              compare = attrs.compare,
              obj = scope, // scope[attrs.compare];
              watch = attrs.watchComparefield,
              op = attrs.compareOperation;

            if (watch !== false) {
              scope.$watch(compare, function() {
                var fromWatch = true,
                  value = ctrl.$modelValue;
                compareFiledValue(value, fromWatch);
              })
            }
            ctrl.$parsers.unshift(compareFiledValue);

            function compareFiledValue(value, fromWatch) {
              /*如果是被监控字段的变化，则被监控字段变化所引起的当前字段的验证行为只做“通过”动作，不做“不通过”动作。
              原因：如果不这样设定，则会出现其他字段编辑引发当前字段提示错误的情况，不符合自然思维；
              相反，其他字段编辑从而使当前字段的值合法，则应该去掉当前字段的错误提示*/
              if (fromWatch) {
                ctrl.$setValidity('compare', true);
                return value;
              }
              ctrl.$setValidity('compare', true);

              //字段值为空时，不走比较逻辑，直接把合法性判断控制权交给下一个表单验证器
              if (value === undefined) {
                return value;
              }
              var compareTo = scope.$eval(compare),
                compareHandler = new CompareHandler(op, value, compareTo);

              //两个比较字段的值不合法时（比如格式不对，比如不是数字，比如不是Object等等），也不走比较逻辑（因为肯定有其他的表单验证器来控制数值的合法性）
              if (!compareHandler.valuesValidate()) {
                return value;
              }

              var result = compareHandler.compare(op);
              ctrl.$setValidity('compare', result);

              return value;
            }
          }
        }
      }
    )
  })
