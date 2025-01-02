import Fastify from 'fastify'
import fastifyAcceptsSerializer from '..'
import { expectError } from 'tsd'

const fastify = Fastify()

// Global serializers
fastify.register(fastifyAcceptsSerializer, {
  serializers: [
    {
      regex: /^application\/json$/,
      serializer: body => JSON.stringify(body)
    }
  ],
  default: 'application/json' // MIME type used if Accept header don't match anything
})

expectError(fastify.register(fastifyAcceptsSerializer, { }))
expectError(fastify.register(fastifyAcceptsSerializer, { serializers: [], default: 1 }))
expectError(fastify.register(fastifyAcceptsSerializer, { serializers: [{}], default: 'application/json' }))

// Per-router serializers
fastify.get('/request', {
  config: {
    serializers: [
      {
        regex: /^application\/json$/,
        serializer: body => JSON.stringify(body)
      }
    ]
  }
}, function (_req, reply) {
  reply.send({ pippo: 'pluto' })
})
