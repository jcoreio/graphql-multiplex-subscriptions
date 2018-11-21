# graphql-multiplex-subscriptions

[![Build Status](https://travis-ci.org/jcoreio/graphql-multiplex-subscriptions.svg?branch=master)](https://travis-ci.org/jcoreio/graphql-multiplex-subscriptions)
[![Coverage Status](https://codecov.io/gh/jcoreio/graphql-multiplex-subscriptions/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/graphql-multiplex-subscriptions)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/graphql-multiplex-subscriptions.svg)](https://badge.fury.io/js/graphql-multiplex-subscriptions)

If you need to use multiple `PubSubEngines` in your Apollo server (e.g.
`graphql-redis-subscriptions` and `graphql-postgres-subscriptions`), use this
package to coordinate which `PubSubEngine` handles a given topic.

# Usage

Imagine you're currently using `graphql-redis-subscriptions`, and you set up
your `pubsub` like this:

```js
// Before
import { RedisPubSub } from 'graphql-redis-subscriptions'

export const pubsub = new RedisPubSub()
```

But then you decide you want to use `graphql-postgres-subscriptions` for some
topics. All you have to do is create a `MultiplexPubSub` with a `selectEngine`
function that returns which engine you'd like to use for a given topic. For
example, you could use postgres for all topics beginning with `pg/`:

```js
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PostgresPubSub } from 'graphql-postgres-subscriptions'
import { MultiplexPubSub } from 'graphql-multiplex-subscriptions'

const redisPubSub = new RedisPubSub()
const postgresPubSub = new PostgresPubSub()

export const pubsub = new MultiplexPubSub({
  selectEngine: topic =>
    topic.startsWith('pg/') ? postgresPubSub : redisPubSub,
})
```

**WARNING**: `selectEngine` should always return a `PubSubEngine`. If it doesn't,
you will get `TypeError`s!

Since you use a function to select the engine you can use whatever logic you
want. So you could just map specific topics to a specific engine:

```js
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { PostgresPubSub } from 'graphql-postgres-subscriptions'
import { MultiplexPubSub } from 'graphql-multiplex-subscriptions'

const redisPubSub = new RedisPubSub()
const postgresPubSub = new PostgresPubSub()

export const pubsub = new MultiplexPubSub({
  selectEngine: topic =>
    topic.matches(/^(user|organization)\//) ? postgresPubSub : redisPubSub,
})
```
