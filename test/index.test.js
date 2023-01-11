const { test, before } = require('tap')
const Fastify = require('fastify')
const fastifyCerbos = require('..')
const { restartCerbos } = require('./helper')

before(async () => {
  await restartCerbos()
})

test('Check authorization with HTTP', async (t) => {
  test('failed authorization', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false
    })

    app.get('/', async function (request, reply) {
      const resource = {
        id: '1',
        kind: 'post',
        attributes: {}
      }
      const allowed = await request.isAllowed(resource, 'read')

      if (!allowed) {
        reply.code(403).send()
      }
      return { hello: 'world' }
    })

    await app.listen()

    const response = await app.inject({
      method: 'GET',
      url: '/'
    })

    same(response.statusCode, 403)
  })

  test('failed authorization with resource and action loader', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false,
      enableHook: true,
      getAuthorizationRequest: (request) => {
        return {
          resource: {
            id: '1',
            kind: 'post'
          },
          action: 'read'
        }
      }
    })

    app.get('/', async function (request, reply) {
      return { hello: 'world' }
    })

    await app.listen()

    const response = await app.inject({
      method: 'GET',
      url: '/'
    })
    same(response.statusCode, 403)
  })
})
