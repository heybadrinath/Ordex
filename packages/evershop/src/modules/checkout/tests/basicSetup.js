process.env.ALLOW_CONFIG_MUTATIONS = true;
import config from 'config';
import { addProcessor, addFinalProcessor } from '../../../lib/util/registry.js';
import { registerCartBaseFields } from '../services/cart/registerCartBaseFields.js';
import { registerCartItemBaseFields } from '../services/cart/registerCartItemBaseFields.js';
import { sortFields } from '../services/cart/sortFields.js';
import { products } from './products.js';
import { taxRates } from './taxRates.js';
import { registerCartPromotionFields } from '../../promotion/services/registerCartPromotionFields.js';
import { registerCartItemPromotionFields } from '../../promotion/services/registerCartItemPromotionFields.js';
import { coupons } from './coupons.js';
import { registerDefaultValidators } from '../../promotion/services/registerDefaultValidators.js';
import { registerDefaultCalculators } from '../../promotion/services/registerDefaultCalculators.js';

// These isolated calculation tests exercise EverShop's coupon math. The Ordex
// runtime disables coupon routes, so enable the validator only in this fixture.
const disabledRoutes = config.get('system.disabledRoutes') || [];
config.util.extendDeep(config, {
  system: {
    disabledRoutes: disabledRoutes.filter((route) => route !== 'couponApply')
  }
});

// Default tax configuration
addProcessor('cartFields', registerCartBaseFields, 0);
addProcessor('cartFields', registerCartPromotionFields, 0);
addProcessor('cartItemFields', registerCartItemBaseFields, 0);
addProcessor('cartItemFields', registerCartItemPromotionFields, 0);
addProcessor(
  'cartItemFields',
  (fields) => {
    fields.push({
      key: 'tax_percent',
      resolvers: [
        function resolver() {
          const classId = this.getData('tax_class_id');
          return taxRates[classId] || 0;
        }
      ],
      dependencies: ['tax_class_id']
    });
    return fields;
  },
  0
);

addFinalProcessor('cartFields', (fields) => {
  try {
    const sortedFields = sortFields(fields);
    return sortedFields;
  } catch (e) {
    error(e);
    throw e;
  }
});

addFinalProcessor('cartItemFields', (fields) => {
  try {
    const sortedFields = sortFields(fields);
    return sortedFields;
  } catch (e) {
    error(e);
    throw e;
  }
});

addProcessor('cartItemProductLoaderFunction', () => {
  return (id) => {
    return products.find((product) => product.product_id === id);
  };
});

addProcessor('couponLoaderFunction', () => {
  return (code) => {
    return coupons.find((coupon) => coupon.coupon === code);
  };
});

addProcessor('couponValidatorFunctions', registerDefaultValidators);
addProcessor('discountCalculatorFunctions', registerDefaultCalculators);
