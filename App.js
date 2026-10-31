import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView, StatusBar, TouchableOpacity, View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as SafeAreaContainer,
} from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './src/components/AppText';
import BananaLogo from './src/components/BananaLogo';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import PaymentStatusScreen from './src/screens/PaymentStatusScreen';
import PartyDirectoryScreen from './src/screens/PartyDirectoryScreen';
import LoginScreen from './src/screens/LoginScreen';
import PartyForm from './src/components/forms/PartyForm';
import EntryForm from './src/components/forms/EntryForm';
import PaymentForm from './src/components/forms/PaymentForm';
import {
  initializeDatabase, loadBusinessData, loadDashboardData,
} from './src/services/database';
import styles from './src/styles';
import { escapeHtml, money, today } from './src/utils/format';
import { getDateRange } from './src/utils/dateRange';
import {
  allocateAmountToEntries, calculateTransactionAmounts,
} from './src/utils/transaction';

const emptySummary = {
  purchases: 0,
  sales: 0,
  farmerDue: 0,
  customerDue: 0,
  stockAvailable: 0,
  advances: 0,
};
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

const newPartyForm = () => ({ name: '', phone: '', type: 'Farmer', address: '' });
const newEntryForm = type => ({
  type,
  party_id: '',
  date: today(),
  item: 'Banana',
  crate_count: '',
  gross_weight: '',
  rate: '',
  weight_deduction: '',
  amount_deduction: '',
  deduction_note: '',
  paid: '',
});
const newPaymentForm = () => ({
  party_id: '',
  date: today(),
  amount: '',
  type: 'Payment',
  note: '',
});

const navigationItems = [
  { label: 'Dashboard', icon: 'view-dashboard-outline' },
  { label: 'Parties', icon: 'account-group-outline' },
  { label: 'Purchase', icon: 'cart-arrow-down' },
  { label: 'Sale', tab: 'Sales', icon: 'cart-arrow-up' },
  { label: 'Invoice', tab: 'Invoices', icon: 'file-document-outline' },
  { label: 'Payment', tab: 'Payment', icon: 'cash-multiple' },
];

async function applyAmountToEntries(database, amount, entries) {
  const allocation = allocateAmountToEntries(amount, entries);
  for (const { entry, amount: applied } of allocation.allocations) {
    await database.runAsync(
      'UPDATE entries SET paid=paid+?, balance=balance-? WHERE id=?',
      [applied, applied, entry.id],
    );
    entry.paid = Number(entry.paid || 0) + applied;
    entry.balance = Number(entry.balance) - applied;
  }
  return allocation;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [db, setDb] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState('Dashboard');
  const [dashboardPeriod, setDashboardPeriod] = useState('month');
  const [dashboardMonth, setDashboardMonth] = useState(() => new Date().getMonth());
  const [dashboardYear, setDashboardYear] = useState(() => new Date().getFullYear());
  const [dashboardDate, setDashboardDate] = useState(today);
  const dashboardRequest = useRef(0);
  const [summary, setSummary] = useState(emptySummary);
  const [dashboardEntries, setDashboardEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [partyTotals, setPartyTotals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState('');
  const [partyForm, setPartyForm] = useState(newPartyForm);
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [entryForm, setEntryForm] = useState(() => newEntryForm('Purchase'));
  const [paymentForm, setPaymentForm] = useState(newPaymentForm);

  useEffect(() => {
    initializeDatabase()
      .then(async database => {
        setDb(database);
        await refresh(database);
      })
      .catch(error => Alert.alert('Database error', String(error)));
  }, []);

  async function refresh(database = db) {
    if (!database) return;
    const requestId = ++dashboardRequest.current;
    const [data, dashboardData] = await Promise.all([
      loadBusinessData(database),
      loadDashboardData(
        database,
        getDateRange(dashboardPeriod, new Date(`${dashboardDate}T00:00:00`), {
          month: dashboardMonth,
          year: dashboardYear,
        }),
      ),
    ]);
    setParties(data.parties);
    setPartyTotals(data.partyTotals);
    setEntries(data.entries);
    setPayments(data.payments);
    if (requestId === dashboardRequest.current) {
      setSummary(dashboardData.summary);
      setDashboardEntries(dashboardData.entries);
    }
  }

  async function changeDashboardPeriod(
    period,
    month = dashboardMonth,
    year = dashboardYear,
    selectedDate = dashboardDate,
  ) {
    setDashboardPeriod(period);
    setDashboardMonth(month);
    setDashboardYear(year);
    setDashboardDate(selectedDate);
    if (!db) return;
    const requestId = ++dashboardRequest.current;
    try {
      const data = await loadDashboardData(
        db,
        getDateRange(period, new Date(`${selectedDate}T00:00:00`), { month, year }),
      );
      if (requestId === dashboardRequest.current) {
        setSummary(data.summary);
        setDashboardEntries(data.entries);
      }
    } catch (error) {
      Alert.alert('Dashboard error', String(error));
    }
  }

  function updateForm(setForm, key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function login(username, password) {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return false;
    setAuthenticated(true);
    return true;
  }

  function logout() {
    setAuthenticated(false);
    setTab('Dashboard');
    setModal('');
  }

  function openPartyForm(party = null) {
    setEditingPartyId(party?.id ?? null);
    setPartyForm(party ? {
      name: party.name || '',
      phone: party.phone || '',
      type: party.type || 'Farmer',
      address: party.address || '',
    } : newPartyForm());
    setModal('party');
  }

  async function saveParty() {
    if (!partyForm.name.trim()) return Alert.alert('Required', 'Enter party name.');
    if (editingPartyId !== null) {
      await db.runAsync(
        'UPDATE parties SET name=?, phone=?, type=?, address=? WHERE id=?',
        [
          partyForm.name.trim(),
          partyForm.phone,
          partyForm.type,
          partyForm.address,
          editingPartyId,
        ],
      );
    } else {
      await db.runAsync(
        'INSERT INTO parties (name, phone, type, address, created_at) VALUES (?, ?, ?, ?, ?)',
        [partyForm.name.trim(), partyForm.phone, partyForm.type, partyForm.address, today()],
      );
    }
    const wasEditing = editingPartyId !== null;
    setPartyForm(newPartyForm());
    setEditingPartyId(null);
    setModal('');
    await refresh();
    if (wasEditing) Alert.alert('Saved', 'Party details updated.');
  }

  async function deleteParty(partyId) {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM payments WHERE party_id=?', [partyId]);
        await db.runAsync('DELETE FROM entries WHERE party_id=?', [partyId]);
        await db.runAsync('DELETE FROM parties WHERE id=?', [partyId]);
      });
      await refresh();
      return true;
    } catch (error) {
      Alert.alert('Delete failed', String(error));
      return false;
    }
  }

  function openEntry(type, partyId = '') {
    setEntryForm({ ...newEntryForm(type), party_id: String(partyId || '') });
    setModal('entry');
  }

  async function saveEntry() {
    const form = entryForm;
    if (!form.party_id) return Alert.alert('Required', 'Select a farmer/seller.');
    const weight = Number(form.gross_weight || 0);
    const rate = Number(form.rate || 0);
    const weightDeduction = Number(form.weight_deduction || 0);
    const amountDeduction = Number(form.amount_deduction || 0);
    const paid = Number(form.paid || 0);
    const crateCount = Number(form.crate_count || 0);
    if (![weight, rate, weightDeduction, amountDeduction, paid, crateCount]
      .every(Number.isFinite)) {
      return Alert.alert('Invalid entry', 'Enter valid numbers for all transaction details.');
    }
    if (weight <= 0 || rate <= 0) {
      return Alert.alert('Invalid entry', 'Weight and rate must be greater than zero.');
    }
    if (weightDeduction > weight) {
      return Alert.alert('Invalid deduction', 'Weight deduction cannot exceed gross weight.');
    }
    if (weightDeduction < 0 || amountDeduction < 0 || paid < 0) {
      return Alert.alert('Invalid amount', 'Weights, deductions, and payment cannot be negative.');
    }
    const {
      grossAmount: gross,
      netAmount: net,
      paid: paidToEntry,
      advance: advanceAmount,
    } = calculateTransactionAmounts({
      weight,
      rate,
      weightDeduction,
      amountDeduction,
      payment: paid,
    });
    const prefix = form.type === 'Purchase' ? 'PUR' : 'SAL';
    const invoice = `${prefix}-${Date.now().toString().slice(-8)}`;
    if (crateCount < 0 || !Number.isInteger(crateCount)) {
      const caratLabel = form.type === 'Purchase' ? 'Carat received' : 'Carat sold';
      return Alert.alert('Invalid carat count', `${caratLabel} must be a whole number.`);
    }
    const partyId = Number(form.party_id);
    await db.withTransactionAsync(async () => {
      await db.runAsync(`INSERT INTO entries
        (type, party_id, date, item, crate_count, gross_weight, rate, weight_deduction,
         amount_deduction, deduction_note, gross_amount, net_amount, paid, balance, invoice_no)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          form.type,
          partyId,
          form.date,
          form.item,
          crateCount,
          weight,
          rate,
          weightDeduction,
          amountDeduction,
          form.deduction_note,
          gross,
          net,
          paidToEntry,
          net - paidToEntry,
          invoice,
        ],
      );
      if (paidToEntry > 0) {
        await db.runAsync(
          'INSERT INTO payments (party_id,date,amount,type,note,applied_amount) VALUES (?,?,?,?,?,?)',
          [
            partyId,
            form.date,
            paidToEntry,
            'Payment',
            `${form.type} ${invoice} - initial payment`,
            paidToEntry,
          ],
        );
      }
      if (advanceAmount > 0) {
        await db.runAsync(
          `INSERT INTO payments (party_id,date,amount,type,note,applied_amount)
             VALUES (?, ?, ?, 'Advance', ?, 0)`,
          [
            partyId,
            form.date,
            advanceAmount,
            `${form.type} ${invoice} - advance`,
          ],
        );
      }

      const advances = await db.getAllAsync(
        `SELECT * FROM payments
         WHERE party_id=? AND type='Advance' AND amount>COALESCE(applied_amount, 0)
         ORDER BY date ASC, id ASC`,
        [partyId],
      );
      const entryType = form.type;
      const openEntries = await db.getAllAsync(
        `SELECT * FROM entries
         WHERE party_id=? AND type=? AND balance>0
         ORDER BY date ASC, id ASC`,
        [partyId, entryType],
      );
      for (const advance of advances) {
        const advanceRemaining = Number(advance.amount) - Number(advance.applied_amount || 0);
        const { allocations } = await applyAmountToEntries(db, advanceRemaining, openEntries);
        const advanceApplied = allocations.reduce((total, item) => total + item.amount, 0);
        if (advanceApplied > 0) {
          await db.runAsync(
            'UPDATE payments SET applied_amount=COALESCE(applied_amount, 0)+? WHERE id=?',
            [advanceApplied, advance.id],
          );
        }
      }
    });
    setModal('');
    await refresh();
    Alert.alert('Saved', `${form.type} saved. Invoice: ${invoice}`);
  }

  async function savePayment() {
    const form = paymentForm;
    const amount = Number(form.amount || 0);
    const partyId = Number(form.party_id);
    const party = parties.find(item => item.id === partyId);
    if (!party) {
      return Alert.alert('Required', 'Select a party.');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return Alert.alert('Invalid amount', 'Enter a valid amount greater than zero.');
    }
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        'INSERT INTO payments (party_id,date,amount,type,note,applied_amount) VALUES (?,?,?,?,?,?)',
        [partyId, form.date, amount, form.type, form.note, 0],
      );
      const entryType = party.type === 'Farmer' ? 'Purchase' : 'Sale';
      const openEntries = await db.getAllAsync(
        `SELECT * FROM entries
         WHERE party_id=? AND type=? AND balance>0
         ORDER BY date ASC, id ASC`,
        [partyId, entryType],
      );
      const { remaining } = await applyAmountToEntries(db, amount, openEntries);
      await db.runAsync(
        `UPDATE payments
         SET applied_amount=?,
             type=CASE WHEN ?>0 AND type='Payment' THEN 'Advance' ELSE type END
         WHERE id=?`,
        [amount - remaining, remaining, result.lastInsertRowId],
      );
    });
    setModal('');
    await refresh();
  }

  async function makeInvoice(item) {
    const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        body{font-family:Arial,sans-serif;padding:28px;color:#24342a}
        h1{font-size:22px;color:#24563b;margin:0}
        .caption{color:#718075;font-size:12px;letter-spacing:1px;margin:5px 0 22px}
        .meta,.party{background:#f4f7f1;padding:12px 14px;border-radius:8px;margin:12px 0}
        .meta span{display:inline-block;margin-right:24px}
        .muted{color:#718075;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:18px}
        td{padding:10px 8px;border-bottom:1px solid #e3e9e1}
        td:last-child{text-align:right}
        .total td{font-weight:bold;font-size:16px;color:#24563b}
        .thanks{text-align:center;color:#718075;margin-top:26px}
      </style></head><body>
      <h1>Sabale Banana</h1>
      <div class="caption">${item.type === 'Purchase' ? 'PURCHASE RECEIPT' : 'SALES INVOICE'}</div>
      <div class="meta"><span><span class="muted">INVOICE</span><br/>${escapeHtml(item.invoice_no)}</span>
      <span><span class="muted">DATE</span><br/>${escapeHtml(item.date)}</span></div>
      <div class="party"><span class="muted">${item.type === 'Purchase' ? 'FARMER' : 'CUSTOMER / DEALER'}</span><br/>
      <b>${escapeHtml(item.party_name || '')}</b>
      ${item.party_phone ? `<br/>${escapeHtml(item.party_phone)}` : ''}
      ${item.party_address ? `<br/>${escapeHtml(item.party_address)}` : ''}</div>
      <table>
      <tr><td>Product</td><td>${escapeHtml(item.item || 'Banana')}</td></tr>
      ${Number(item.crate_count || 0) > 0
    ? `<tr><td>${item.type === 'Purchase' ? 'Carat received' : 'Carat sold'}</td><td>${escapeHtml(item.crate_count)}</td></tr>`
    : ''}
      <tr><td>Gross weight</td><td>${escapeHtml(item.gross_weight)} kg</td></tr>
      <tr><td>Rate per kg</td><td>${money(item.rate)}</td></tr>
      <tr><td>Gross amount</td><td>${money(item.gross_amount)}</td></tr>
      <tr><td>Weight deduction</td><td>${escapeHtml(item.weight_deduction)} kg</td></tr>
      ${item.deduction_note ? `<tr><td>Deduction note</td><td>${escapeHtml(item.deduction_note)}</td></tr>` : ''}
      <tr><td>Amount deduction</td><td>${money(item.amount_deduction)}</td></tr>
      ${item.type === 'Purchase' ? '' : `<tr><td>Paid</td><td>${money(item.paid)}</td></tr>`}
      <tr class="total"><td>Balance due</td><td>${money(item.balance)}</td></tr>
      </table><p class="thanks">Thank you for your business.</p></body></html>`;
    try {
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: 'Share invoice PDF',
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
      else Alert.alert('PDF created', file.uri);
    } catch (error) {
      Alert.alert('PDF error', String(error));
    }
  }

  async function exportTablePdf(title, headers, rows) {
    const tableRows = rows.map(row => `<tr>${row.map(value =>
      `<td>${escapeHtml(value ?? '')}</td>`).join('')}</tr>`).join('');
    const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#24342a}
        h1{font-size:20px;color:#24563b;margin:0 0 16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:9px 7px;border:1px solid #e3e9e1;text-align:left}
        th{background:#f4f7f1;color:#24563b}
        tr:nth-child(even){background:#fbfcfa}
      </style></head><body>
      <h1>${escapeHtml(title)}</h1>
      <table><thead><tr>${headers.map(header =>
      `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>`;
    try {
      if (Platform.OS === 'web') {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            throw new Error('Allow pop-ups to export this table as a PDF.');
          }
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          return;
        }
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: `Export ${title} PDF`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF created', file.uri);
      }
    } catch (error) {
      const message = `PDF export failed: ${String(error)}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message);
      } else {
        Alert.alert('PDF export failed', String(error));
      }
    }
  }

  function openPayment() {
    setPaymentForm(newPaymentForm());
    setModal('payment');
  }

  if (!authenticated) {
    return (
      <SafeAreaContainer edges={['top', 'right', 'bottom', 'left']} style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LoginScreen onLogin={login} />
      </SafeAreaContainer>
    );
  }

  if (!db) {
    return (
      <SafeAreaContainer edges={['top', 'right', 'bottom', 'left']} style={styles.center}>
        <AppText>Preparing your business database…</AppText>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer edges={['top', 'right', 'bottom', 'left']} style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.topbar}>
        <View style={styles.brandGroup}>
          <View style={styles.brandMark}>
            <BananaLogo size={40} />
          </View>
          <View>
            <AppText style={styles.brand}>Sabale Banana</AppText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <MaterialCommunityIcons name="logout" size={18} color="#1C5937" />
          <AppText style={styles.logoutText}>Log out</AppText>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {tab === 'Dashboard' && (
          <DashboardScreen
            summary={summary}
            entries={dashboardEntries}
            period={dashboardPeriod}
            month={dashboardMonth}
            year={dashboardYear}
            selectedDate={dashboardDate}
            onPeriodChange={changeDashboardPeriod}
          />
        )}
        {tab === 'Parties' && (
          <PartyDirectoryScreen
            role="Parties"
            parties={parties}
            partyTotals={partyTotals}
            entries={entries}
            onAdd={type => openPartyForm({ type })}
            onEdit={openPartyForm}
            onDelete={deleteParty}
            onTransaction={openEntry}
            onInvoice={makeInvoice}
          />
        )}
        {tab === 'Purchase' && (
          <TransactionsScreen
            entries={entries}
            type="Purchase"
            onAdd={() => openEntry('Purchase')}
            onInvoice={makeInvoice}
          />
        )}
        {tab === 'Sales' && (
          <TransactionsScreen
            entries={entries}
            type="Sale"
            onAdd={() => openEntry('Sale')}
            onInvoice={makeInvoice}
          />
        )}
        {tab === 'Invoices' && (
          <InvoicesScreen
            entries={entries}
            onInvoice={makeInvoice}
          />
        )}
        {tab === 'Payment' && (
          <PaymentStatusScreen
            payments={payments}
            onAddPayment={openPayment}
            onExportPdf={exportTablePdf}
          />
        )}
      </View>
      <View style={styles.nav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navItems}
        >
          {navigationItems.map(item => (
            <TouchableOpacity
              key={item.label}
              onPress={() => setTab(item.tab || item.label)}
              style={[
                styles.navItem,
                tab === (item.tab || item.label) && styles.navItemActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === (item.tab || item.label) }}
              accessibilityLabel={item.label}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={21}
                color={tab === (item.tab || item.label) ? '#174E35' : '#68766D'}
              />
              <AppText style={[
                styles.navText,
                tab === (item.tab || item.label) && styles.navActive,
              ]} numberOfLines={1} maxFontSizeMultiplier={1}>
                {item.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <PartyForm
        visible={modal === 'party'}
        form={partyForm}
        isEditing={editingPartyId !== null}
        onChange={(key, value) => updateForm(setPartyForm, key, value)}
        onSave={saveParty}
        onClose={() => {
          setModal('');
          setEditingPartyId(null);
        }}
      />
      <EntryForm
        visible={modal === 'entry'}
        form={entryForm}
        parties={parties}
        onChange={(key, value) => updateForm(setEntryForm, key, value)}
        onSave={saveEntry}
        onClose={() => setModal('')}
      />
      <PaymentForm
        visible={modal === 'payment'}
        form={paymentForm}
        parties={parties}
        onChange={(key, value) => updateForm(setPaymentForm, key, value)}
        onSave={savePayment}
        onClose={() => setModal('')}
      />
    </SafeAreaContainer>
  );
}
