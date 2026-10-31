import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { EntryTable } from '../components/common';
import AppText from '../components/AppText';
import styles from '../styles';

export default function TransactionsScreen({ entries, type, onAdd, onInvoice }) {
  const rows = entries.filter(entry => entry.type === type);
  const title = type === 'Purchase' ? 'Purchases' : 'Sales';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerLine}>
        <AppText style={styles.heading}>{title}</AppText>
        <TouchableOpacity style={styles.primary} onPress={onAdd}>
          <AppText style={styles.primaryText}>+ {type}</AppText>
        </TouchableOpacity>
      </View>
      {rows.length ? (
        <EntryTable
          entries={rows}
          onInvoice={onInvoice}
          partyLabel={type === 'Purchase' ? 'Farmer' : 'Seller'}
        />
      ) : (
        <AppText style={styles.empty}>No {type.toLowerCase()} entries yet.</AppText>
      )}
    </ScrollView>
  );
}
