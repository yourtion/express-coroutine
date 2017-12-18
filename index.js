'use strict';

const http = require('http');
const coroutine = require('lei-coroutine');
const slice = Array.prototype.slice;

module.exports = function (express) {
  function expressCoroutine() {
    return wrap(express());
  }

  expressCoroutine.prototype = express;

  Object.assign(expressCoroutine, express);

  if (express.Router) {
    expressCoroutine.Router = function () {
      return wrap(new express.Router());
    };
  }

  return expressCoroutine;
};

function isGenerator(v) {
  return typeof v === 'function' && v.constructor.name === 'GeneratorFunction';
}

function getCurrentNodeMethods() {
  return http.METHODS && http.METHODS.map(method => {
    return method.toLowerCase();
  });
}

function wrap(app) {
  const methods = getCurrentNodeMethods();
  methods.concat([ 'use', 'all', 'param' ]).forEach(method => {
    app[method] = wrapAppMethod(app[method], method !== 'param');
  });

  app.del = app.delete;

  // 如果有 route 方法则封装
  if (typeof app.route === 'function') {
    app.__route = app.route.bind(app);
    app.route = function (...args) {
      return wrap(app.__route(...args));
    };
  }

  return app;
}

// 将 arguments 转成 array
function toArray(args) {
  return Array.prototype.slice.call(args);
}

function wrapAppMethod(route, withErrorParam) {
  return function () {
    return route.apply(this, slice.call(arguments).map(fn => { return convertGenerators(fn, withErrorParam); }));
  };
}

// 调用 handler，并捕捉 Promise 的错误
function callAndCatchPromiseError(fn, ...args) {
  // args 最后一个参数如果是如果是 function 则表示 next()
  // 如果执行时出错，调用 next(err)
  const next = args[args.length - 1];
  let p = null;
  try {
    p = fn.apply(null, args);
  } catch (err) {
    return next(err);
  }
  if (p && p.then && p.catch) {
    p.catch(err => next(err));
  }
}

function convertGenerators(fn, withErrorParam = true) {
  if (typeof fn !== 'function') return fn;
  if (withErrorParam && fn.length > 3) {
    // eslint-disable-next-line handle-callback-err
    return function (err, req, res, next) {
      if (isGenerator(fn)) {
        return coroutine.wrap(fn).call(this, ...toArray(arguments)).then(() => !res.finished && next(), next);
      }
      return callAndCatchPromiseError(fn, ...toArray(arguments));
    };
  }
  if (!withErrorParam && fn.length >= 3 && isGenerator(fn)) {
    return function (req, res, next, id) {
      return coroutine.wrap(fn).call(this, req, res, id).then(() => !res.finished && next(), next);
    };
  }
  return function (req, res, next) {
    if (isGenerator(fn)) {
      return coroutine.wrap(fn).call(this, ...toArray(arguments)).then(() => !res.finished && next(), next);
    }
    return callAndCatchPromiseError(fn, ...toArray(arguments));
  };
}

module.exports.coroutine = coroutine;
