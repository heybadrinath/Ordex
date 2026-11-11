import React from 'react';
import { LogOut, Package, UserRound } from 'lucide-react';
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
        <span className="account-heading-icon" aria-hidden="true">
          {isOrders ? <Package size={24} /> : <UserRound size={24} />}
        </span>
        <div>
          <h1>
            {isOrders
              ? 'Your orders'
              : `Your account${firstName ? `, ${firstName}` : ''}`}
          </h1>
          <p>
            {isOrders
              ? 'Order history, delivery updates and support.'
              : 'Manage your orders, contact details and saved addresses.'}
          </p>
        </div>
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
