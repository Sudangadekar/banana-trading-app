import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import AppText from './AppText';
import styles from '../styles';
import { money, today } from '../utils/format';
import { getBalanceColor, getPaymentStatus } from '../utils/transaction';

function dateParts(value) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month: month - 1, day };
}

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalendarPicker({ value, onChange, compact = false }) {
  const [visible, setVisible] = React.useState(false);
  const initialDate = dateParts(value || today());
  const [shownYear, setShownYear] = React.useState(initialDate.year);
  const [shownMonth, setShownMonth] = React.useState(initialDate.month);
  const currentParts = dateParts(value || today());
  const monthLabel = new Date(shownYear, shownMonth, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthStartOffset = (new Date(shownYear, shownMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(shownYear, shownMonth + 1, 0).getDate();
  const calendarCells = [
    ...Array(monthStartOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function moveMonth(offset) {
    const nextMonth = new Date(shownYear, shownMonth + offset, 1);
    setShownYear(nextMonth.getFullYear());
    setShownMonth(nextMonth.getMonth());
  }

  function openCalendar() {
    const selected = dateParts(value || today());
    setShownYear(selected.year);
    setShownMonth(selected.month);
    setVisible(true);
  }

  return (
    <>
      <TouchableOpacity
        onPress={openCalendar}
        activeOpacity={0.75}
        style={compact ? styles.calendarCompactButton : styles.calendarButton}
        accessibilityRole="button"
        accessibilityLabel={`Choose date, selected ${value}`}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#1C5937" />
        <AppText style={styles.calendarButtonText}>{value}</AppText>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.calendarShade}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <AppText style={styles.calendarTitle}>Select date</AppText>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close calendar"
              >
                <MaterialCommunityIcons name="close" size={22} color="#788379" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarMonthHeader}>
              <TouchableOpacity
                onPress={() => moveMonth(-1)}
                style={styles.calendarArrow}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <MaterialCommunityIcons name="chevron-left" size={23} color="#1C5937" />
              </TouchableOpacity>
              <AppText style={styles.calendarMonthTitle}>{monthLabel}</AppText>
              <TouchableOpacity
                onPress={() => moveMonth(1)}
                style={styles.calendarArrow}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <MaterialCommunityIcons name="chevron-right" size={23} color="#1C5937" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <View key={`weekday-${index}`} style={styles.calendarCell}>
                  <AppText style={styles.calendarWeekday}>{day}</AppText>
                </View>
              ))}
              {calendarCells.map((day, index) => {
                if (!day) {
                  return <View key={`blank-${index}`} style={styles.calendarCell} />;
                }
                const selected = day === currentParts.day
                  && shownMonth === currentParts.month
                  && shownYear === currentParts.year;
                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => {
                      onChange(dateString(new Date(shownYear, shownMonth, day)));
                      setVisible(false);
                    }}
                    style={[
                      styles.calendarCell,
                      styles.calendarDayCell,
                      selected && styles.calendarDaySelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${shownYear}-${String(shownMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
                    accessibilityState={{ selected }}
                  >
                    <AppText style={[styles.calendarDay, selected && styles.calendarDaySelectedText]}>
                      {day}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => {
                const currentDate = today();
                onChange(currentDate);
                const current = dateParts(currentDate);
                setShownYear(current.year);
                setShownMonth(current.month);
                setVisible(false);
              }}
              style={styles.calendarTodayButton}
            >
              <AppText style={styles.calendarTodayText}>Today</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function DatePickerField({ label, value, onChange }) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <CalendarPicker value={value} onChange={onChange} />
    </View>
  );
}

export function FormField({ label, value, onChange, keyboard = 'default', hint = '' }) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        value={String(value ?? '')}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={hint || label}
        placeholderTextColor="#8A958D"
        selectionColor="#276B45"
        style={styles.input}
      />
    </View>
  );
}

export function ChoiceField({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.chips}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            activeOpacity={0.75}
            style={[styles.chip, value === option && styles.chipActive]}
          >
            <AppText style={[styles.chipText, value === option && styles.chipTextActive]}>
              {option}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function PartySelector({ label, parties, selectedId, onSelect, emptyMessage }) {
  const [open, setOpen] = React.useState(false);
  const selectedParty = parties.find(party => String(party.id) === selectedId);

  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <TouchableOpacity
        onPress={() => setOpen(value => !value)}
        activeOpacity={0.75}
        style={styles.partySelector}
        accessibilityRole="button"
        accessibilityLabel={selectedParty ? `${label}: ${selectedParty.name}` : label}
        accessibilityState={{ expanded: open }}
      >
        <AppText style={selectedParty ? styles.partySelectorValue : styles.partySelectorPlaceholder}>
          {selectedParty ? selectedParty.name : `Choose ${label.toLowerCase()}`}
        </AppText>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={19}
          color="#1C5937"
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.partySelectorOptions}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {parties.map(party => (
              <TouchableOpacity
                key={party.id}
                onPress={() => {
                  onSelect(String(party.id));
                  setOpen(false);
                }}
                style={[
                  styles.partySelectorOption,
                  selectedId === String(party.id) && styles.partySelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedId === String(party.id) }}
              >
                <AppText style={styles.chipText}>
                  {party.name}{party.type ? ` (${party.type})` : ''}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {!parties.length && (
        <AppText style={styles.muted}>{emptyMessage}</AppText>
      )}
    </View>
  );
}

export function ModalShell({ visible, title, children, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalShade}
      >
        <View style={styles.modalBox}>
          <View style={styles.headerLine}>
            <AppText style={styles.sectionTitle}>{title}</AppText>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.close}>✕</AppText>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
            <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.8}>
              <AppText style={styles.saveText}>Save</AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function StatCard({
  title, value, icon, unit, color = '#1C5937',
}) {
  const displayValue = unit
    ? `${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${unit}`
    : money(value);

  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardTop}>
        <AppText style={styles.statTitle} numberOfLines={2} maxFontSizeMultiplier={1}>
          {title}
        </AppText>
        <View style={styles.statIconBadge}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
      </View>
      <AppText
        style={[styles.statValue, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {displayValue}
      </AppText>
    </View>
  );
}

export function ActionButton({ title, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8}>
      <MaterialCommunityIcons name={icon} size={20} color="#1C5937" />
      <AppText style={styles.actionText}>{title}</AppText>
    </TouchableOpacity>
  );
}

export function TableControls({
  page, totalPages, itemCount, pageSize = 10, onPageChange, onExportPdf,
}) {
  if (!itemCount && !onExportPdf) return null;

  const firstItem = itemCount ? page * pageSize + 1 : 0;
  const lastItem = Math.min((page + 1) * pageSize, itemCount);

  return (
    <View style={styles.tableControls}>
      <AppText style={styles.tableCount}>
        {itemCount ? `${firstItem}–${lastItem} of ${itemCount}` : 'No records'}
      </AppText>
      <View style={styles.tableControlActions}>
        {onExportPdf && (
          <TouchableOpacity
            style={styles.tableExportButton}
            onPress={onExportPdf}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#1C5937" />
            <AppText style={styles.tableExportText}>Export PDF</AppText>
          </TouchableOpacity>
        )}
        {totalPages > 1 && (
          <View style={styles.tablePagination}>
            <TouchableOpacity
              style={[styles.tablePageButton, page === 0 && styles.tablePageButtonDisabled]}
              onPress={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color="#276B45" />
            </TouchableOpacity>
            <AppText style={styles.tablePageText}>
              {page + 1} / {totalPages}
            </AppText>
            <TouchableOpacity
              style={[
                styles.tablePageButton,
                page >= totalPages - 1 && styles.tablePageButtonDisabled,
              ]}
              onPress={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              accessibilityRole="button"
              accessibilityLabel="Next page"
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color="#276B45" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export function EntryTable({
  entries,
  onInvoice,
  compact = false,
  showStatus = false,
  partyLabel = 'Farmer / seller',
}) {
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const pageSize = 10;
  const totalPages = Math.ceil(entries.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleEntries = entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const caratLabel = entries.length && entries.every(entry => entry.type === 'Purchase')
    ? 'Carat received'
    : entries.length && entries.every(entry => entry.type === 'Sale')
      ? 'Carat sold'
      : 'Carat';
  const columns = compact
    ? [
      ['Date', 'entryTableDate'],
      [partyLabel, 'entryTableParty'],
      [caratLabel, 'entryTableCrates'],
      ['Weight', 'entryTableWeight'],
      ['Amount', 'entryTableAmount'],
      ['Pending', 'entryTablePending'],
    ]
    : [
      ['Date', 'entryTableDate'],
      ['Type', 'entryTableType'],
      [partyLabel, 'entryTableParty'],
      [caratLabel, 'entryTableCrates'],
      ['Weight', 'entryTableWeight'],
      ['Rate', 'entryTableRate'],
      ['Total', 'entryTableAmount'],
      ['Paid', 'entryTablePaid'],
      ['Pending', 'entryTablePending'],
      ...(showStatus ? [['Status', 'entryTableStatus']] : []),
    ];

  return (
    <>
    <View style={[styles.entryTable, isMobile && styles.entryTableMobile]}>
      <View style={[
        styles.entryTableRow,
        styles.entryTableHeader,
        isMobile && styles.entryTableMobileRow,
      ]}>
        {isMobile ? (
          <>
            <AppText style={[
              styles.entryTableCell,
              styles.entryMobileIdentity,
              styles.entryTableHeaderText,
            ]}>
              Date / {partyLabel}
            </AppText>
            <AppText style={[
              styles.entryTableCell,
              styles.entryMobileCarat,
              styles.entryTableHeaderText,
            ]}>{caratLabel}</AppText>
            <AppText style={[
              styles.entryTableCell,
              styles.entryMobileWeight,
              styles.entryTableHeaderText,
            ]}>Weight</AppText>
            <AppText style={[
              styles.entryTableCell,
              styles.entryMobileTotalDue,
              styles.entryTableHeaderText,
            ]}>Total / due</AppText>
          </>
        ) : (
          columns.map(([label, cellStyle]) => (
            <AppText key={label} style={[
              styles.entryTableCell,
              styles[cellStyle],
              styles.entryTableHeaderText,
            ]}>
              {label}
            </AppText>
          ))
        )}
        {!isMobile && (
          <AppText style={[
            styles.entryTableCell,
            styles.entryTableActionCell,
            styles.entryTableHeaderText,
          ]}>
            PDF
          </AppText>
        )}
      </View>
      {visibleEntries.map(item => {
        const status = getPaymentStatus(item);
        const crateCount = Number(item.crate_count || 0);
        const balanceColor = getBalanceColor(item.type, item.balance);
        if (isMobile) {
          return (
            <View key={item.id} style={[styles.entryTableRow, styles.entryTableMobileRow]}>
              <View style={[styles.entryMobileIdentity, styles.entryMobileIdentityValue]}>
                <AppText style={styles.entryMobileDate}>{item.date}</AppText>
                <AppText style={styles.entryMobileParty} numberOfLines={1}>
                  {!compact && `${item.type} · `}{item.party_name || '—'}
                </AppText>
              </View>
              <AppText style={[styles.entryTableCell, styles.entryMobileCarat]}>
                {crateCount > 0 ? crateCount : '—'}
              </AppText>
              <AppText style={[styles.entryTableCell, styles.entryMobileWeight]}>
                {Number(item.gross_weight || 0).toLocaleString('en-IN')} kg
              </AppText>
              <View style={styles.entryMobileTotalDue}>
                <AppText style={styles.entryMobileTotalValue} numberOfLines={1}>
                  {money(item.net_amount)}
                </AppText>
                <AppText style={[
                  styles.entryMobilePendingValue,
                  { color: balanceColor },
                ]} numberOfLines={1}>
                  Due {money(item.balance)}
                </AppText>
                {showStatus && (
                  <AppText style={[styles.entryMobileStatus, { color: status.color }]}>
                    {status.label}
                  </AppText>
                )}
              </View>
              <TouchableOpacity
                onPress={() => onInvoice(item)}
                style={styles.entryMobileAction}
                accessibilityRole="button"
                accessibilityLabel={`Create PDF for ${item.invoice_no}`}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#1C5937" />
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View key={item.id} style={styles.entryTableRow}>
            <AppText style={[styles.entryTableCell, styles.entryTableDate]}>{item.date}</AppText>
            {!compact && (
              <AppText style={[styles.entryTableCell, styles.entryTableType]}>
                {item.type}
              </AppText>
            )}
            <AppText style={[styles.entryTableCell, styles.entryTableParty]} numberOfLines={1}>
              {item.party_name || '—'}
            </AppText>
            <AppText style={[styles.entryTableCell, styles.entryTableCrates]}>
              {crateCount > 0 ? crateCount : '—'}
            </AppText>
            <AppText style={[styles.entryTableCell, styles.entryTableWeight]}>
              {Number(item.gross_weight || 0).toLocaleString('en-IN')} kg
            </AppText>
            {!compact && (
              <AppText style={[styles.entryTableCell, styles.entryTableRate]}>
                {money(item.rate)}
              </AppText>
            )}
            <AppText style={[styles.entryTableCell, styles.entryTableAmount]}>
              {money(item.net_amount)}
            </AppText>
            {!compact && (
              <AppText style={[styles.entryTableCell, styles.entryTablePaid]}>
                {money(item.paid)}
              </AppText>
            )}
            <AppText style={[
              styles.entryTableCell,
              styles.entryTablePending,
              { color: balanceColor },
            ]}>
              {money(item.balance)}
            </AppText>
            {showStatus && (
              <AppText style={[
                styles.entryTableCell,
                styles.entryTableStatus,
                { color: status.color },
              ]}>
                {status.label}
              </AppText>
            )}
            <TouchableOpacity
              onPress={() => onInvoice(item)}
              style={styles.entryTableActionCell}
              accessibilityRole="button"
              accessibilityLabel={`Create PDF for ${item.invoice_no}`}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={19} color="#1C5937" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
    <TableControls
      page={currentPage}
      totalPages={totalPages}
      itemCount={entries.length}
      pageSize={pageSize}
      onPageChange={setPage}
    />
    </>
  );
}
