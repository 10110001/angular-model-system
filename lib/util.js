define([], function() {
  function deepClone(child, parent, cloneAllProperty) {
    var i,
      toStr = Object.prototype.toString,
      astr = "[object Array]";
    child = child || {};
    for (i in parent) {
      if (!cloneAllProperty) {
        if (parent.hasOwnProperty(i)) {
          if (typeof parent[i] === "object") {
            child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
            deepClone(child[i], parent[i]);
          } else {
            child[i] = parent[i];
          }
        }
      } else {
        if (typeof parent[i] === "object") {
          child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
          deepClone(child[i], parent[i], cloneAllProperty);
        } else {
          child[i] = parent[i];
        }
      }

    }
    return child;
  }

  function inherit(sub, sup) {
    function F() {}
    F.prototype = sup.prototype;
    var parent = new F();
    sub.prototype = deepClone(parent, sub.prototype);

    sub.prototype.constructor = sub;
    sub._parent = parent;
    return sub;
  }

  return {
    deepClone: deepClone,
    inherit: inherit
  }
})
