import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  demoDefaults,
  isBlankDemoField,
  type DemoProfile
} from './demoDefaults.js';

export function DemoFormDefaults({ profile }: { profile: DemoProfile }) {
  const { getValues, getFieldState, setValue } = useFormContext();
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    let cancelled = false;
    // Controllers must finish subscribing before their initial values change.
    queueMicrotask(() => {
      if (cancelled || applied.current) return;
      applied.current = true;
      const token = `${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 5)}`;
      for (const [name, value] of Object.entries(
        demoDefaults(profile, token)
      )) {
        if (isBlankDemoField(getValues(name)) && !getFieldState(name).isDirty) {
          setValue(name, value, { shouldDirty: false, shouldValidate: false });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile, getValues, getFieldState, setValue]);
  return (
    <p className="demo-form-note">
      <span aria-hidden="true">✦</span> Sample details filled in. Everything is
      editable.
    </p>
  );
}
