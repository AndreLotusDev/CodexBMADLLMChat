import { buildAnnotationKey } from '../lib/utils'

it('buildAnnotationKey returns table-level key with trailing dot when columnName is null', () => {
  expect(buildAnnotationKey('public', 'users', null)).toBe('public.users.')
})

it('buildAnnotationKey returns column-level key when columnName is provided', () => {
  expect(buildAnnotationKey('public', 'users', 'email')).toBe('public.users.email')
})

it('buildAnnotationKey works with non-public schemas', () => {
  expect(buildAnnotationKey('auth', 'sessions', null)).toBe('auth.sessions.')
})
