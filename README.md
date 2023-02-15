# Cerbos Fastify plugin

This plugin provides a [Fastify](https://www.fastify.io/) plugin for [Cerbos](https://cerbos.dev).
Currently, this supports only `isAllowed` exposed by a Fastify request decorator, which returns a Promise that resolves to a boolean.

It assumes the `request` has been decorated with a `user` object. The `user` object is used to extract the principal using this `getPrincipal` function: 

```js
  getPrincipal: user => {
    const { id = 'anonymous', roles = ['anonymous'], ...rest } = user
    return {
    id,
    roles, 
    attr: rest
  }
}
```

This function can be overridden by passing a `getPrincipal` function to the plugin options.
If no `user` object is found in the request, the principal is `anonymous` principal:
```js
  { 
    id: 'anonymous', 
    roles: ['anonymous'] 
  }

```
These values are also set in case `user` as no `id` or `roles` properties.

## Usage

Install with:

```bash
npm install fastify-cerbos
```

Then you can add the plugin to your Fastify application:

```js
const Fastify = require('fastify')
const fastifyCerbos = require('fastify-cerbos')

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

## Options

The plugin accepts the following options:

- `host` - Cerbos server host. Default: `127.0.0.1`
- `port` - Cerbos server port. Default: `3593`
- `useGRPC` - Use gRPC to connect to Cerbos server. Default: `true`
- `getPrincipal` - Function to extract the principal from the request. Default: `see above`
- `tls` - TLS options for gRPC/HTTP connection. This object is passed to [Cerbos Client Object](https://github.com/cerbos/cerbos-sdk-javascript/blob/main/docs/core.client.md)


## Run Tests

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://github.com/docker/compose) installed.

Start Cerbos server with:

```bash
docker-compose up -d 
```

