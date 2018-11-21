/**
 * @flow
 * @prettier
 */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import { PubSub } from 'graphql-subscriptions'
import { MultiplexPubSub } from '../src'

describe(`MultiplexPubSub`, function() {
  describe(`publish`, function() {
    it(`works`, async function(): Promise<void> {
      const foo = new PubSub()
      const bar = new PubSub()

      const root = new MultiplexPubSub({
        selectEngine: topic => (topic.startsWith('foo/') ? foo : bar),
      })

      const onFooMessage = sinon.spy()
      const onBarMessage = sinon.spy()

      await foo.subscribe('foo/1', onFooMessage)
      await foo.subscribe('foo/2', onFooMessage)
      await bar.subscribe('bar/1', onBarMessage)
      await bar.subscribe('bar/2', onBarMessage)

      let count = 0
      await root.publish('foo/1', { count: count++ })
      await root.publish('foo/2', { count: count++ })
      await root.publish('bar/1', { count: count++ })
      await root.publish('bar/2', { count: count++ })

      expect(onFooMessage.args).to.deep.equal([[{ count: 0 }], [{ count: 1 }]])
      expect(onBarMessage.args).to.deep.equal([[{ count: 2 }], [{ count: 3 }]])
    })
  })
  describe(`subscribe/unsubscribe`, function() {
    it(`works`, async function(): Promise<void> {
      const foo = new PubSub()
      const bar = new PubSub()

      const root = new MultiplexPubSub({
        selectEngine: topic => (topic.startsWith('foo/') ? foo : bar),
      })

      const onFooMessage = sinon.spy()
      const onBarMessage = sinon.spy()

      await root.subscribe('foo/1', onFooMessage)
      const fooSub2 = await root.subscribe('foo/2', onFooMessage)
      const barSub1 = await root.subscribe('bar/1', onBarMessage)
      await root.subscribe('bar/2', onBarMessage)

      let count = 0
      await foo.publish('foo/1', { count: count++ })
      await foo.publish('foo/2', { count: count++ })
      await bar.publish('bar/1', { count: count++ })
      await bar.publish('bar/2', { count: count++ })

      expect(onFooMessage.args).to.deep.equal([[{ count: 0 }], [{ count: 1 }]])
      expect(onBarMessage.args).to.deep.equal([[{ count: 2 }], [{ count: 3 }]])

      onFooMessage.resetHistory()
      onBarMessage.resetHistory()

      root.unsubscribe(fooSub2)
      root.unsubscribe(barSub1)

      await foo.publish('foo/1', { count: count++ })
      await foo.publish('foo/2', { count: count++ })
      await bar.publish('bar/1', { count: count++ })
      await bar.publish('bar/2', { count: count++ })

      expect(onFooMessage.args).to.deep.equal([[{ count: 4 }]])
      expect(onBarMessage.args).to.deep.equal([[{ count: 7 }]])
    })
  })
  describe(`unsubscribe`, function() {
    it(`ignores bogus subIds`, function() {
      const foo = new PubSub()
      const bar = new PubSub()

      const root = new MultiplexPubSub({
        selectEngine: topic => (topic.startsWith('foo/') ? foo : bar),
      })

      root.unsubscribe(-182341)
    })
  })
  describe(`asyncIterator`, function() {
    it(`works`, async function(): Promise<void> {
      const foo = new PubSub()
      const bar = new PubSub()

      const root = new MultiplexPubSub({
        selectEngine: topic => (topic.startsWith('foo/') ? foo : bar),
      })

      const iterator = root.asyncIterator(['foo/1', 'bar/1', 'bar/2'])

      let count = 0
      await foo.publish('foo/1', { count: count++ })
      await foo.publish('foo/2', { count: count++ })
      await bar.publish('bar/1', { count: count++ })
      await bar.publish('bar/2', { count: count++ })

      const results = []
      for (let i = 0; i < 3; i++) {
        results.push((await iterator.next(): any).value)
      }

      expect(results.sort((a, b) => a.count - b.count)).to.deep.equal([
        { count: 0 },
        { count: 2 },
        { count: 3 },
      ])
    })
  })
})
