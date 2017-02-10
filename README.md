[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![npm license][license-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/express-coroutine.svg?style=flat-square
[npm-url]: https://npmjs.org/package/express-coroutine
[travis-image]: https://img.shields.io/travis/yourtion/express-coroutine.svg?style=flat-square
[travis-url]: https://travis-ci.org/yourtion/express-coroutine
[coveralls-image]: https://img.shields.io/coveralls/yourtion/express-coroutine.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yourtion/express-coroutine?branch=master
[david-image]: https://img.shields.io/david/yourtion/express-coroutine.svg?style=flat-square
[david-url]: https://david-dm.org/yourtion/express-coroutine
[node-image]: https://img.shields.io/badge/node.js-%3E=4.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/express-coroutine.svg?style=flat-square
[download-url]: https://npmjs.org/package/express-coroutine
[license-image]: https://img.shields.io/npm/l/express-coroutine.svg

# express-coroutine

Use generator function with express like koa ( use lei-coroutine )

## Installation

```bash
npm install express-coroutine
```

## Usage

```javascript
const express = require('express-coroutine')(require('express'));

const app = express();

app.get('/user/:id', function* (req, res) {
  const user = yield User.findById(req.params.id);
  res.send(user);
})

app.get('/error', function* (req, res) {
  throw new Error('Bang!');
});

app.listen(8000);
```
