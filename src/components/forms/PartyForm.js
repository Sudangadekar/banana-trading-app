import React from 'react';
import { ChoiceField, FormField, ModalShell } from '../common';

export default function PartyForm({
  visible, form, isEditing = false, onChange, onSave, onClose,
}) {
  return (
    <ModalShell
      visible={visible}
      title={isEditing ? 'Edit party details' : 'Add party'}
      onSave={onSave}
      onClose={onClose}
    >
      <FormField label="Name" value={form.name} onChange={value => onChange('name', value)} />
      <ChoiceField
        label="Party type"
        options={['Farmer', 'Customer']}
        value={form.type}
        onChange={value => onChange('type', value)}
      />
      <FormField
        label="Mobile number"
        value={form.phone}
        onChange={value => onChange('phone', value)}
        keyboard="phone-pad"
      />
      <FormField
        label="Address"
        value={form.address}
        onChange={value => onChange('address', value)}
      />
    </ModalShell>
  );
}
