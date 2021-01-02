import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { PathReporter, failure } from 'io-ts/lib/PathReporter'
import { OptionalType } from '@digital-magic/ts-common-utils/lib/type'

export const decoder = <I, A>(name: string, validate: t.Validate<I, A>): t.Decoder<I, A> => ({
  name: name,
  validate: validate,
  decode(i: I): t.Validation<A> {
    return this.validate(i, [{ key: '', type: this, actual: i }])
  }
})

export const encoder = <A, O>(encode: t.Encode<A, O>): t.Encoder<A, O> => ({ encode })

export const codec = <A, O = A, I = unknown>(decoder: t.Decoder<I, A>, encoder: t.Encoder<A, O>, is: t.Is<A>) =>
  new t.Type<A, O, I>(decoder.name, is, decoder.validate, encoder.encode)

// TODO: Make these extensions to be a wrapper for io-ts that adds additional functions. So we can use t.optional

export type Optional<RT extends t.Any> = t.UnionType<
  // tslint:disable-next-line:readonly-array
  [RT, t.UndefinedType],
  OptionalType<t.TypeOf<RT>>,
  OptionalType<t.OutputOf<RT>>,
  OptionalType<t.InputOf<RT>>
>

export const optional = <RT extends t.Any>(type: RT, name: string = `${type.name} | undefined`): Optional<RT> =>
  // tslint:disable-next-line:readonly-array
  t.union<[RT, t.UndefinedType]>([type, t.undefined], name)

export class EnumType<A> extends t.Type<A> {
  public readonly _tag: 'EnumType' = 'EnumType'
  public readonly enumObject!: object

  public constructor(e: object, name?: string) {
    super(
      name || 'enum',
      (u): u is A => Object.values(this.enumObject).some((v) => v === u),
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity
    )
    this.enumObject = e
  }
}

export const createEnumType = <T>(e: object, name?: string): EnumType<T> => new EnumType<T>(e, name)

export const generateError = (decoder: t.Mixed, value: any): ReadonlyArray<string> => {
  const result = decoder.decode(value)
  return PathReporter.report(result)
}

export const unsafeDecode = <T, I, A extends t.Decoder<I, T>>(decoder: A): ((value: I) => T) => (value) =>
  pipe(
    decoder.decode(value),
    E.getOrElse<t.Errors, T>((e) => {
      throw failure(e)
    })
  )
