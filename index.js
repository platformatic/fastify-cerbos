
const fp = require('fastify-plugin')

// We must define at least one role, otherwise Cerbos will throw an error
const anonymousPrincipal = { id: 'anonymous', roles: ['anonymous'] }

const defaultOptions = {
  useGRPC: true,
  port: 3593,
  host: 'localhost',
  adminCredentials: null,
  tls: false,
  getPrincipal: user => {
    const { id, roles, ...rest } = user
    return {
      id,
      roles,
      attr: rest
    }
  }
}

function fastifyCerbos (fastify, options, done) {
  const _options = Object.assign({}, defaultOptions, options)
  const {
    useGRPC,
    port,
    host,
    adminCredentials,
    tls,
    getPrincipal
  } = _options

  const Cerbos = useGRPC ? require('@cerbos/grpc').GRPC : require('@cerbos/http').HTTP

  // we ignore here because to cover the tls case we should start another cerbos instance
  /* istanbul ignore next */
  const cerbosInitString =
    useGRPC
      ? `${host}:${port}`
      : `${tls ? 'https' : 'http'}://${host}:${port}`
  console.log(`Initializing Cerbos client with ${cerbosInitString}`)
  const cerbosClient = new Cerbos(cerbosInitString, { adminCredentials, tls })

  async function isAllowed (resource, action) {
    const principal = this.user ? getPrincipal(this.user) : anonymousPrincipal
    const isAllowed = await cerbosClient.isAllowed({ principal, resource, action })
    return isAllowed
  }

  fastify.decorateRequest('isAllowed', isAllowed)
  done()
}

module.exports = fp(fastifyCerbos, {
  fastify: '4.x',
  name: 'fastify-cerbos'
})

module.exports.default = fastifyCerbos
module.exports.fastifyCerbos = fastifyCerbos
