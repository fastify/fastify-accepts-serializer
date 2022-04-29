'use strict'

const fp = require('fastify-plugin')
const SerializerManager = require('./SerializerManager')

const FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE = 'application/json'

function acceptsSerializerPlugin (fastify, options, next) {
  const serializerCache = {}
  options.cache = serializerCache

  const globalSerializerManager = SerializerManager.build(options)

  const defaultSerializer = globalSerializerManager.findSerializer([options.default])

  fastify.register(require('@fastify/accepts'))

  fastify.addHook('preHandler', (request, reply, done) => {
    const types = request.types()
    let serializer
    let type

    if (reply.context.config.serializers) {
      // keep route level cache in config to prevent messing with global cache
      reply.context.config.serializers.cache = Object.assign({}, reply.context.config.serializers.cache)
      reply.serializer.serializerManager = SerializerManager.expand({
        serializers: reply.context.config.serializers,
        cache: reply.context.config.serializers.cache
      }, globalSerializerManager)
    } else {
      // use global serializer
      reply.serializer.cache = serializerCache
      reply.serializer.serializerManager = SerializerManager.expand(reply.serializer, globalSerializerManager)
    }

    const serializerManager = reply.serializer.serializerManager

    const s = serializerManager.findSerializer(types)
    serializer = s.serializer
    type = s.type

    if (!serializer && defaultSerializer) {
      serializer = defaultSerializer.serializer
      type = defaultSerializer.type
    }

    if (!serializer &&
            options.default !== FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE &&
            !request.type(FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE)) {
      const supportedTypes = serializerManager.getSupportedTypes()
        .concat([FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE])

      const notAcceptable = new Error('Allowed: ' + supportedTypes.join(','))
      return reply.type(FASTIFY_DEFAULT_SERIALIZE_MIME_TYPE).code(406).send(notAcceptable)
    }

    if (serializer) {
      reply.type(type)
      reply.serializer(serializer.serializeFunction)
    }

    done()
  })
  next()
}

module.exports = fp(acceptsSerializerPlugin, {
  fastify: '>=3.x',
  name: 'fastify-accepts-serializer'
})
