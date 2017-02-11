/* global it */
'use strict';

const assert = require('assert');
const expressGenerators = require('./index')(require('express'));
const request = require('supertest');

// eslint-disable-next-line no-unused-vars
const fn = function (req, res, next) {
  return new Promise((resolve, reject) => {
    if (req.params.user !== 'a') return reject(new Error('Bang!'));
    resolve('a');
  });
};

const middleware1 = function* (req, res, next) {
  yield fn(req, res, next);
};

const middleware2 = function (req, res, next) {
  if (req.params.user !== 'a') return next(new Error('Bang!'));
  next();
};

it('accepts generator as middleware', done => {
  const app = expressGenerators();

  app.get('/', function* (req, res) {
    res.send('it works!');
  });

  request(app)
    .get('/')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('does not call next middleware after res.send', done => {
  const app = expressGenerators();

  app.get('/', function* (req, res) {
    res.send('one');
  });

  app.get('/', function* (req, res) {
    res.send('two');
  });

  request(app)
    .get('/')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'one');
      done();
    });
});

it('pass throwed exception to error handler', done => {
  const app = expressGenerators();

  app.get('/', function* () {
    throw new Error('Bang!');
  });

  app.use((err, req, res, next) => {
    assert.equal(err.message, 'Bang!');
    res.sendStatus(500);
    next();
  });

  request(app).get('/').expect(500, done);
});

it('pass throwed exception to error handler with code', done => {
  const app = expressGenerators();

  app.get('/', function* () {
    const error = new Error('Bang!');
    error.code = -100;
    throw error;
  });

  app.use((err, req, res, next) => {
    assert.equal(err.message, 'Bang!');
    assert.equal(err.code, -100);
    res.sendStatus(500);
    next();
  });

  request(app).get('/').expect(500, done);
});

it('works with param method', done => {
  const app = expressGenerators();

  app.param('user', function* (req, res, id) {
    assert.equal(id, 42);
  });

  app.get('/:user', function* (req, res) {
    res.send('meh');
  });

  request(app).get('/42').expect(200, done);
});

it('use multiple generator middleware', done => {
  const app = expressGenerators();

  app.get('/:user', middleware1, function* (req, res) {
    res.send('it works!');
  });

  request(app)
    .get('/a')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('use function and generator middleware', done => {
  const app = expressGenerators();

  app.get('/:user', middleware2, function* (req, res) {
    res.send('it works!');
  });

  request(app)
    .get('/a')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('pass throwed exception in generator middleware', done => {
  const app = expressGenerators();

  app.get('/:user', middleware1, function* (req, res) {
    res.send('it works!');
  });

  app.use((err, req, res, next) => {
    assert.equal(err.message, 'Bang!');
    res.sendStatus(500);
    next();
  });

  request(app).get('/b').expect(500, done);
});

it('pass throwed exception in function middleware', done => {
  const app = expressGenerators();

  app.get('/:user', middleware2, function* (req, res) {
    res.send('it works!');
  });

  app.use((err, req, res, next) => {
    assert.equal(err.message, 'Bang!');
    res.sendStatus(500);
    next();
  });

  request(app).get('/b').expect(500, done);
});

it('works with app.route call', done => {
  const app = expressGenerators();

  app.route('/')
    .get(function* (req, res) {
      res.send('it works!');
    });

  request(app)
    .get('/')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('works with route', done => {
  const app = expressGenerators();
  const router = new expressGenerators.Router();
  app.use(router);

  router.get('/', function* (req, res) {
    res.send('it works!');
  });

  request(app)
    .get('/')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('throwed when works with route and generator middleware', done => {
  const app = expressGenerators();
  const router = new expressGenerators.Router();
  app.use(router);

  router.get('/:user', middleware1, function* (req, res) {
    res.send('it works!');
  });

  app.use((err, req, res, next) => {
    assert.equal(err.message, 'Bang!');
    res.sendStatus(500);
    next();
  });

  request(app).get('/b').expect(500, done);
});

it('works with route and generator middleware', done => {
  const app = expressGenerators();
  const router = new expressGenerators.Router();
  app.use(router);

  router.get('/:user', middleware1, function* (req, res) {
    res.send('it works!');
  });

  request(app)
    .get('/a')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('accepts old function as middleware', done => {
  const app = expressGenerators();

  app.get('/', (req, res) => {
    res.send('it works!');
  });

  request(app)
    .get('/')
    .end((err, res) => {
      assert.ifError(err);
      assert.equal(res.text, 'it works!');
      done();
    });
});

it('has static method', () => {
  assert.equal(typeof expressGenerators.static, 'function');
});
