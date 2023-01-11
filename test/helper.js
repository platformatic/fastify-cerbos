const Docker = require('dockerode')
const { request } = require('undici')

const CERBOS_CONTAINER_NAME = 'cerbos-test'
const CERBOS_HTTP_PORT = 13592
const CERBOS_GRPC_PORT = 13593

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getCerbosContainer = async () => {
  const dockerClient = new Docker()
  // This returns only the running containers, so is not necessary to check the status
  // See: https://docsr.com/engine/api/v1.37/#tag/Container/operation/ContainerList
  const containers = await dockerClient.listContainers()
  const cerbosTest = containers.find((c) => c.Names.includes(`/${CERBOS_CONTAINER_NAME}`))
  return cerbosTest
}

// We need this because we cannot remove policies.
// Restarting this container will remove all policies because we don't persist them
const restartCerbos = async () => {
  const cerbosTest = await getCerbosContainer()
  if (!cerbosTest) {
    throw new Error(`Container ${CERBOS_CONTAINER_NAME} not found or not running, please start it first with \`docker-compose up -d\``)
  }
  console.log('Restarting cerbos container')
  if (cerbosTest) {
    const container = new Docker().getContainer(cerbosTest.Id)
    await container.restart()
  }
  while (true) {
    try {
      const cerbosServerInfo = await request(`http://localhost:${CERBOS_HTTP_PORT}/api/server_info`)
      if (cerbosServerInfo.statusCode === 200) {
        console.log('Cerbos is now up&running:')
        console.log(await cerbosServerInfo.body.json())
        break
      } else {
        console.log('Waiting for cerbos to be up&running')
        await sleep(500)
      }
    } catch (e) {
      await sleep(500)
    }
  }
}

module.exports = {
  restartCerbos,
  CERBOS_HTTP_PORT,
  CERBOS_GRPC_PORT
}
