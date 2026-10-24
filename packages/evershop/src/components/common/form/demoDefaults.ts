export type DemoProfile =
  | 'product'
  | 'category'
  | 'collection'
  | 'attribute'
  | 'registration'
  | 'package'
  | 'shippingMethod';

export function demoDefaults(
  profile: DemoProfile,
  token: string
): Record<string, unknown> {
  const description =
    'A thoughtful everyday essential. Sample content for exploring the store.';
  switch (profile) {
    case 'product':
      return {
        name: 'Everyday ceramic cup',
        sku: `DEMO-CUP-${token.toUpperCase()}`,
        price: 790,
        qty: 24,
        weight: 350,
        url_key: `everyday-ceramic-cup-${token}`,
        meta_title: 'Everyday ceramic cup · Ordex',
        meta_description: description
      };
    case 'category':
      return {
        name: 'Everyday essentials',
        url_key: `everyday-essentials-${token}`,
        meta_title: 'Everyday essentials · Ordex',
        meta_description: description
      };
    case 'collection':
      return { name: 'The weekend edit', code: `weekend-edit-${token}` };
    case 'attribute':
      return {
        attribute_name: 'Material',
        attribute_code: `material_${token}`,
        type: 'text'
      };
    case 'registration':
      return {
        full_name: 'Alex Morgan',
        email: `alex.${token}@ordex.example`,
        password: 'Explore123!'
      };
    case 'shippingMethod':
      return { name: `Sample delivery ${token}` };
    case 'package':
      return {
        name: `Small parcel ${token}`,
        length: 25,
        width: 18,
        height: 12
      };
  }
}

export function isBlankDemoField(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export const demoAddress = {
  recipient: 'Alex Morgan',
  given_name: 'Alex',
  family_name: 'Morgan',
  address_line_1: '24 Sample Lane',
  address_line_2: 'Demo Gardens',
  locality: 'Bengaluru',
  administrative_area: 'IN-KA',
  postal_code: '560001',
  country: 'IN',
  telephone: '+919000000000'
};
