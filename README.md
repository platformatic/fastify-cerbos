# Cerbos Fastify plugin

This plugin provides a [Fastify](https://www.fastify.io/) plugin for [Cerbos](https://cerbos.dev).

## Usage

Add the plugin to your Fastify application:

```js
const Fastify = require('fastify')
const fastifyCerbos = require('@platformatic/fastify-cerbos')

const app = Fastify()

app.register(fastifyCerbos, {
  host: '127.0.0.1',
  port: 3593,
  useGRPC: true,
  getPrincipal: request => {
    const { id, roles } = request.user
    return {
    id,
    roles
  }
})

app.get('/', async function (request, reply) {

  const { id } = request.body
  const resource = {
    id,
    kind: 'post',
    attributes: {}
  }
  
  const allowed = await request.isAllowed(resource, 'modify')
  if (!allowed) {
    reply.code(403).send()
  }
  
  // (...)
})

await app.listen()

```

### Authorization Hook
[TODO]

## Run Tests

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://github.com/docker/compose) installed.

Start Cerbos server with:

```bash
docker-compose up -d 
```


