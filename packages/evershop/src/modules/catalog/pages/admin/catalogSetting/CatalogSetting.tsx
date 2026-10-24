// Modified for Ordex on 20 October 2026.
import { SettingsLayout } from '@components/admin/SettingsLayout.js';
import { CatalogImagePreview } from '@components/admin/SettingsPreviews.js';
import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  ProductRecommendations,
  ProductRecommendationsProps
} from './ProductRecommendations.js';

interface CatalogSettingProps {
  saveSettingApi: string;
  setting: ProductRecommendationsProps['setting'] & {
    catalogShowOutOfStockProduct?: boolean;
    catalogCollectionPageSize?: number;
    catalogProductImageWidth?: number;
    catalogProductImageHeight?: number;
  };
  recomputeApi: string;
  recommendationStatSummary: ProductRecommendationsProps['recommendationStatSummary'];
  attributes?: ProductRecommendationsProps['attributes'];
}

export default function CatalogSetting({
  saveSettingApi,
  setting,
  recomputeApi,
  recommendationStatSummary,
  attributes
}: CatalogSettingProps) {
  const form = useForm({ shouldUnregister: true, shouldFocusError: false });
  return (
    <SettingsLayout
      title={_('Catalog settings')}
      description={_('Fine-tune product listings, images and recommendations.')}
      formId="catalogSetting"
      preview={<CatalogImagePreview control={form.control} initial={setting}/>}
      saving={form.formState.isSubmitting}
    >
      <Form
        form={form}
        submitBtn={false}
        id="catalogSetting"
        method="POST"
        action={saveSettingApi}
        successMessage={_('Catalog settings have been saved successfully!')}
      >
        <div className="grid grid-cols-1 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>{_('Product listing')}</CardTitle>
              <CardDescription>
                {_('Control how products appear in storefront listings.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5">
                <ToggleField
                  name="catalogShowOutOfStockProduct"
                  label={_('Show out of stock products')}
                  defaultValue={setting.catalogShowOutOfStockProduct ?? false}
                  helperText={_(
                    'When enabled, products with no available stock stay visible on the storefront.'
                  )}
                />
                <InputField
                  type="number"
                  name="catalogCollectionPageSize"
                  label={_('Products per page')}
                  defaultValue={setting.catalogCollectionPageSize ?? 20}
                  min={1}
                  helperText={_(
                    'Number of products shown per page on category and collection listings.'
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{_('Product images')}</CardTitle>
              <CardDescription>
                {_(
                  'Set the image proportions and maximum resolution used across the storefront.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-5">
                <InputField
                  type="number"
                  name="catalogProductImageWidth"
                  label={_('Original image width (px)')}
                  defaultValue={setting.catalogProductImageWidth ?? 1200}
                  min={1}
                  helperText={_(
                    'The width of your original product images. 1920px or larger is recommended so the product-page zoom stays sharp on large, high-density screens.'
                  )}
                />
                <InputField
                  type="number"
                  name="catalogProductImageHeight"
                  label={_('Original image height (px)')}
                  defaultValue={setting.catalogProductImageHeight ?? 1200}
                  min={1}
                  helperText={_(
                    'The height of your original product images. Width ÷ height is the aspect ratio applied to every product image.'
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <ProductRecommendations
            recomputeApi={recomputeApi}
            setting={setting}
            recommendationStatSummary={recommendationStatSummary}
            attributes={attributes}
          />
        </div>
      </Form>
    </SettingsLayout>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    recomputeApi: url(routeId: "recomputeRecommendationStats")
    setting {
      storeTimeZone
      catalogShowOutOfStockProduct
      catalogCollectionPageSize
      catalogProductImageWidth
      catalogProductImageHeight
      relatedProductsRules {
        enabled
        rules {
          type
          enabled
          attributeCodes
          scope
        }
        priceBand {
          enabled
          percent
        }
        fallbackToBestsellers
      }
      crossSellMinPairCount
      crossSellMinAnchorOrders
      crossSellMinLift
      crossSellFallbackEnabled
    }
    recommendationStatSummary {
      computedAt
      totalOrderCount
      pairCount
    }
    attributes(filters: [{key: "type", operation: eq, value: "select"}, {key: "limit", operation: eq, value: "100"}]) {
      items {
        attributeCode
        attributeName
      }
    }
  }
`;
