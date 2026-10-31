import React, { useState } from 'react';
import {
  Modal, ScrollView, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CalendarPicker, StatCard,
} from '../components/common';
import AppText from '../components/AppText';
import styles from '../styles';
import { formatDateRange, getDateRange } from '../utils/dateRange';
import { money } from '../utils/format';
import { calculateNetWeight, getBalanceColor } from '../utils/transaction';

const periodOptions = [
  { id: 'all', label: 'All time' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  id: month,
  label: new Date(2000, month, 1).toLocaleDateString('en-IN', { month: 'long' }),
}));

function CompactDropdown({ value, options, onChange, accessibilityLabel }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(option => option.id === value);

  return (
    <View style={styles.compactDropdownContainer}>
      <TouchableOpacity
        onPress={() => setOpen(current => !current)}
        activeOpacity={0.75}
        style={styles.compactDropdown}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${selectedOption.label}`}
        accessibilityState={{ expanded: open }}
      >
        <AppText style={styles.compactDropdownText}>{selectedOption.label}</AppText>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={17}
          color="#1C5937"
        />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.dropdownModalShade}>
          <View style={styles.dropdownModalCard}>
            <AppText style={styles.dropdownModalTitle}>{accessibilityLabel}</AppText>
            <ScrollView
              style={styles.dropdownModalOptions}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {options.map(option => {
                const selected = option.id === value;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setOpen(false);
                      onChange(option.id);
                    }}
                    style={[
                      styles.compactDropdownOption,
                      selected && styles.compactDropdownOptionSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <AppText
                      style={[
                        styles.compactDropdownOptionText,
                        selected && styles.compactDropdownOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </AppText>
                    {selected && (
                      <MaterialCommunityIcons name="check" size={18} color="#1C5937" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.dropdownModalCancel}
              accessibilityRole="button"
            >
              <AppText style={styles.dropdownModalCancelText}>Cancel</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EntryDetails({ entry, onClose }) {
  if (!entry) return null;

  const netWeight = calculateNetWeight(
    Number(entry.gross_weight || 0),
    Number(entry.weight_deduction || 0),
  );
  const isPurchase = entry.type === 'Purchase';
  const balanceLabel = isPurchase ? 'Still payable to farmer' : 'Still due from customer';
  const balanceColor = getBalanceColor(entry.type, entry.balance);
  const details = [
    ['Date', entry.date],
    [isPurchase ? 'Farmer' : 'Customer', entry.party_name || '—'],
    ['Invoice', entry.invoice_no || '—'],
    ...(isPurchase ? [['Product', entry.item || 'Banana']] : []),
    [isPurchase ? 'Carat received' : 'Carat sold', Number(entry.crate_count || 0)],
    [isPurchase ? 'Gross weight' : 'Sale weight', `${entry.gross_weight || 0} kg`],
    ...(isPurchase ? [['Tare weight', `${entry.weight_deduction || 0} kg`]] : []),
    [isPurchase ? 'Net weight' : 'Weight after deduction', `${netWeight} kg`],
    ['Rate per kg', money(entry.rate)],
    ['Gross amount', money(entry.gross_amount)],
    ...(!isPurchase && Number(entry.weight_deduction || 0) > 0
      ? [['Weight deduction', `${entry.weight_deduction} kg`]]
      : []),
    ...(Number(entry.amount_deduction || 0) > 0
      ? [[isPurchase ? 'Majdoori / other deduction' : 'Amount deduction', money(entry.amount_deduction)]]
      : []),
    [isPurchase ? 'Net payable' : 'Net sale amount', money(entry.net_amount)],
    [isPurchase ? 'Paid to farmer' : 'Received from customer', money(entry.paid)],
    [balanceLabel, money(entry.balance)],
  ];

  return (
    <Modal
      visible={!!entry}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.purchaseDetailsShade}>
        <View style={styles.purchaseDetailsCard}>
          <View style={styles.purchaseDetailsHeader}>
            <View style={styles.purchaseDetailsHeading}>
              <AppText style={styles.purchaseDetailsTitle}>
                {isPurchase ? 'Purchase details' : 'Sale details'}
              </AppText>
              <AppText style={styles.muted}>
                {entry.party_name || (isPurchase ? 'Farmer' : 'Customer')}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.purchaseDetailsClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${isPurchase ? 'purchase' : 'sale'} details`}
            >
              <MaterialCommunityIcons name="close" size={21} color="#68766D" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.purchaseDetailsList}
            showsVerticalScrollIndicator={false}
          >
            {details.map(([label, value]) => (
              <View key={label} style={styles.purchaseDetailsRow}>
                <AppText style={styles.purchaseDetailsLabel}>{label}</AppText>
                <AppText style={[
                  styles.purchaseDetailsValue,
                  label === balanceLabel && Number(entry.balance || 0) > 0
                    && { color: balanceColor },
                  label === (isPurchase ? 'Net payable' : 'Net sale amount')
                    && styles.purchaseDetailsNet,
                ]}>
                  {value}
                </AppText>
              </View>
            ))}
            {!!entry.deduction_note && (
              <View style={styles.purchaseDetailsRow}>
                <AppText style={styles.purchaseDetailsLabel}>Deduction note</AppText>
                <AppText style={styles.purchaseDetailsValue}>{entry.deduction_note}</AppText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RecentEntryCard({ entry, onDetails }) {
  const isPurchase = entry.type === 'Purchase';
  const isPaid = Number(entry.balance || 0) <= 0;
  const amountColor = getBalanceColor(entry.type, entry.balance);
  const balanceLabel = isPaid
    ? 'Paid'
    : isPurchase ? 'Payable to farmer' : 'Due from customer';
  return (
    <View style={styles.recentPurchaseCard}>
      <View style={styles.recentPurchaseInfo}>
        <AppText style={styles.recentPurchaseName} numberOfLines={1}>
          {isPurchase ? 'Purchase' : 'Sale'} · {entry.party_name || (isPurchase ? 'Farmer' : 'Customer')}
        </AppText>
        <AppText style={styles.recentPurchaseMeta}>
          {entry.date} · {Number(entry.gross_weight || 0).toLocaleString('en-IN')} kg
        </AppText>
      </View>
      <View style={styles.recentPurchasePending}>
        <AppText style={[
          styles.recentPurchasePendingLabel,
          isPaid || !isPurchase
            ? styles.recentPurchasePaidLabel
            : styles.recentPurchaseUnpaidLabel,
        ]}>
          {balanceLabel}
        </AppText>
        <AppText style={[
          styles.recentPurchasePendingValue,
          { color: amountColor },
        ]}>
          {money(entry.balance)}
        </AppText>
      </View>
      <TouchableOpacity
        onPress={onDetails}
        style={styles.recentPurchaseMenu}
        accessibilityRole="button"
        accessibilityLabel={`View ${isPurchase ? 'purchase' : 'sale'} details for ${entry.party_name || (isPurchase ? 'farmer' : 'customer')}`}
      >
        <MaterialCommunityIcons name="dots-vertical" size={21} color="#1C5937" />
      </TouchableOpacity>
    </View>
  );
}

function RecentEntries({ entries, type, isWide = false }) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const isPurchase = type === 'Purchase';

  return (
    <View style={[styles.recentPanel, isWide && styles.recentPanelWide]}>
      <AppText style={styles.sectionTitle}>
        {isPurchase ? 'Recent purchases' : 'Recent sales'}
      </AppText>
      {entries.slice(0, 5).map(entry => (
        <RecentEntryCard
          key={entry.id}
          entry={entry}
          onDetails={() => setSelectedEntry(entry)}
        />
      ))}
      {!entries.length && (
        <AppText style={styles.empty}>
          No recent {isPurchase ? 'purchases' : 'sales'} in this period.
        </AppText>
      )}
      <EntryDetails entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </View>
  );
}

export default function DashboardScreen({
  summary, entries, period, month, year, selectedDate, onPeriodChange,
}) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftPeriod, setDraftPeriod] = useState(period);
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftYear, setDraftYear] = useState(year);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const purchases = entries.filter(item => item.type === 'Purchase');
  const sales = entries.filter(item => item.type === 'Sale');
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, index) => {
    const optionYear = currentYear - index;
    return { id: optionYear, label: String(optionYear) };
  });
  const dateRange = draftPeriod === 'all'
    ? ''
    : formatDateRange(getDateRange(
      draftPeriod,
      new Date(`${draftDate}T00:00:00`),
      { month: draftMonth, year: draftYear },
    ));
  const isFiltered = draftPeriod !== 'all';

  function openFilter() {
    setDraftPeriod(period);
    setDraftMonth(month);
    setDraftYear(year);
    setDraftDate(selectedDate);
    setFilterVisible(true);
  }

  function toggleFilter() {
    if (filterVisible) {
      setFilterVisible(false);
      return;
    }
    openFilter();
  }

  function applyFilter() {
    onPeriodChange(draftPeriod, draftMonth, draftYear, draftDate);
    setFilterVisible(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.dashboardHeadingRow}>
        <AppText style={[styles.heading, styles.dashboardTitle]}>Business overview</AppText>
        <TouchableOpacity
          style={[styles.dashboardFilterToggle, period !== 'all' && styles.dashboardFilterToggleActive]}
          onPress={toggleFilter}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open dashboard filters"
          accessibilityState={{ expanded: filterVisible }}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={20}
            color={period !== 'all' ? '#174E35' : '#68766D'}
          />
        </TouchableOpacity>
      </View>
      {filterVisible && (
        <View style={styles.dashboardFilter}>
          <View style={styles.filterControlRow}>
            <MaterialCommunityIcons name="calendar-range" size={18} color="#1C5937" />
            <CompactDropdown
              value={draftPeriod}
              options={periodOptions}
              onChange={nextPeriod => setDraftPeriod(nextPeriod)}
              accessibilityLabel="Filter period"
            />
            {isFiltered && (
              <TouchableOpacity
                onPress={() => setDraftPeriod('all')}
                activeOpacity={0.75}
                style={styles.clearFilterButton}
                accessibilityRole="button"
                accessibilityLabel="Clear filter"
              >
                <MaterialCommunityIcons name="close" size={18} color="#788379" />
              </TouchableOpacity>
            )}
          </View>
          {(draftPeriod === 'month' || draftPeriod === 'year') && (
            <View style={styles.monthYearRow}>
              {draftPeriod === 'month' && (
                <CompactDropdown
                  value={draftMonth}
                  options={monthOptions}
                  onChange={setDraftMonth}
                  accessibilityLabel="Select month"
                />
              )}
              <CompactDropdown
                value={draftYear}
                options={yearOptions}
                onChange={setDraftYear}
                accessibilityLabel="Select year"
              />
            </View>
          )}
          {draftPeriod === 'day' || draftPeriod === 'week' ? (
            <View style={styles.filterDateRow}>
              <AppText style={styles.periodDate}>{dateRange}</AppText>
              <CalendarPicker
                value={draftDate}
                onChange={setDraftDate}
                compact
              />
            </View>
          ) : (
            <AppText style={styles.periodDate}>
              {draftPeriod === 'all' ? 'Showing all dates' : dateRange}
            </AppText>
          )}
          <View style={styles.dashboardFilterActions}>
            <TouchableOpacity
              style={styles.dashboardFilterCancel}
              onPress={() => setFilterVisible(false)}
              accessibilityRole="button"
            >
              <AppText style={styles.dashboardFilterCancelText}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dashboardFilterApply}
              onPress={applyFilter}
              accessibilityRole="button"
            >
              <AppText style={styles.dashboardFilterApplyText}>Apply filter</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.stats}>
        <StatCard
          title="Total purchases"
          value={summary.purchases}
          icon="cart-arrow-down"
        />
        <StatCard
          title="Total sales"
          value={summary.sales}
          icon="chart-line"
          color="#287348"
        />
        <StatCard
          title="Stock available"
          value={summary.stockAvailable}
          icon="warehouse"
          unit="kg"
          color="#287348"
        />
        <StatCard
          title="Payable to farmers"
          value={summary.farmerDue}
          icon="account-alert-outline"
          color="#B42318"
        />
        <StatCard
          title="Receivable from customers"
          value={summary.customerDue}
          icon="cash-clock"
          color="#276B45"
        />
        <StatCard
          title="Available advances"
          value={summary.advances}
          icon="wallet-plus-outline"
          color="#846817"
        />
      </View>
      <View style={styles.recentSections}>
        <RecentEntries entries={purchases} type="Purchase" />
        <RecentEntries
          entries={sales}
          type="Sale"
          isWide={isWide}
        />
      </View>
    </ScrollView>
  );
}
