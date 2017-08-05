'use strict'

const fp = require('fastify-plugin')
const Boom = require('boom')

const SerializerManager = require('./SerializerManager')

const FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE = 'application/json'

function acceptsSerializerPlugin (fastify, options, next) {
  const globalSerializerManager = SerializerManager.build(options)

  const defaultSerializer = globalSerializerManager.findSerializer([options.default])

  fastify.register(require('fastify-accepts'), err => {
    /* istanbul ignore next */
    if (err) return next(err)

    fastify.addHook('preHandler', (request, reply, done) => {
      const types = request.types()
      let serializer
      let type

      if (!reply.store.config.serializer) {
        reply.store.config.serializer = {}
      }

      if (!reply.store.config.serializer.serializerManager) {
        reply.store.config.serializer.serializerManager = SerializerManager.expand(reply.store.config.serializer, globalSerializerManager)
      }

      const serializerManager = reply.store.config.serializer.serializerManager

      const s = serializerManager.findSerializer(types)
      serializer = s.serializer
      type = s.type

      if (!serializer && defaultSerializer) {
        serializer = defaultSerializer.serializer
        type = defaultSerializer.type
      }

      if (!serializer && options.default !== FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE) {
        return reply.code(406).type('application/json').send(Boom.notAcceptable('Allowed: ' + serializerManager.getSupportedTypes().join(',')))
      }

      if (serializer) {
        reply.type(type)
        reply._serializer = serializer.serializeFunction
      }

      done()
    })

    next()
  })
}

module.exports = fp(acceptsSerializerPlugin)
