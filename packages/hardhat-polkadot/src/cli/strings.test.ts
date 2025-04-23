import { describe, it, expect } from 'vitest';
import { pluralize } from './strings'; // Replace with actual path

describe('pluralize', () => {
  it('returns the singular form when n === 1', () => {
    expect(pluralize(1, 'cat')).toBe('cat');
  });

  it('returns singular + "s" when n !== 1 and no custom plural is provided', () => {
    expect(pluralize(0, 'dog')).toBe('dogs');
    expect(pluralize(2, 'car')).toBe('cars');
    expect(pluralize(-5, 'apple')).toBe('apples');
  });

  it('returns the custom plural form when provided and n !== 1', () => {
    expect(pluralize(2, 'person', 'people')).toBe('people');
    expect(pluralize(0, 'child', 'children')).toBe('children');
    expect(pluralize(3, 'mouse', 'mice')).toBe('mice');
  });

  it('returns singular + "s" even for edge case singular forms if plural is not specified', () => {
    expect(pluralize(4, 'bus')).toBe('buss');
    expect(pluralize(3, 'class')).toBe('classs');
    expect(pluralize(2, 'box')).toBe('boxs');
  });
});
