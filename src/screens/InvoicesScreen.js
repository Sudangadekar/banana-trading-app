import React from 'react';
import { ScrollView } from 'react-native';
import { EntryTable } from '../components/common';
import AppText from '../components/AppText';
import styles from '../styles';

export default function InvoicesScreen({ entries, onInvoice }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText style={styles.heading}>Invoices</AppText>
      <AppText style={styles.screenDescription}>
        Purchase receipts and sales invoices
      </AppText>
      {entries.length ? (
        <EntryTable
          entries={entries}
          onInvoice={onInvoice}
        />
      ) : (
        <AppText style={styles.empty}>Invoices will appear here after a purchase or sale.</AppText>
      )}
    </ScrollView>
  );
}
