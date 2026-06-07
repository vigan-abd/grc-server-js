'use strict'

const GrcWrkBase = require('./grc.wrk.base')

class GrcWrkMultiTransport extends GrcWrkBase {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number[]} opts.ports - Grc service ports
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.announce] - Grc announce interval
   * @param {Object} [opts.conf] - Worker config
   * @param {string} [opts.env] - Worker environment
   * @param {string[]} opts.prefixes - Worker transport service name prefixes, should match number of ports
   */
  constructor ({ name, ports, grape, announce = 15000, conf = {}, env = 'development', prefixes }) {
    super({ name, port: ports[0], grape, announce, conf, env })

    this._ports = ports
    this._prefixes = prefixes
    this._peerServers = [] // should be populated on extended class
    this._services = [] // shouldn't be touched on extended class

    this._names = this._prefixes.map(prefix => `${prefix}:${this._name}`)

    delete this._port
    delete this._service
  }

  _isServiceSupported (serviceName) {
    return this._names.includes(serviceName)
  }

  async start () {
    this._registerActions()

    this._link.start()

    for (let i = 0; i < this._ports.length; i++) {
      const port = this._ports[i]
      const serviceName = this._names[i]

      const peerServer = this._peerServers[i]
      peerServer.init()
      const service = peerServer.transport('server')
      service.listen(port)

      await new Promise((resolve, reject) => {
        this._link.announce(serviceName, port, {}, (err) => err ? reject(err) : resolve())
      })
      this._link.startAnnouncing(serviceName, port, { interval: this._announce })

      service.on('request', this.handler.bind(this))

      this._services.push(service)
    }
  }

  stop () {
    for (let i = 0; i < this._names.length; i++) {
      this._link.stopAnnouncing(this._names[i], this._ports[i])
    }
    this._services.forEach(service => service.stop())
    this._peerServers.forEach(peerServer => peerServer.stop())
    this._link.stop()
  }
}

module.exports = GrcWrkMultiTransport
