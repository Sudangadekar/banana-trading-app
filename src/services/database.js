import * as SQLite from 'expo-sqlite';

const dbPromise = SQLite.openDatabaseAsync('banana_trading.db');

export async function initializeDatabase() {
  const database = await dbPromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      phone TEXT, type TEXT NOT NULL, address TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
      party_id INTEGER NOT NULL, date TEXT NOT NULL, item TEXT,
      crate_count REAL DEFAULT 0, gross_weight REAL DEFAULT 0, rate REAL DEFAULT 0,
      weight_deduction REAL DEFAULT 0, amount_deduction REAL DEFAULT 0,
      deduction_note TEXT, gross_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0, paid REAL DEFAULT 0,
      balance REAL DEFAULT 0, invoice_no TEXT,
      FOREIGN KEY(party_id) REFERENCES parties(id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, party_id INTEGER NOT NULL,
      date TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL,
      note TEXT, applied_amount REAL DEFAULT 0,
      FOREIGN KEY(party_id) REFERENCES parties(id)
    );
  `);
  const entryColumns = await database.getAllAsync('PRAGMA table_info(entries)');
  if (!entryColumns.some(column => column.name === 'crate_count')) {
    await database.execAsync('ALTER TABLE entries ADD COLUMN crate_count REAL DEFAULT 0');
  }
  const paymentColumns = await database.getAllAsync('PRAGMA table_info(payments)');
  if (!paymentColumns.some(column => column.name === 'applied_amount')) {
    await database.execAsync('ALTER TABLE payments ADD COLUMN applied_amount REAL DEFAULT 0');
  }
  return database;
}

export async function loadBusinessData(database) {
  const parties = await database.getAllAsync('SELECT * FROM parties ORDER BY name');
  const partyTotals = await database.getAllAsync(`
    SELECT party_id, type, COUNT(*) AS count,
      COALESCE(SUM(net_amount), 0) AS total,
      COALESCE(SUM(paid), 0) AS paid,
      COALESCE(SUM(balance), 0) AS balance
    FROM entries
    GROUP BY party_id, type
  `);
  const entries = await database.getAllAsync(`
    SELECT entries.*, parties.name AS party_name, parties.type AS party_type
    FROM entries LEFT JOIN parties ON parties.id=entries.party_id
    ORDER BY entries.id DESC LIMIT 100
  `);
  const payments = await database.getAllAsync(`
    SELECT payments.*, parties.name AS party_name, parties.type AS party_type
    FROM payments LEFT JOIN parties ON parties.id=payments.party_id
    ORDER BY payments.date DESC, payments.id DESC
  `);
  return { parties, partyTotals, entries, payments };
}

export async function loadDashboardData(database, { startDate, endDate }) {
  const entries = await database.getAllAsync(`
    SELECT entries.*, parties.name AS party_name, parties.type AS party_type
    FROM entries LEFT JOIN parties ON parties.id=entries.party_id
    WHERE entries.date BETWEEN ? AND ?
    ORDER BY entries.date DESC, entries.id DESC LIMIT 100
  `, [startDate, endDate]);
  const [summary = {}] = await database.getAllAsync(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'Purchase' AND date BETWEEN ? AND ? THEN net_amount ELSE 0 END), 0) AS purchases,
      COALESCE(SUM(CASE WHEN type = 'Sale' AND date BETWEEN ? AND ? THEN net_amount ELSE 0 END), 0) AS sales,
      COALESCE(SUM(CASE WHEN type = 'Purchase' AND date BETWEEN ? AND ? THEN balance ELSE 0 END), 0) AS farmerDue,
      COALESCE(SUM(CASE WHEN type = 'Sale' AND date BETWEEN ? AND ? THEN balance ELSE 0 END), 0) AS customerDue,
      COALESCE(SUM(
        CASE
          WHEN type = 'Purchase' AND date <= ? THEN
            CASE
              WHEN gross_weight > weight_deduction THEN gross_weight - weight_deduction
              ELSE 0
            END
          WHEN type = 'Sale' AND date <= ? THEN
            CASE
              WHEN gross_weight > weight_deduction THEN
                -(gross_weight - weight_deduction)
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS stockAvailable,
      COALESCE((
        SELECT SUM(
          CASE
            WHEN amount > COALESCE(applied_amount, 0)
              THEN amount - COALESCE(applied_amount, 0)
            ELSE 0
          END
        ) FROM payments
        WHERE type = 'Advance' AND date <= ?
      ), 0) AS advances
    FROM entries
  `, [
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    startDate, endDate,
    endDate, endDate,
    endDate,
  ]);

  return { entries, summary };
}
