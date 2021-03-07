import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { PathReporter, failure } from 'io-ts/lib/PathReporter'

export const decoder = <I, A>(name: string, validate: t.Validate<I, A>): t.Decoder<I, A> => ({
  name: name,
  validate: validate,
  decode(i: I): t.Validation<A> {
    // eslint-disable-next-line functional/no-this-expression
    return this.validate(i, [{ key: '', type: this, actual: i }])
  }
})

export const encoder = <A, O>(encode: t.Encode<A, O>): t.Encoder<A, O> => ({ encode })

export const codec = <A, O = A, I = unknown>(
  decoder: t.Decoder<I, A>,
  encoder: t.Encoder<A, O>,
  is: t.Is<A>
): t.Type<A, O, I> => new t.Type<A, O, I>(decoder.name, is, decoder.validate, encoder.encode)

// TODO: Make these extensions to be a wrapper for io-ts that adds additional functions. So we can use t.optional

// eslint-disable-next-line functional/prefer-readonly-type
export type Nullable<RT extends t.Any> = t.UnionC<[RT, t.NullType, t.UndefinedType]>

// TODO: If uncomment return type - compilation fails
export const nullable = <RT extends t.Any>(type: RT, name = `${type.name} | null | undefined`): Nullable<RT> =>
  // eslint-disable-next-line functional/prefer-readonly-type
  t.union<[RT, t.NullType, t.UndefinedType]>([type, t.null, t.undefined], name)

// eslint-disable-next-line functional/prefer-readonly-type
export type Optional<RT extends t.Any> = t.UnionC<[RT, t.UndefinedType]>

export const optional = <RT extends t.Any>(type: RT, name = `${type.name} | undefined`): Optional<RT> =>
  // eslint-disable-next-line functional/prefer-readonly-type
  t.union<[RT, t.UndefinedType]>([type, t.undefined], name)

// eslint-disable-next-line functional/prefer-readonly-type
export type NullUnion<RT extends t.Any> = t.UnionC<[RT, t.NullType]>

export const nullUnion = <RT extends t.Any>(type: RT, name = `${type.name} | null`): NullUnion<RT> =>
  // eslint-disable-next-line functional/prefer-readonly-type
  t.union<[RT, t.NullType]>([type, t.null], name)

// eslint-disable-next-line functional/no-class
export class EnumType<A> extends t.Type<A> {
  public readonly _tag: 'EnumType' = 'EnumType'
  // eslint-disable-next-line @typescript-eslint/ban-types
  public readonly enumObject!: object

  // eslint-disable-next-line @typescript-eslint/ban-types
  public constructor(e: object, name = 'enum') {
    super(
      name,
      // eslint-disable-next-line functional/no-this-expression
      (u): u is A => Object.values(this.enumObject).some((v) => v === u),
      // eslint-disable-next-line functional/no-this-expression
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity
    )
    // eslint-disable-next-line functional/no-this-expression
    this.enumObject = e
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const createEnumType = <T>(e: object, name?: string): EnumType<T> => new EnumType<T>(e, name)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateError = (decoder: t.Mixed, value: any): ReadonlyArray<string> => {
  const result = decoder.decode(value)
  return PathReporter.report(result)
}

export const unsafeDecode = <T, I, A extends t.Decoder<I, T>>(decoder: A): ((value: I) => T) => (value) =>
  pipe(
    decoder.decode(value),
    E.getOrElse<t.Errors, T>((e) => {
      // eslint-disable-next-line
      throw failure(e)
    })
  )
