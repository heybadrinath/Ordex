import { describe, expect, it } from '@jest/globals';
import { productSectionForField } from '../../ProductEditor.js';

describe('Product editor validation navigation', () => {
  it('opens the section that contains a hidden invalid field', () => {
    expect(productSectionForField('qty')).toBe('inventory');
    expect(productSectionForField('attributes')).toBe('options');
    expect(productSectionForField('meta_title')).toBe('search');
    expect(productSectionForField('images')).toBe('media');
    expect(productSectionForField('weight')).toBe('shipping');
    expect(productSectionForField('name')).toBe('details');
  });
});
