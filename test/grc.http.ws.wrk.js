'use strict'

/* eslint-env mocha */

const assert = require('assert')
const createGrapes = require('@bitfinex/bfx-svc-test-helper/grapes')
const { GrcHttpClient, GrcWsClient } = require('@vigan-abd/grc-client')
const { GrcHttpWsWrk } = require('../')

class SampleWrk extends GrcHttpWsWrk {
  ping (from, message) {
    return { to: from, message }
  }
}

describe('grc.http.ws.wrk.js tests', () => {
  const grape = 'http://127.0.0.1:30001'
  const svcName = 'rest:sample:wrk'
  const httpClient = new GrcHttpClient({ grape })
  const wsClient = new GrcWsClient({ grape })
  const grapes = createGrapes({})
  const wrk = new SampleWrk({ name: svcName, ports: [7070, 7071], grape })

  before(async function () {
    this.timeout(5000)

    await grapes.start()
    httpClient.start()
    wsClient.start()
    await wrk.start()
  })

  after(async function () {
    this.timeout(5000)

    httpClient.stop()
    wsClient.stop()
    wrk.stop()
    await grapes.stop()
  })

  it('should send request and receive response from http transport layer', async () => {
    const res = await httpClient.request(`http:${svcName}`, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })

  it('should send request and receive response from ws transport layer', async () => {
    const res = await wsClient.request(`ws:${svcName}`, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })

  it('should fail on wrong transport layer', async () => {
    await assert.rejects(
      () => httpClient.request(`ws:${svcName}`, 'ping', ['john', 'hi']),
      (err) => {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, 'ERR_REQUEST_GENERIC: Upgrade Required')
        return true
      }
    )
  })
})
