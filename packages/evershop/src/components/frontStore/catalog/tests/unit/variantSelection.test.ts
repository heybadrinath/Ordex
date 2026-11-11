import '../../../customer/address/tests/unit/domSetup.js';
import { describe, expect, it } from '@jest/globals';
import { processAttributes } from '../../VariantSelector.js';
import type { VariantGroup } from '../../ProductContext.js';
const group: VariantGroup = {
  variantAttributes: [
    {
      attributeId: 1,
      attributeCode: 'color',
      attributeName: 'Color',
      options: [
        { optionId: 1, optionText: 'White' },
        { optionId: 2, optionText: 'Yellow' }
      ]
    }
  ],
  items: [
    { attributes: [{ attributeCode: 'color', optionId: 1 }] },
    { attributes: [{ attributeCode: 'color', optionId: 2 }] }
  ]
};
describe('Direct product variant selection', () => {
  it('preselects the options of the product being viewed', () => {
    const attributes = processAttributes(
      group,
      group.variantAttributes,
      '/yellow-cup',
      [{ attributeCode: 'color', optionId: 2 }]
    );
    expect(attributes[0].selected).toBe(true);
    expect(attributes[0].selectedOption).toBe(2);
  });
  it('keeps an explicit query choice ahead of the product default', () => {
    const attributes = processAttributes(
      group,
      group.variantAttributes,
      '/yellow-cup?color=1',
      [{ attributeCode: 'color', optionId: 2 }]
    );
    expect(attributes[0].selectedOption).toBe(1);
  });
  it('does not silently substitute a default for an invalid choice', () => {
    const attributes = processAttributes(
      group,
      group.variantAttributes,
      '/yellow-cup?color=99',
      [{ attributeCode: 'color', optionId: 2 }]
    );
    expect(attributes[0].selected).toBe(false);
  });
});
