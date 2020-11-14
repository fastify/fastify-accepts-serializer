'use strict'

class Serializer {
  constructor (configuration) {
    this.regex = configuration.regex
    this.serializeFunction = configuration.serializer
  }

  isAble (type) {
    return this.regex.test(type)
  }
}

class SerializerManager {
  constructor (configuration) {
    this.serializers = configuration.serializers
    this.cache = {}
  }

  findSerializer (types) {
    const cacheValue = this.cache[types]
    if (cacheValue) return cacheValue

    for (let i = 0; i < types.length; i++) {
      const type = types[i]

      for (let j = 0; j < this.serializers.length; j++) {
        const serializer = this.serializers[j]
        if (serializer.isAble(type)) {
          this.cache[types] = { serializer, type }
          return { serializer, type }
        }
      }
    }
    return {}
  }

  getSupportedTypes () {
    return this.serializers.map(s => s.regex)
  }
}

SerializerManager.build = function (options) {
  options = options || {}
  options.serializers = options.serializers || []
  return SerializerManager.expand(options, { serializers: [] })
}

SerializerManager.expand = function (options, fallbackSerializer) {
  options = options || {}
  options.serializers = options.serializers || []

  const serializers = options.serializers.map(c => new Serializer(c))
  return new SerializerManager({
    serializers: serializers.concat(fallbackSerializer.serializers)
  })
}

module.exports = SerializerManager
