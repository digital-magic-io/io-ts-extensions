import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { PathReporter, failure } from 'io-ts/lib/PathReporter'
import { NullableType, NullUnionType, OptionalType } from '@digital-magic/ts-common-utils/lib/type'

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

export type Nullable<RT extends t.Any> = t.UnionType<
  // tslint:disable-next-line:readonly-array
  [RT, t.NullType, t.UndefinedType],
  NullableType<t.TypeOf<RT>>,
  NullableType<t.OutputOf<RT>>,
  NullableType<t.InputOf<RT>>

  // t.TypeOf<RT> | null | undefined,
  // t.OutputOf<RT> | null | undefined,
  // t.InputOf<RT> | null | undefined

  // t.TypeOf<RT | t.NullC | t.UndefinedC>,
  // t.OutputOf<RT | t.NullC | t.UndefinedC>,
  // t.InputOf<RT | t.NullC | t.UndefinedC>
>

// TODO: If uncomment return type - compilation fails
export const nullable = <RT extends t.Any>(
  type: RT,
  name: string = `${type.name} | null | undefined`
) /*: Nullable<RT>*/ =>
  // tslint:disable-next-line:readonly-array
  t.union<[RT, t.NullType, t.UndefinedType]>([type, t.null, t.undefined], name)

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

export type NullUnion<RT extends t.Any> = t.UnionType<
  // tslint:disable-next-line:readonly-array
  [RT, t.NullType],
  NullUnionType<t.TypeOf<RT>>,
  NullUnionType<t.OutputOf<RT>>,
  NullUnionType<t.InputOf<RT>>
>

export const nullUnion = <RT extends t.Any>(type: RT, name: string = `${type.name} | null`): NullUnion<RT> =>
  // tslint:disable-next-line:readonly-array
  t.union<[RT, t.NullType]>([type, t.null], name)

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
