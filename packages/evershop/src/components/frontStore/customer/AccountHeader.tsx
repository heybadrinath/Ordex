import React from 'react';
import { LogOut } from 'lucide-react';
import { useAppState } from '@components/common/context/app.js';
import { Button } from '@components/common/ui/Button.js';
import { toast } from '@components/common/ui/Sonner.js';
import { useCustomer, useCustomerDispatch } from './CustomerContext.js';

export function AccountHeader() {
  const { customer } = useCustomer();
  const { logout } = useCustomerDispatch();
  const isOrders = useAppState()?.config?.pageMeta?.route?.id === 'orderList';
  const firstName = customer?.fullName?.trim().split(' ')[0];
  return (
    <header className="account-header">
      <div className="account-welcome">
        <span className="eyebrow">Your space at Ordex</span>
        <h1>
          {isOrders
            ? 'Your orders.'
            : `Hello${firstName ? `, ${firstName}` : ''}.`}
        </h1>
        <p>
          {isOrders
            ? 'Good things, from our door to yours. Keep an eye on them here.'
            : 'A home for your orders, your details and what comes next.'}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          try {
            await logout();
            window.location.href = '/';
          } catch (error) {
            toast.error(
              (error as Error).message || 'Could not log out. Try again.'
            );
          }
        }}
      >
        <LogOut size={15} />
        Log out
      </Button>
    </header>
  );
}
