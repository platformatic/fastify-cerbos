const fp = require('fastify-plugin')

// We must define at least one role, otherwise Cerbos will throw an error
const anonymousPrincipal = { id: 'anonymous', roles: ['anonymous'] }

const defaultOptions = {
  useGRPC: true,
  port: 3593,
  host: 'localhost',
  adminCredentials: null,
  tls: false,
  getPrincipal: () => anonymousPrincipal,
  enableHook: false,
  getResourceAndAction: null // used id hook is enabled. Given a fastify request, return a resource and an action
}

function fastifyCerbos (fastify, options, done) {
  const _options = Object.assign({}, defaultOptions, options)
  const {
    useGRPC,
    port,
    host,
    adminCredentials,
    tls,
    getPrincipal,
    enableHook,
    getAuthorizationRequest
  } = _options

  if (enableHook) {
    if (!getAuthorizationRequest) {
      return done(new Error('You need to provide a getAuthorizationRequest function if you enable the hook'))
    }

    if (typeof getAuthorizationRequest !== 'function') {
      return done(new Error('getAuthorizationRequest must be a function'))
    }
  }

  if (getPrincipal && typeof getPrincipal !== 'function') {
    return done(new Error('getPrincipal must be a function'))
  }

  const Cerbos = useGRPC ? require('@cerbos/grpc').GRPC : require('@cerbos/http').HTTP
  const cerbosClient = new Cerbos(`http://${host}:${port}`, { adminCredentials, tls })

  // Decorator for programmatic use
  async function isAllowed (resource, action) {
    const principal = getPrincipal(this) || anonymousPrincipal
    const isAllowed = await cerbosClient.isAllowed({ principal, resource, action })
    return isAllowed
  }

  fastify.decorateRequest('isAllowed', isAllowed)

  // Hook for declarative use.
  if (enableHook) {
    fastify.addHook('preHandler', async (request, reply) => {
      if (!getAuthorizationRequest) {
        reply.code(500).send(new Error('Resource loader not defined'))
      }
      const { resource, action } = getAuthorizationRequest(request)
      const principal = request.user ? getPrincipal(request.user) : anonymousPrincipal
      const isAllowed = await cerbosClient.isAllowed({ principal, resource, action })
      if (!isAllowed) {
        reply.code(403).send()
      }
    })
  }
  done()
}

module.exports = fp(fastifyCerbos, {
  fastify: '4.x',
  name: 'fastify-cerbos'
})

module.exports.default = fastifyCerbos
module.exports.fastifyCerbos = fastifyCerbos
