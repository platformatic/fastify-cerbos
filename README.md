
# Cerbos Fastify plugin

This plugin provides a [Fastify](https://www.fastify.io/) plugin for [Cerbos](https://cerbos.dev).
It assumes the `request` has been decorated with a `user` object. The `user` object is used to extract the principal using this `getPrincipal` function: 

```js
  getPrincipal: user => {
    const { id, roles, ...rest } = user
    return {
    id,
    roles, 
    attr: rest
  }
}

This function can be overridden by passing a `getPrincipal` function to the plugin options.
If no `user` object is found in the request, the principal is `anonymous` principal:
```
  { 
    id: 'anonymous', 
    roles: ['anonymous'] 
  }

```

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
})

app.get('/', async function (request, reply) {

  const { id } = request.body
  const resource = {
    id,
    kind: 'post',
    attr: {}
  }
  
  const allowed = await request.isAllowed(resource, 'modify')
  if (!allowed) {
    reply.code(403).send()
  }
  
  // (...)
})

await app.listen()

```

## Run Tests

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://github.com/docker/compose) installed.

Start Cerbos server with:

```bash
docker-compose up -d 
```


