import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TableControls } from '../components/common';
import AppText from '../components/AppText';
import styles from '../styles';
import { money } from '../utils/format';

export default function PaymentStatusScreen({ payments, onAddPayment, onExportPdf }) {
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const pageSize = 10;
  const totalPages = Math.ceil(payments.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const visiblePayments = payments.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerLine}>
        <AppText style={styles.heading}>Payments</AppText>
        <TouchableOpacity
          style={styles.primary}
          onPress={onAddPayment}
          accessibilityRole="button"
        >
          <AppText style={styles.primaryText}>+ Add payment</AppText>
        </TouchableOpacity>
      </View>
      {payments.length ? (
        <View style={styles.paymentTable}>
          <View style={[styles.paymentRow, styles.paymentHeader]}>
            <AppText style={[styles.paymentCell, styles.paymentDate]}>Date</AppText>
            <AppText style={[styles.paymentCell, styles.paymentParty]}>Party name</AppText>
            {!isCompact && (
              <AppText style={[styles.paymentCell, styles.paymentType]}>Type</AppText>
            )}
            <AppText style={[styles.paymentCell, styles.paymentAmount]}>Amount</AppText>
            <AppText style={[styles.paymentCell, styles.paymentStatus]}>Status</AppText>
          </View>
          {visiblePayments.map(payment => {
            const isAdvance = payment.type === 'Advance';
            const partyType = payment.party_type === 'Farmer' ? 'Farmer' : 'Customer';
            const advanceApplied = Number(payment.applied_amount || 0);
            const isAdvancePending = isAdvance
              && advanceApplied < Number(payment.amount || 0);
            const amountColor = partyType === 'Farmer' ? '#B42318' : '#276B45';
            return (
              <View key={payment.id} style={[styles.paymentRow, isCompact && styles.paymentCompactRow]}>
                {isCompact ? (
                  <View style={[styles.paymentCell, styles.paymentIdentity]}>
                    <AppText style={styles.paymentDateText}>{payment.date}</AppText>
                    <AppText style={styles.paymentPartyText} numberOfLines={1}>
                      {payment.party_name || '—'}
                    </AppText>
                  </View>
                ) : (
                  <>
                    <AppText style={[styles.paymentCell, styles.paymentDate]}>{payment.date}</AppText>
                    <AppText style={[styles.paymentCell, styles.paymentParty]} numberOfLines={1}>
                      {payment.party_name || '—'}
                    </AppText>
                    <AppText style={[styles.paymentCell, styles.paymentType]}>{partyType}</AppText>
                  </>
                )}
                <View style={[styles.paymentCell, styles.paymentAmount]}>
                  <AppText style={[styles.paymentAmountText, { color: amountColor }]}>
                    {money(payment.amount)}
                  </AppText>
                  {isCompact && (
                    <AppText style={styles.paymentSubtext}>
                      {partyType === 'Farmer' ? 'Paid' : 'Received'}
                    </AppText>
                  )}
                </View>
                <View style={[styles.paymentCell, styles.paymentStatus]}>
                  <View style={[
                    styles.paymentStatusBadge,
                    isAdvancePending ? styles.paymentPendingBadge : styles.paymentCompleteBadge,
                  ]}>
                    <AppText style={[
                      styles.paymentStatusText,
                      isAdvancePending ? styles.paymentPendingText : styles.paymentCompleteText,
                    ]}>
                      {isAdvancePending ? 'Pending' : 'Completed'}
                    </AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.paymentEmpty}>
          <MaterialCommunityIcons name="cash-multiple" size={30} color="#276B45" />
          <AppText style={styles.empty}>No payments recorded yet.</AppText>
          <TouchableOpacity
            style={styles.primary}
            onPress={onAddPayment}
            accessibilityRole="button"
          >
            <AppText style={styles.primaryText}>+ Add payment</AppText>
          </TouchableOpacity>
        </View>
      )}
      {payments.length > 0 && (
        <TableControls
          page={currentPage}
          totalPages={totalPages}
          itemCount={payments.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onExportPdf={() => onExportPdf(
            'Payments',
            ['Date', 'Party name', 'Party type', 'Payment type', 'Amount', 'Status'],
            payments.map(payment => [
              payment.date,
              payment.party_name || '—',
              payment.party_type === 'Farmer' ? 'Farmer' : 'Customer',
              payment.type,
              money(payment.amount),
              payment.type === 'Advance'
                && Number(payment.applied_amount || 0) < Number(payment.amount || 0)
                ? 'Pending'
                : 'Completed',
            ]),
          )}
        />
      )}
    </ScrollView>
  );
}
