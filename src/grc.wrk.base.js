'use strict'

const Link = require('grenache-nodejs-link')
const { extractPublicMethods } = require('./utils')

const RESERVED_METHODS = [
  '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__',
  'constructor', 'handler', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
  'start', 'stop', 'toLocaleString', 'toString', 'valueOf'
]

class GrcWrkBase {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number} opts.port - Grc service port
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.announce] - Grc announce interval
   * @param {Object} [opts.conf] - Worker config
   * @param {string} [opts.env] - Worker environment
   */
  constructor ({ name, port, grape, announce = 15000, conf = {}, env = 'development' }) {
    this._link = new Link({ grape })

    this._name = name
    this._port = port
    this._announce = announce
    this._conf = conf
    this._env = env
  }

  /**
   * Collects the public methods exposed as callable grc actions.
   */
  _registerActions () {
    this._actions = new Set()
    for (const key of extractPublicMethods(this)) {
      if (RESERVED_METHODS.includes(key)) continue // disallow calling reserved methods
      if (key.startsWith('_')) continue // disallow calling methods that start with _ (private standard naming)

      this._actions.add(key)
    }
  }

  /**
   * @param {string} serviceName
   * @returns {boolean} whether the worker serves the requested service name
   */
  _isServiceSupported (serviceName) {
    return serviceName === this._name
  }

  async start () {
    this._registerActions()

    this._link.start()
    this._peerServer.init() // should be inited on extended class
    this._service = this._peerServer.transport('server')
    this._service.listen(this._port)

    await new Promise((resolve, reject) => {
      this._link.announce(this._name, this._port, {}, (err) => err ? reject(err) : resolve())
    })
    this._link.startAnnouncing(this._name, this._port, { interval: this._announce })

    this._service.on('request', this.handler.bind(this))
  }

  stop () {
    this._link.stopAnnouncing(this._name, this._port)
    this._service.stop()
    this._peerServer.stop()
    this._link.stop()
  }

  async handler (rid, serviceName, payload, handler) {
    try {
      if (!this._isServiceSupported(serviceName)) throw new Error('ERR_GRC_SERVICE_NOT_SUPPORTED')
      if (!payload || typeof payload !== 'object') throw new Error('ERR_GRC_BAD_REQUEST')

      const { action, args } = payload
      if (!this._actions.has(action)) throw new Error('ERR_GRC_ACTION_NOT_FOUND')
      if (!Array.isArray(args)) throw new Error('ERR_GRC_ARGS_INVALID')

      const resp = await this[action](...args)
      handler.reply(null, resp)
    } catch (err) {
      console.error(new Date().toISOString(), err)
      handler.reply(err)
    }
  }
}

module.exports = GrcWrkBase
