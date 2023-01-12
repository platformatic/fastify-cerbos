const { test, before } = require('tap')
const Fastify = require('fastify')
const fastifyCerbos = require('..')
const { restartCerbos, setupPolicies } = require('./helper')

before(async () => {
  await restartCerbos()
  await setupPolicies()
})

test('HTTP', async (t) => {
  test('failed authorization, anonymous principal', async ({ plan, same, teardown }) => {
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

  test('failed authorization, principal from user', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false
    })

    app.addHook('preHandler', (request, reply, done) => {
      request.user = {
        id: 'alice',
        roles: ['user'],
        department: 'engineering'
      }
      done()
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

  test('failed authorization, principal from user with no id and roles', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false
    })

    app.addHook('preHandler', (request, reply, done) => {
      request.user = {
        department: 'engineering'
      }
      done()
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

  test('successful authorization', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false
    })

    // Creates the user
    app.addHook('preHandler', (request, reply, done) => {
      request.user = {
        id: 'bugs_bunny',
        roles: ['admin']
      }
      done()
    })

    app.get('/', async function (request, reply) {
      const resource = {
        id: '1',
        kind: 'post',
        attributes: {}
      }
      const allowed = await request.isAllowed(resource, 'edit')

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

    same(response.statusCode, 200)
  })

  test('successful authorization, custom getPrincipal', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13592,
      useGRPC: false,
      getPrincipal: (user) => {
        return {
          id: user.id,
          roles: ['admin'] // this makes all principal admins
        }
      }
    })

    // Creates the user
    app.addHook('preHandler', (request, reply, done) => {
      request.user = {
        id: 'bugs_bunny'
      }
      done()
    })

    app.get('/', async function (request, reply) {
      const resource = {
        id: '1',
        kind: 'post'
      }
      const allowed = await request.isAllowed(resource, 'edit')

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

    same(response.statusCode, 200)
  })
})

test('GRPC', async (t) => {
  test('failed authorization, anonymous principal', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13593,
      useGRPC: true
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

  test('successful authorization', async ({ plan, same, teardown }) => {
    const app = Fastify()
    teardown(app.close.bind(app))

    app.register(fastifyCerbos, {
      host: '127.0.0.1',
      port: 13593,
      useGRPC: true
    })

    // Creates the user
    app.addHook('preHandler', (request, reply, done) => {
      request.user = {
        id: 'bugs_bunny',
        roles: ['admin']
      }
      done()
    })

    app.get('/', async function (request, reply) {
      const resource = {
        id: '1',
        kind: 'post',
        attributes: {}
      }
      const allowed = await request.isAllowed(resource, 'edit')

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

    same(response.statusCode, 200)
  })
})
