/* global it */
'use strict';

const assert = require('assert');
const expressCoroutine = require('./index')(require('express'));
const request = require('supertest');
const bodyParser = require('body-parser');
const async = require('async');

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

const middleware3 = async function (req, res, next) {
  await fn(req, res, next);
  next();
};

// eslint-disable-next-line no-undef
describe('generator', function () {
  it('accepts generator as middleware', done => {
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

    app.param('user', function* (req, res, id) {
      assert.equal(id, 42);
    });

    app.get('/:user', function* (req, res) {
      res.send('meh');
    });

    request(app).get('/42').expect(200, done);
  });

  it('use multiple generator middleware', done => {
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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

  it('use function and async middleware', done => {
    const app = expressCoroutine();
    app.use(bodyParser.json());

    app.get('/:user', middleware3, function (req, res) {
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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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

  it('pass throwed exception in async middleware', done => {
    const app = expressCoroutine();
    app.use(bodyParser.json());

    app.get('/:user', middleware3, function* (req, res) {
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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
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
    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
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
    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
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
    const app = expressCoroutine();
    app.use(bodyParser.json());

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
    assert.equal(typeof expressCoroutine.static, 'function');
  });

  it('has coroutine export', () => {
    assert.equal(typeof require('./index').coroutine, 'function');
    assert.deepEqual(require('./index').coroutine, require('lei-coroutine'));
  });
});

// eslint-disable-next-line no-undef
describe('normal', function () {

  it('get, post, put, delete', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.get('/a', async function (req, res) {
      res.json(req.query);
    });

    router.post('/b', async function (req, res) {
      res.json(req.body);
    });

    router.put('/c', async function (req, res) {
      res.json(req.body);
    });

    router.delete('/d', async function (req, res) {
      res.json(req.body);
    });

    async.series([
      function (next) {
        request(app)
          .get('/a')
          .query({ a: 123 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 123 });
            next();
          });
      },
      function (next) {
        request(app)
          .post('/b')
          .send({ a: 456 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 456 });
            next();
          });
      },
      function (next) {
        request(app)
          .put('/c')
          .send({ a: 123, b: 456 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 123, b: 456 });
            next();
          });
      },
      function (next) {
        request(app)
          .delete('/d')
          .send({ a: 'abcd' })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 'abcd' });
            next();
          });
      },
    ], done);

  });

  it('all', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.all('/test', async function (req, res) {
      res.json({ method: req.method, data: Object.assign(req.query, req.body) });
    });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 111, b: 222 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { method: 'GET', data: { a: 111, b: 222 }});
            next();
          });
      },
    ], done);

  });

  it('use', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.use(async function (req, res, next) {
      req.query.c = 789;
      next();
    });

    router.get('/test', async function (req, res, next) {
      req.query.d = 888;
      next();
    }, async function (req, res) {
      res.json({ method: req.method, data: Object.assign(req.query, req.body) });
    });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 111, b: 222 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { method: 'GET', data: { a: 111, b: 222, c: 789, d: 888 }});
            next();
          });
      },
    ], done);

  });

  it('param', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.param('id', async function (req, res, next, id) {
      req.query.id = id;
      next();
    });

    router.get('/:id', async function (req, res) {
      res.json({ method: req.method, data: Object.assign(req.query, req.body) });
    });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 111, b: 222 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { method: 'GET', data: { a: 111, b: 222, id: 'test' }});
            next();
          });
      },
    ], done);

  });

  it('route', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router
      .route('/test')
      .get(async function (req, res) {
        res.json(req.query);
      })
      .post(bodyParser.json(), async function (req, res) {
        res.json(req.body);
      });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 123 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 123 });
            next();
          });
      },
      function (next) {
        request(app)
          .post('/test')
          .send({ a: 456 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { a: 456 });
            next();
          });
      },
    ], done);
  });
});

// eslint-disable-next-line no-undef
describe('error', function () {

  it('throw error', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.get('/test', async function (_req, _res) {
      throw new Error('abcd');
    });

    app.use(function (err, req, res, _next) {
      res.json({ error: err.message });
    });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 111, b: 222 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { error: 'abcd' });
            next();
          });
      },
    ], done);

  });

  it('error handler', function (done) {

    const app = expressCoroutine();
    app.use(bodyParser.json());
    const router = new expressCoroutine.Router();
    app.use(router);

    router.get('/test', async function (_req, _res) {
      throw new Error('abcd');
    });

    router.use(async function (err, req, res, _next) {
      res.json({ error: err.message });
    });

    async.series([
      function (next) {
        request(app)
          .get('/test')
          .query({ a: 111, b: 222 })
          .end((err, res) => {
            if (err) return next(err);
            assert.deepEqual(res.body, { error: 'abcd' });
            next();
          });
      },
    ], done);

  });

});
