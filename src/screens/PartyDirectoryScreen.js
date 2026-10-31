import React, { useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity, View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EntryTable, StatCard, TableControls } from '../components/common';
import AppText from '../components/AppText';
import styles from '../styles';
import { money } from '../utils/format';

export default function PartyDirectoryScreen({
  role,
  parties,
  partyTotals = [],
  entries,
  onAdd,
  onEdit,
  onDelete,
  onTransaction,
  onInvoice,
}) {
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [partyActions, setPartyActions] = useState(null);
  const [partyToDelete, setPartyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('All');
  const [partyPage, setPartyPage] = useState(0);
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const isCombined = role === 'Parties';
  const isFarmer = role === 'Farmer' || (isCombined && partyFilter === 'Farmers');
  const isSeller = role === 'Seller' || (isCombined && partyFilter === 'Customers');
  const title = isCombined ? 'Parties' : isFarmer ? 'Farmers' : 'Sellers';
  const visibleParties = parties.filter(party =>
    isCombined && partyFilter === 'All'
      ? true
      : isFarmer
        ? party.type === 'Farmer'
        : party.type === 'Customer' || party.type === 'Dealer',
  );
  const filteredParties = visibleParties.filter(party =>
    `${party.name} ${party.phone || ''} ${party.address || ''}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const partyPageSize = 10;
  const partyTotalPages = Math.ceil(filteredParties.length / partyPageSize);
  const currentPartyPage = Math.min(partyPage, Math.max(0, partyTotalPages - 1));
  const pageParties = filteredParties.slice(
    currentPartyPage * partyPageSize,
    (currentPartyPage + 1) * partyPageSize,
  );
  const selectedParty = visibleParties.find(party => party.id === selectedPartyId);
  const selectedIsFarmer = selectedParty?.type === 'Farmer';
  const selectedTransactionType = selectedIsFarmer ? 'Purchase' : 'Sale';
  const partyEntries = selectedParty
    ? entries.filter(entry =>
      entry.party_id === selectedParty.id && entry.type === selectedTransactionType,
    )
    : [];
  const selectedPartyTotals = partyTotals.find(stats =>
    stats.party_id === selectedParty?.id && stats.type === selectedTransactionType,
  );
  const total = Number(selectedPartyTotals?.total || 0);
  const balance = Number(selectedPartyTotals?.balance || 0);
  const partyStats = new Map(
    partyTotals
      .map(stats => [`${stats.party_id}:${stats.type}`, stats]),
  );

  if (selectedParty) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerLine}>
          <TouchableOpacity onPress={() => setSelectedPartyId(null)}>
            <AppText style={styles.backButton}>‹ {title}</AppText>
          </TouchableOpacity>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.primary}
              onPress={() => onTransaction(selectedTransactionType, selectedParty.id)}
              activeOpacity={0.8}
            >
              <AppText style={styles.primaryText}>
                {selectedIsFarmer ? '+ Purchase' : '+ Sale'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
        <AppText style={styles.heading}>{selectedParty.name}</AppText>
        <View style={styles.listCard}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.rowTitle}>{selectedParty.type}</AppText>
            <AppText style={styles.muted}>{selectedParty.phone || 'No phone number'}</AppText>
            {!!selectedParty.address && (
              <AppText style={styles.muted}>{selectedParty.address}</AppText>
            )}
          </View>
        </View>
        <View style={styles.stats}>
          <StatCard
            title={selectedIsFarmer ? 'Total purchases' : 'Total sales'}
            value={total}
          />
          <StatCard
            title={selectedIsFarmer ? 'Payable to farmer' : 'Receivable from customer'}
            value={balance}
            color={selectedIsFarmer ? '#B42318' : '#276B45'}
          />
        </View>
        <AppText style={styles.sectionTitle}>
          {selectedIsFarmer ? 'Purchase history' : 'Sales history'}
        </AppText>
        {partyEntries.length ? (
          <EntryTable
            entries={partyEntries}
            onInvoice={onInvoice}
            partyLabel={selectedIsFarmer ? 'Farmer' : 'Seller'}
          />
        ) : (
          <AppText style={styles.empty}>
            No {selectedTransactionType.toLowerCase()} entries for this {selectedParty.type.toLowerCase()} yet.
          </AppText>
        )}
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerLine}>
          <AppText style={styles.heading}>{title}</AppText>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => onAdd(isSeller ? 'Customer' : 'Farmer')}
          >
            <AppText style={styles.primaryText}>
              {isCombined ? '+ Add party' : `+ Add ${role}`}
            </AppText>
          </TouchableOpacity>
        </View>
        {isCombined && (
          <View style={styles.partyFilterRow}>
            {['All', 'Farmers', 'Customers'].map(filter => (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  setPartyPage(0);
                  setPartyFilter(filter);
                }}
                style={[
                  styles.partyFilterButton,
                  partyFilter === filter && styles.partyFilterButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: partyFilter === filter }}
              >
                <AppText style={[
                  styles.partyFilterText,
                  partyFilter === filter && styles.partyFilterTextActive,
                ]}>
                  {filter}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={19} color="#68766D" />
          <TextInput
            value={search}
            onChangeText={value => {
              setPartyPage(0);
              setSearch(value);
            }}
            placeholder={`Search ${title.toLowerCase()}...`}
            placeholderTextColor="#8A958D"
            style={styles.searchInput}
            accessibilityLabel={`Search ${title.toLowerCase()}`}
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => {
                setPartyPage(0);
                setSearch('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#8A958D" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.partyTable}>
          <View style={[
            styles.partyTableRow,
            styles.partyTableHeader,
            isCompact && styles.partyCompactTableRow,
          ]}>
            <AppText style={[
              styles.partyTableCell,
              styles.partyTableName,
              isCompact && styles.partyCompactName,
            ]}>
              Name
            </AppText>
            {isCombined && partyFilter === 'All' && !isCompact && (
              <AppText style={[styles.partyTableCell, styles.partyTypeCell]}>Type</AppText>
            )}
            {!isCompact && (
              <>
                <AppText style={[styles.partyTableCell, styles.partyTablePhone]}>Phone</AppText>
                <AppText style={[styles.partyTableCell, styles.partyAddressCell]}>Address</AppText>
              </>
            )}
            {isCompact && (
              <AppText style={[styles.partyTableCell, styles.partyCompactMetric]}>
                {isFarmer ? 'Purchases' : isSeller ? 'Sales' : 'Total'}
              </AppText>
            )}
            {!isCompact && (
              <AppText style={styles.partyTableCell}>
                {isFarmer ? 'Total purchase' : isSeller ? 'Total sales' : 'Total amount'}
              </AppText>
            )}
            {!isCompact && (
              <AppText style={styles.partyTableCell}>Pending payment</AppText>
            )}
            {isCompact && (
              <AppText style={[styles.partyTableCell, styles.partyCompactMetric]}>
                Pending
              </AppText>
            )}
            <View style={styles.partyTableActionHeader} />
          </View>
          {pageParties.map(item => {
            const itemIsFarmer = item.type === 'Farmer';
            const itemTransactionType = itemIsFarmer ? 'Purchase' : 'Sale';
            const stats = partyStats.get(`${item.id}:${itemTransactionType}`)
              || { balance: 0, total: 0 };
            const paid = Number(stats.balance || 0) <= 0;
            const itemDueColor = itemIsFarmer ? '#B42318' : '#276B45';
            return (
              <View
                key={item.id}
                style={[styles.partyTableRow, isCompact && styles.partyCompactTableRow]}
              >
                <TouchableOpacity
                  style={[
                    styles.partyTableCell,
                    styles.partyTableName,
                    isCompact && styles.partyCompactName,
                  ]}
                  onPress={() => setSelectedPartyId(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name} profile`}
                >
                  <AppText style={styles.partyTablePartyName} numberOfLines={1}>
                    {item.name}
                  </AppText>
                  {isCompact && (
                    <>
                        {isCombined && partyFilter === 'All' && (
                          <AppText style={styles.partyTableSubtext}>{item.type}</AppText>
                        )}
                        <AppText style={styles.partyTableSubtext} numberOfLines={1}>
                        {item.phone || 'No phone'}
                      </AppText>
                      <AppText style={styles.partyTableSubtext} numberOfLines={1}>
                        {item.address || 'No address'}
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
                {isCombined && partyFilter === 'All' && !isCompact && (
                  <AppText style={[styles.partyTableCell, styles.partyTypeCell]}>
                    {item.type}
                  </AppText>
                )}
                {!isCompact && (
                  <>
                    <AppText style={[styles.partyTableCell, styles.partyTablePhone]} numberOfLines={1}>
                      {item.phone || '—'}
                    </AppText>
                    <AppText
                      style={[styles.partyTableCell, styles.partyAddressCell]}
                      numberOfLines={1}
                    >
                      {item.address || '—'}
                    </AppText>
                  </>
                )}
                <AppText style={[
                  styles.partyTableCell,
                  isCompact && styles.partyCompactMetric,
                  styles.partyTotalValue,
                ]}>
                  {money(stats.total)}
                </AppText>
                <AppText style={[
                  styles.partyTableCell,
                  isCompact && styles.partyCompactMetric,
                  paid ? styles.partyPaidValue : styles.partyPendingValue,
                  { color: paid ? '#276B45' : itemDueColor },
                ]}>
                  {money(stats.balance)}
                </AppText>
                <View style={styles.partyTableActions}>
                  <TouchableOpacity
                    style={styles.partyTableMenuButton}
                    onPress={() => setPartyActions(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Actions for ${item.name}`}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#1C5937" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        {!!filteredParties.length && (
          <TableControls
            page={currentPartyPage}
            totalPages={partyTotalPages}
            itemCount={filteredParties.length}
            pageSize={partyPageSize}
            onPageChange={setPartyPage}
          />
        )}
        {!filteredParties.length && (
          <AppText style={styles.empty}>
            {search
              ? `No ${title.toLowerCase()} match your search.`
              : `No ${title.toLowerCase()} added yet.`}
          </AppText>
        )}
      </ScrollView>
      <Modal
        visible={!!partyActions}
        transparent
        animationType="fade"
        onRequestClose={() => setPartyActions(null)}
      >
        <TouchableOpacity
          style={styles.partyMenuShade}
          activeOpacity={1}
          onPress={() => setPartyActions(null)}
        >
          <View style={styles.partyMenuCard}>
            <AppText style={styles.partyMenuTitle}>{partyActions?.name}</AppText>
            <TouchableOpacity
              style={styles.partyMenuItem}
              onPress={() => {
                const selectedParty = partyActions;
                setPartyActions(null);
                onEdit(selectedParty);
              }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="pencil-outline" size={19} color="#1C5937" />
              <AppText style={styles.partyMenuText}>Edit</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.partyMenuItem}
              onPress={() => {
                setPartyToDelete(partyActions);
                setPartyActions(null);
              }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="delete-outline" size={19} color="#B42318" />
              <AppText style={styles.partyMenuDeleteText}>Delete</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={!!partyToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setPartyToDelete(null);
        }}
      >
        <View style={styles.deleteShade}>
          <View style={styles.deleteCard}>
            <AppText style={styles.deleteTitle}>Delete {partyToDelete?.name}?</AppText>
            <AppText style={styles.deleteMessage}>
              This permanently deletes this {partyToDelete?.type || 'party'} and all linked purchases,
              sales, invoices, and payment records. This action cannot be undone.
            </AppText>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setPartyToDelete(null)}
                disabled={deleting}
                accessibilityRole="button"
              >
                <AppText style={styles.deleteCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, deleting && styles.deleteConfirmDisabled]}
                onPress={async () => {
                  if (!partyToDelete || deleting) return;
                  setDeleting(true);
                  try {
                    if (await onDelete(partyToDelete.id)) setPartyToDelete(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                accessibilityRole="button"
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText style={styles.deleteConfirmText}>Delete permanently</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
