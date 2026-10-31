export function calculateTransactionAmounts({
  weight,
  rate,
  weightDeduction = 0,
  amountDeduction = 0,
  payment = 0,
}) {
  const safeWeight = Number.isFinite(weight) ? weight : 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const safeWeightDeduction = Number.isFinite(weightDeduction) ? weightDeduction : 0;
  const safeAmountDeduction = Number.isFinite(amountDeduction) ? amountDeduction : 0;
  const safePayment = Number.isFinite(payment) ? payment : 0;
  const netWeight = calculateNetWeight(safeWeight, safeWeightDeduction);
  const grossAmount = safeWeight * safeRate;
  const netAmount = Math.max(0, netWeight * safeRate - safeAmountDeduction);
  const paid = Math.min(Math.max(0, safePayment), netAmount);

  return {
    grossAmount,
    netAmount,
    paid,
    balance: netAmount - paid,
    advance: Math.max(0, safePayment - paid),
  };
}

export function calculateNetWeight(weight, deduction = 0) {
  const safeWeight = Number.isFinite(weight) ? weight : 0;
  const safeDeduction = Number.isFinite(deduction) ? deduction : 0;
  return Math.max(0, safeWeight - safeDeduction);
}

export function allocateAmountToEntries(amount, entries) {
  let remaining = Math.max(0, Number(amount) || 0);
  const allocations = [];

  for (const entry of entries) {
    if (remaining <= 0) break;
    const balance = Math.max(0, Number(entry.balance) || 0);
    if (balance <= 0) continue;
    const applied = Math.min(remaining, balance);
    allocations.push({ entry, amount: applied });
    remaining -= applied;
  }

  return { allocations, remaining };
}

export function getBalanceColor(type, balance) {
  if (Number(balance || 0) <= 0) return '#276B45';
  return type === 'Purchase' ? '#B42318' : '#276B45';
}

export function getPaymentStatus(entry) {
  const balance = Number(entry.balance || 0);
  if (balance <= 0) return { label: 'Paid', color: '#276B45' };
  return {
    label: Number(entry.paid || 0) > 0 ? 'Partially paid' : 'Unpaid',
    color: getBalanceColor(entry.type, balance),
  };
}
