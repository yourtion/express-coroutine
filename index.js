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
  methods.forEach(method => {
    app[method] = wrapAppMethod(app[method]);
  });

  app.param = wrapParamMethod(app.param);
  app.use = wrapAppMethod(app.use);
  app.all = wrapAppMethod(app.all);
  app.del = app.delete;

  const _route = app.route;
  app.route = function () {
    return wrap(_route.apply(this, arguments));
  };

  return app;
}

function wrapAppMethod(route) {
  return function () {
    return route.apply(this, slice.call(arguments).map(convertGenerators));
  };
}

function wrapParamMethod(route) {
  return function (name, fn) {
    let cb = fn;

    if (isGenerator(fn)) {
      cb = function (req, res, next, id) {
        coroutine.wrap(fn).call(this, req, res, id).then(() => !res.finished && next(), next);
      };
    }

    return route.call(this, name, cb);
  };
}

function convertGenerators(v) {
  if (!isGenerator(v)) {
    return v;
  }

  return function (req, res, next) {
    coroutine.wrap(v).call(this, req, res).then(() => !res.finished && next(), next);
  };
}
