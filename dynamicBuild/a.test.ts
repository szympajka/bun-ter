// @ts-nocheck -- Bun doesn't yet export `bun:test` types
import { add } from './a';

test('add', () => {
  expect(add(1, 2)).toBe(3);
})