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
