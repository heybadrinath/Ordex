// Modified for Ordex on 19 October 2026.
import Area from '@components/common/Area.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { PasswordField } from '@components/common/form/PasswordField.js';
import { Button } from '@components/common/ui/Button.js';
import { useCustomerDispatch } from '@components/frontStore/customer/CustomerContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { cn } from '@evershop/evershop/lib/util/cn';
import { LockKeyhole, Mail } from 'lucide-react';
import React from 'react';

function DemoProfiles() {
  const { setValue } = useFormContext();
  return (
    <div className="demo-profiles" aria-label="Demo customer accounts">
      {[
        ['Maya', 'maya@ordex.example'],
        ['Arjun', 'arjun@ordex.example']
      ].map(([name, email]) => (
        <button
          key={email}
          type="button"
          onClick={() => {
            setValue('email', email);
            setValue('password', 'Explore123!');
          }}
        >
          Use {name}'s account
        </button>
      ))}
    </div>
  );
}

const SubmitButton: React.FC<{ formId: string }> = ({ formId }) => {
  const {
    formState: { isSubmitting }
  } = useFormContext();
  return (
    <div className="form-submit-button flex border-t border-border mt-4 pt-4 justify-between">
      <Button
        className={'w-full'}
        size={'lg'}
        onClick={() => {
          (document.getElementById(formId) as HTMLFormElement).dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }}
        isLoading={isSubmitting}
      >
        {_(isSubmitting ? 'Signing In...' : 'Sign In')}
      </Button>
    </div>
  );
};

export const CustomerLoginForm: React.FC<{
  title?: string;
  subtitle?: string;
  redirectUrl: string;
  onError?: (error: any) => void;
  className?: string;
}> = ({ title, subtitle, redirectUrl, onError, className }) => {
  const { login } = useCustomerDispatch();
  return (
    <div className={cn(`login__form`, className)}>
      <div className="login__form__inner w-full">
        <Area id="customerLoginFormTitleBefore" noOuter />
        {title && (
          <h1 className="login__form__title text-2xl font-semibold tracking-tight mb-1">
            {_(title)}
          </h1>
        )}
        {subtitle && (
          <p className="login__form__subtitle text-muted-foreground mb-6">
            {_(subtitle)}
          </p>
        )}
        <Area id="customerLoginFormTitleAfter" noOuter />
        <Area id="customerLoginFormBefore" noOuter />
        <Form
          id="loginForm"
          method="POST"
          formOptions={{
            defaultValues: {
              email: 'maya@ordex.example',
              password: 'Explore123!'
            }
          }}
          onSubmit={async (data) => {
            try {
              await login(
                data,
                redirectUrl
              );
            } catch (error) {
              onError?.(error);
            }
          }}
          onError={onError}
          submitBtn={false}
        >
          <DemoProfiles />
          <Area
            id="customerLoginForm"
            className="space-y-3"
            coreComponents={[
              {
                component: {
                  default: (
                    <InputField
                      prefixIcon={<Mail className="h-5 w-5" />}
                      label={_('Email')}
                      name="email"
                      placeholder={_('Email')}
                      required
                      validation={{
                        required: _('Email is required')
                      }}
                    />
                  )
                },
                sortOrder: 10
              },
              {
                component: {
                  default: (
                    <PasswordField
                      prefixIcon={<LockKeyhole className="h-5 w-5" />}
                      label={_('Password')}
                      name="password"
                      placeholder={_('Password')}
                      required
                      validation={{
                        required: _('Password is required')
                      }}
                      showToggle
                    />
                  )
                },
                sortOrder: 20
              },
              {
                component: {
                  default: <SubmitButton formId="loginForm" />
                },
                sortOrder: 30
              }
            ]}
          />
        </Form>
        <Area id="customerLoginFormAfter" noOuter />
      </div>
    </div>
  );
};
