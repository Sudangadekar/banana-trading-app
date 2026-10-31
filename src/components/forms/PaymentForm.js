import React from 'react';
import {
  ChoiceField, DatePickerField, FormField, ModalShell, PartySelector,
} from '../common';
import AppText from '../AppText';
import styles from '../../styles';

export default function PaymentForm({ visible, form, parties, onChange, onSave, onClose }) {
  const selectedParty = parties.find(party => String(party.id) === String(form.party_id));
  const isFarmer = selectedParty?.type === 'Farmer';

  return (
    <ModalShell
      visible={visible}
      title="Add payment"
      onSave={onSave}
      onClose={onClose}
    >
      <PartySelector
        label="Party"
        parties={parties}
        selectedId={form.party_id}
        onSelect={value => onChange('party_id', value)}
        emptyMessage="Add a party first."
      />
      <ChoiceField
        label="Payment type"
        options={['Payment', 'Advance']}
        value={form.type}
        onChange={value => onChange('type', value)}
      />
      <DatePickerField
        label="Date"
        value={form.date}
        onChange={value => onChange('date', value)}
      />
      <FormField
        label={selectedParty
          ? isFarmer ? 'Amount paid to farmer (₹)' : 'Amount received from customer (₹)'
          : 'Amount (₹)'}
        value={form.amount}
        onChange={value => onChange('amount', value)}
        keyboard="decimal-pad"
      />
      <FormField label="Note" value={form.note} onChange={value => onChange('note', value)} />
      {selectedParty && form.type === 'Payment' && (
        <AppText style={styles.muted}>
          {isFarmer
            ? 'This records money paid to the farmer and reduces their pending purchase balance.'
            : 'This records money received from the customer and reduces their pending sales balance.'}
        </AppText>
      )}
      {form.type === 'Advance' && (
        <AppText style={styles.muted}>
          {!selectedParty
            ? 'The advance will be used to reduce this party’s future balance.'
            : isFarmer
              ? 'This is paid to the farmer. It reduces existing purchase dues first; any remainder carries forward.'
              : 'This is received from the customer. It reduces existing sales dues first; any remainder carries forward.'}
        </AppText>
      )}
    </ModalShell>
  );
}
