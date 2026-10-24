// Modified for Ordex on 19 October 2026.
import { Brand } from '@components/common/Brand.js';
import React from 'react';
import './LoginForm.scss';
import Area from '@components/common/Area.js';
import { EmailField } from '@components/common/form/EmailField.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { PasswordField } from '@components/common/form/PasswordField.js';
import { Button } from '@components/common/ui/Button.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { LockKeyhole, Mail } from 'lucide-react';

interface LoginFormProps {
  authUrl: string;
  dashboardUrl: string;
}

const SubmitButton: React.FC = () => {
  const {
    formState: { isSubmitting }
  } = useFormContext();
  return (
    <div className="form-submit-button flex border-t border-border mt-4 pt-4 justify-between">
      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        className="w-full"
      >
        {_('Sign In')}
      </Button>
    </div>
  );
};

export default function LoginForm({ authUrl, dashboardUrl }: LoginFormProps) {
  const [error, setError] = React.useState(null);

  const onSuccess = (response) => {
    if (!response.error) {
      window.location.href = dashboardUrl;
    } else {
      setError(response.error.message);
    }
  };

  return (
    <div className="admin-login-form">
      <style>{`
        .header {
          display: none !important;
        }
      `}</style>
      <div className="admin-login-intro">
        <a href="/" className="ordex-admin-brand">
          <Brand />
        </a>
        <h1>Your store. Your studio.</h1>
        <p>
          Sign in with your seller account.
          <br />
          Manage your orders, products and returns.
        </p>
      </div>
      {error && <div className="text-destructive py-2">{error}</div>}
      <Form
        action={authUrl}
        method="POST"
        id="adminLoginForm"
        onSuccess={onSuccess}
        submitBtn={false}
      >
        <Area
          id="adminLoginForm"
          className="space-y-3"
          coreComponents={[
            {
              component: {
                default: (
                  <EmailField
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
                default: <SubmitButton />
              },
              sortOrder: 30
            }
          ]}
        />
      </Form>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    authUrl: url(routeId: "adminLoginJson")
    dashboardUrl: url(routeId: "dashboard")
  }
`;
