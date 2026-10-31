import React from 'react';
import { View } from 'react-native';
import {
  DatePickerField, FormField, ModalShell, PartySelector,
} from '../common';
import AppText from '../AppText';
import styles from '../../styles';
import { money } from '../../utils/format';
import { calculateTransactionAmounts } from '../../utils/transaction';

export default function EntryForm({ visible, form, parties, onChange, onSave, onClose }) {
  const partyOptions = form.type === 'Purchase'
    ? parties.filter(party => party.type === 'Farmer')
    : parties.filter(party => party.type !== 'Farmer');
  const amounts = calculateTransactionAmounts({
    weight: Number(form.gross_weight || 0),
    rate: Number(form.rate || 0),
    weightDeduction: Number(form.weight_deduction || 0),
    amountDeduction: Number(form.amount_deduction || 0),
    payment: Number(form.paid || 0),
  });
  const {
    grossAmount: gross,
    netAmount: net,
    balance: balanceDue,
    advance: advanceCredit,
  } = amounts;
  const isPurchase = form.type === 'Purchase';

  return (
    <ModalShell
      visible={visible}
      title={form.type === 'Purchase' ? 'New purchase' : 'New sale'}
      onSave={onSave}
      onClose={onClose}
    >
      <PartySelector
        label={isPurchase ? 'Select farmer' : 'Select seller'}
        parties={partyOptions}
        selectedId={form.party_id}
        onSelect={value => onChange('party_id', value)}
        emptyMessage={`Add a ${form.type === 'Purchase' ? 'Farmer' : 'Customer'} first.`}
      />
      <DatePickerField
        label="Date"
        value={form.date}
        onChange={value => onChange('date', value)}
      />
      <AppText style={styles.purchaseSectionTitle}>
        {isPurchase ? 'Purchase details' : 'Product details'}
      </AppText>
      <FormField
        label={isPurchase ? 'Carat received' : 'Carat sold'}
        value={form.crate_count}
        onChange={value => onChange('crate_count', value)}
        keyboard="number-pad"
      />
      <FormField
        label={isPurchase ? 'Gross weight (kg)' : 'Weight (kg)'}
        value={form.gross_weight}
        onChange={value => onChange('gross_weight', value)}
        keyboard="decimal-pad"
      />
      {isPurchase && (
        <FormField
          label="Tare weight (kg)"
          value={form.weight_deduction}
          onChange={value => onChange('weight_deduction', value)}
          keyboard="decimal-pad"
        />
      )}
      <FormField
        label="Rate per kg (₹)"
        value={form.rate}
        onChange={value => onChange('rate', value)}
        keyboard="decimal-pad"
      />
      {isPurchase ? (
        <FormField
          label="Majdoori / other deduction (₹)"
          value={form.amount_deduction}
          onChange={value => onChange('amount_deduction', value)}
          keyboard="decimal-pad"
        />
      ) : (
        <>
          <AppText style={styles.optionalSectionTitle}>Deductions (optional)</AppText>
          <FormField
            label="Weight deduction (kg)"
            value={form.weight_deduction}
            onChange={value => onChange('weight_deduction', value)}
            keyboard="decimal-pad"
          />
          <FormField
            label="Amount deduction (₹)"
            value={form.amount_deduction}
            onChange={value => onChange('amount_deduction', value)}
            keyboard="decimal-pad"
          />
          <FormField
            label="Deduction reason (labour / crate / transport)"
            value={form.deduction_note}
            onChange={value => onChange('deduction_note', value)}
          />
        </>
      )}
      <View style={styles.calcBox}>
        <AppText style={styles.label}>{isPurchase ? 'Net payable' : 'Net sale amount'}</AppText>
        {!isPurchase && <AppText>Gross amount: {money(gross)}</AppText>}
        <AppText style={isPurchase ? styles.netPayableValue : undefined}>{money(net)}</AppText>
      </View>
      <AppText style={styles.purchaseSectionTitle}>Payment details</AppText>
      <FormField
        label={isPurchase ? 'Amount paid to farmer (₹)' : 'Amount received (₹)'}
        value={form.paid}
        onChange={value => onChange('paid', value)}
        keyboard="decimal-pad"
      />
      <View style={[
        styles.balanceDueBox,
        isPurchase && balanceDue > 0
          ? styles.balanceDuePayableBox
          : styles.balanceDueReceivableBox,
      ]}>
        <AppText style={[
          styles.balanceDueLabel,
          isPurchase && balanceDue > 0
            ? styles.balanceDuePayableLabel
            : styles.balanceDueReceivableLabel,
        ]}>
          {isPurchase ? 'Still payable to farmer' : 'Still due from customer'}
        </AppText>
        <AppText style={[
          styles.balanceDueValue,
          balanceDue > 0 && isPurchase && styles.balanceDuePayable,
          (balanceDue === 0 || !isPurchase) && styles.balanceDueSettled,
        ]}>
          {money(balanceDue)}
        </AppText>
      </View>
      {advanceCredit > 0 && (
        <View style={[
          styles.balanceDueBox,
          isPurchase ? styles.balanceDuePayableBox : styles.balanceDueReceivableBox,
        ]}>
          <AppText style={[
            styles.balanceDueLabel,
            isPurchase
              ? styles.balanceDuePayableLabel
              : styles.balanceDueReceivableLabel,
          ]}>
            {isPurchase ? 'Advance to farmer' : 'Customer credit'}
          </AppText>
          <AppText style={[
            styles.balanceDueValue,
            isPurchase ? styles.balanceDuePayableValue : styles.balanceDueSettled,
          ]}>
            {money(advanceCredit)}
          </AppText>
        </View>
      )}
    </ModalShell>
  );
}
