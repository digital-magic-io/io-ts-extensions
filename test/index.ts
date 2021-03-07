import assert from 'assert'
import * as t from 'io-ts'
import * as E from 'fp-ts/Either'
import {
  codec,
  createEnumType,
  decoder,
  encoder,
  nullable,
  optional,
  nullUnion,
  unsafeDecode,
  generateError
} from '../src'
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

    assert.strictEqual(E.isRight(NonEmptyStringDecoder.decode('str')), true)
    assert.strictEqual(E.isLeft(NonEmptyStringDecoder.decode('')), true)

    assert.strictEqual(NonEmptyStringCodec.encode('str'), 'str')
    assert.strictEqual(NonEmptyStringCodec.encode(''), '')

    assert.strictEqual(E.isRight(NonEmptyStringCodec.decode('str')), true)
    assert.strictEqual(E.isLeft(NonEmptyStringCodec.decode('')), true)
  })
  it('Nullable', () => {
    const NullableString = nullable(t.string, 'NullableString')
    assert.strictEqual(E.isRight(t.string.decode(undefined)), false)
    assert.strictEqual(E.isRight(t.string.decode(null)), false)
    assert.strictEqual(E.isRight(t.string.decode('test')), true)
    assert.strictEqual(E.isRight(NullableString.decode(undefined)), true)
    assert.strictEqual(E.isRight(NullableString.decode(null)), true)
    assert.strictEqual(E.isRight(NullableString.decode('test')), true)
  })
  it('Optional', () => {
    const OptionalString = optional(t.string, 'OptionalString')
    assert.strictEqual(E.isRight(t.string.decode(undefined)), false)
    assert.strictEqual(E.isRight(t.string.decode(null)), false)
    assert.strictEqual(E.isRight(t.string.decode('test')), true)
    assert.strictEqual(E.isRight(OptionalString.decode(undefined)), true)
    assert.strictEqual(E.isRight(OptionalString.decode(null)), false)
    assert.strictEqual(E.isRight(OptionalString.decode('test')), true)
  })
  it('NullUnion', () => {
    const NullUnion = nullUnion(t.string, 'NullUnion')
    assert.strictEqual(E.isRight(t.string.decode(undefined)), false)
    assert.strictEqual(E.isRight(t.string.decode(null)), false)
    assert.strictEqual(E.isRight(t.string.decode('test')), true)
    assert.strictEqual(E.isRight(NullUnion.decode(undefined)), false)
    assert.strictEqual(E.isRight(NullUnion.decode(null)), true)
    assert.strictEqual(E.isRight(NullUnion.decode('test')), true)
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

    const Sex2V = createEnumType<Sex>(Sex)
    assert.strictEqual(E.isRight(Sex2V.decode('A')), false)
  })
  it('generateError', () => {
    assert.strictEqual(generateError(t.string, 12).includes('Invalid value 12 supplied to : string'), true)
  })
  it('unsafeDecode', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decode = unsafeDecode<number, any, t.NumberC>(t.number)
    assert.strictEqual(decode(1), 1)
    assert.throws(() => decode('1'))
    assert.throws(() => decode(''))
    assert.throws(() => decode(undefined))
    assert.throws(() => decode(null))
  })
})
