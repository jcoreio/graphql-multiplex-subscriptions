// @flow

import type { PubSubEngine } from 'graphql-subscriptions'
import { PubSubAsyncIterator } from 'graphql-redis-subscriptions/dist/pubsub-async-iterator'

export type MultiplexPubSubOptions = {|
  +selectEngine: (trigger: string) => PubSubEngine,
|}

export class MultiplexPubSub implements PubSubEngine {
  _selectEngine: (trigger: string) => PubSubEngine
  _nextSubId: number = 0
  _subIdMap: Map<number, { subId: number, engine: PubSubEngine }> = new Map()

  constructor({ selectEngine }: MultiplexPubSubOptions) {
    this._selectEngine = selectEngine
  }

  async publish(trigger: string, payload: any): Promise<void> {
    this._selectEngine(trigger).publish(trigger, payload)
  }

  async subscribe(
    trigger: string,
    onMessage: Function,
    options?: Object
  ): Promise<number> {
    const engine = this._selectEngine(trigger)
    const subId = this._nextSubId++
    const engineSubId = await engine.subscribe(trigger, onMessage, options)
    this._subIdMap.set(subId, { subId: engineSubId, engine })
    return subId
  }

  unsubscribe(subId: number) {
    const mapping = this._subIdMap.get(subId)
    if (!mapping) return
    this._subIdMap.delete(subId)
    mapping.engine.unsubscribe(mapping.subId)
  }

  asyncIterator<T>(triggers: Array<string> | string): AsyncIterator<T> {
    return new PubSubAsyncIterator(this, triggers)
  }
}
