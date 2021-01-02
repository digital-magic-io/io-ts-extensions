import assert from 'assert'
import * as t from 'io-ts'
import * as E from 'fp-ts/Either'
import { codec, createEnumType, decoder, encoder, optional, unsafeDecode } from '../src'
import { isNotEmptyString } from '@digital-magic/ts-common-utils/lib/type'

describe('index', () => {
  it('encoder, decoder, codec', () => {
    const NonEmptyStringEncoder = encoder<string, string>((v) => v)
    const NonEmptyStringDecoder = decoder<string, string>('NonEmptyString', (u, c) =>
      E.either.chain(t.string.validate(u, c), (v) =>
        isNotEmptyString(v) ? t.success(v) : t.failure(u, c, 'Empty string is not allowed')
      )
    )
    const NonEmptyStringCodec = codec(NonEmptyStringDecoder, NonEmptyStringEncoder, t.string.is)

    assert.strictEqual(NonEmptyStringCodec.encode('str'), 'str')
    assert.strictEqual(NonEmptyStringCodec.encode(''), '')
    assert.strictEqual(E.isRight(NonEmptyStringCodec.decode('str')), true)
    assert.strictEqual(E.isLeft(NonEmptyStringCodec.decode('')), true)
  })
  it('Optional', () => {
    const OptionalString = optional(t.string, 'Optional String')
    assert.strictEqual(E.isRight(t.string.decode(undefined)), false)
    assert.strictEqual(E.isRight(OptionalString.decode(undefined)), true)
  })
  it('createEnumType', () => {
    enum Sex {
      Male = 'M',
      Female = 'F'
    }
    const SexV = createEnumType<Sex>(Sex, 'Sex')
    assert.strictEqual(E.isRight(SexV.decode('M')), true)
    assert.strictEqual(E.isRight(SexV.decode('F')), true)
    assert.strictEqual(E.isRight(SexV.decode('A')), false)
  })
  it('unsafeDecode', () => {
    const decode = unsafeDecode<number, any, t.NumberC>(t.number)
    assert.strictEqual(decode(1), 1)
    assert.throws(() => decode('1'))
    assert.throws(() => decode(''))
    assert.throws(() => decode(undefined))
    assert.throws(() => decode(null))
  })
})
