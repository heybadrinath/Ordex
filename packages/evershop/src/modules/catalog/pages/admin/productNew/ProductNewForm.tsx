import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { ProductEditor } from '@components/admin/ProductEditor.js';
import { Form } from '@components/common/form/Form.js';
import { toast } from '@components/common/ui/Sonner.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export default function ProductNewForm({
  action,
  gridUrl,
  setting
}: {
  action: string;
  gridUrl: string;
  setting: { storeCurrency: string };
}) {
  const form = useForm({
    shouldUnregister: true
  });
  const submit: SubmitHandler<any> = async (data) => {
    try {
      const images = (data.images || []).map(
        (image: { uuid: string; url: string }) => image.url
      );
      data.images = images;
      const response = await fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, action: undefined, method: undefined })
      });
      const result = await response.json();
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(_('Product created successfully'));
        const editUrl = result.data.links.find(
          (link) => link.rel === 'edit'
        ).href;
        setTimeout(() => {
          window.location.href = editUrl;
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <Form
      id="productNewForm"
      demoProfile="product"
      method="POST"
      action={action}
      form={form}
      onSubmit={submit}
      submitBtn={false}
    >
      <ProductEditor currency={setting.storeCurrency}>
        <div className="editor-left">
          <Area id="leftSide" noOuter />
        </div>
        <div className="editor-right">
          <Area id="rightSide" noOuter />
        </div>
      </ProductEditor>
      <FormButtons
        formId="productNewForm"
        cancelUrl={gridUrl}
        submitLabel="Create product"
      />
    </Form>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    action: url(routeId: "createProduct"),
    gridUrl: url(routeId: "productGrid")
    setting { storeCurrency }
  }
`;
