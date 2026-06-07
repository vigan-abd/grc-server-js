'use strict'

/* eslint-env mocha */

const assert = require('assert')
const createGrapes = require('@bitfinex/bfx-svc-test-helper/grapes')
const { GrcHttpClient } = require('@vigan-abd/grc-client')
const { GrcHttpWrk } = require('../')

class SampleWrk extends GrcHttpWrk {
  ping (from, message) {
    return { to: from, message }
  }
}

describe('grc.http.wrk.js tests', () => {
  const grape = 'http://127.0.0.1:30001'
  const svcName = 'rest:sample:wrk'
  const client = new GrcHttpClient({ grape })
  const grapes = createGrapes({})
  const wrk = new SampleWrk({ name: svcName, port: 7070, grape })

  before(async function () {
    this.timeout(5000)

    await grapes.start()
    client.start()
    await wrk.start()
  })

  after(async function () {
    this.timeout(5000)

    client.stop()
    wrk.stop()
    await grapes.stop()
  })

  it('should send and receive response', async () => {
    const res = await client.request(svcName, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })
})
