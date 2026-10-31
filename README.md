# Banana Trading Manager (React Native / Expo)

An offline-first, single-owner Android starter app for banana trading.

## Included in this starter
- Local SQLite database (no server or internet required for normal use)
- Farmer, customer and dealer records
- Purchase and sales entries
- Purchase/sales carat count, weight, per-kg rate, deductions, and calculated balance due
- Weight deduction (kg) and direct amount deduction
- Net amount and outstanding balance calculation
- Initial payment against an entry
- Payment and advance ledger
- PDF purchase receipt / sales invoice sharing
- Dashboard totals and recent transactions
- Dashboard stock available (net purchased weight less sold weight), farmer due, and customer due
- Dashboard Day, Week, Month, and Year filters for period-based totals and transactions

The dashboard defaults to the current month. Its filter controls stay collapsed until the filter icon is selected; apply a chosen period to update the dashboard, or cancel to leave it unchanged. The filter includes All time, Day, Week, Month, and Year. The month selector includes all 12 months, and the year selector includes the current year and previous four years. Use the clear button to return to All time. The week filter uses Monday through Sunday, and stock available is calculated through the selected period's end date.

## Demo login
Sign in with username `admin` and password `admin`. Logging out returns to the login screen. These credentials are hard-coded for demonstration only; client-side login is not production-grade security.

## Code structure
The app is organized so screens, reusable UI, and business logic can be changed independently:

```text
App.js                         App state and business actions
src/
  components/
    common.js                  Shared inputs, selectors, modal, and display components
    forms/                     Party, transaction, and payment forms
  screens/                     Dashboard, parties, transaction, and invoice screens
  services/database.js         SQLite setup and business data loading
  utils/transaction.js         Shared transaction calculations and balance allocation
  utils/format.js              Shared date, currency, and HTML formatting
  styles.js                    Shared application styles
```

Add reusable UI in `src/components`, screen-level UI in `src/screens`, and database operations in `src/services`.

The Parties tab combines farmers and customers. Use its All, Farmers, and Customers filters to browse records; farmers open purchase history, while customers open sales history. Choose Farmer or Customer in the party form when adding a record. Use the three-dot menu on a party row to edit or delete it. Deletion requires confirmation and permanently removes all linked purchases, sales, invoices, and payments. From a profile, use the purchase or sale action to start a transaction for that party. Selecting a transaction's PDF action creates the invoice and opens the device share sheet; choose WhatsApp there to send it.

Party, purchase, sale, invoice, payment, and party-history tables show 10 rows per page with navigation controls. The Payments table includes an Export PDF action for its full list. On web, use the browser print dialog to save the PDF; on Android, the generated PDF opens the share sheet. On narrow screens, transaction details are condensed into stacked table cells to avoid horizontal scrolling.

The bottom navigation keeps Dashboard, Parties, Purchase, Sale, Invoices, and Payment. The Payments tab lists date, party, party type, amount, and completion status, with an Add payment action and PDF export. Payments to farmers reduce outstanding purchase balances; payments received from customers reduce outstanding sales balances. Recorded advances are applied to future purchases or sales for that party and remain pending in the ledger until fully applied. Farmer amounts still payable are shown in red; customer amounts receivable are shown in green. Invoices lists purchase and sale documents. After saving a purchase or sale, the app confirms the invoice number; use a row's PDF action when you want to create and share the invoice.

## Requirements
- Node.js LTS
- Android Studio + Android SDK (for emulator / local APK build)
- Expo-compatible Android device or emulator

## Run on Android phone
1. Extract this project.
2. Open a terminal in the project folder.
3. Run `npm install`.
4. Run `npx expo install --check` and resolve any SDK package version suggestions if Expo reports them.
5. Run `npx expo start`.
6. Install Expo Go on your Android phone, scan the QR code, and open the app.

The first run creates `banana_trading.db` on the device. Data stays on that device.

## Build an installable Android APK
For a distributable APK, use EAS Build:
1. Install EAS CLI: `npm install -g eas-cli`
2. Sign in: `eas login`
3. Configure: `eas build:configure`
4. Create `eas.json` with:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

5. Build APK: `eas build -p android --profile preview`

## Important calculation rule
Gross amount = gross weight × rate

Net amount = (gross weight − weight deduction) × rate − direct amount deduction

Transaction balance = net amount − amount paid/applied, with a minimum balance of zero

Any amount paid or received beyond the transaction total is recorded as an advance/credit. Advances are first applied to that party's oldest unpaid transactions of the matching type; any remaining credit carries forward to future transactions. Dashboard available advances show the unapplied portion of advances dated on or before the selected period's end date. Farmer purchase balances payable are red; customer sale balances receivable are green.

Stock available (kg) = purchased weight after deductions − sold weight after deductions

## Before giving this to a paying client
This is an MVP starter codebase, not a finished audited accounting product. Test on real Android devices and complete the following client-specific work:
- Business name, logo, address, invoice numbering and invoice fields
- GST/tax configuration if required
- Backup and restore / device migration (database currently remains local to the device)
- Advance adjustment against future farmer purchases
- Edit, delete, cancellation and transaction audit history
- Detailed party-wise ledger and date-range reports
- Validation of local accounting and invoice requirements

## Database tables
- `parties`: farmers, customers, dealers
- `entries`: purchases and sales with crate counts, weight/amount deductions, and balances
- `payments`: payments and advances

Package name in `app.json` is a placeholder. Change `com.yourcompany.bananatrading` to a unique package ID before building the client's APK.
