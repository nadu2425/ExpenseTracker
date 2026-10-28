const STORAGE_KEY = "personalExpenseTrackerTransactions";

const transactionForm = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const clearButton = document.getElementById("clearButton");
const filterInput = document.getElementById("filter");
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("transactionTableBody");
const formMessage = document.getElementById("formMessage");

let transactions = loadTransactions();

// Set today's date as the default date for a new transaction.
dateInput.value = new Date().toISOString().slice(0, 10);

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not load saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    showMessage("Could not save data in this browser. Check browser storage settings.", "error");
    console.error("Could not save transactions:", error);
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type || ""}`;
  // Show a browser popup as well as the message on the page.
  window.alert(message);
}

function updateSummary() {
  const totalIncome = transactions
    .filter(transaction => transaction.type === "Income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter(transaction => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const currentBalance = totalIncome - totalExpenses;

  document.getElementById("totalIncome").textContent = `LKR ${formatMoney(totalIncome)}`;
  document.getElementById("totalExpenses").textContent = `LKR ${formatMoney(totalExpenses)}`;
  document.getElementById("currentBalance").textContent = `LKR ${formatMoney(currentBalance)}`;
}

function renderTransactions() {
  const selectedType = filterInput.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  const visibleTransactions = transactions.filter(transaction => {
    const matchesType = selectedType === "All" || transaction.type === selectedType;
    const searchableText = [
      transaction.description,
      transaction.category,
      transaction.type,
      transaction.date
    ].join(" ").toLowerCase();
    return matchesType && searchableText.includes(searchTerm);
  });

  tableBody.replaceChildren();

  if (visibleTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = transactions.length === 0
      ? "No transactions yet. Add your first transaction above."
      : "No transactions match your filter or search.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  // Show newest dates first.
  visibleTransactions.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    return dateCompare || String(b.id).localeCompare(String(a.id));
  });

  visibleTransactions.forEach(transaction => {
    const row = document.createElement("tr");

    addCell(row, formatDate(transaction.date));
    addCell(row, transaction.description);

    const typeCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `type-badge ${transaction.type.toLowerCase()}`;
    badge.textContent = transaction.type;
    typeCell.appendChild(badge);
    row.appendChild(typeCell);

    addCell(row, transaction.category);

    const amountCell = document.createElement("td");
    amountCell.className = `amount-cell ${transaction.type === "Income" ? "amount-income" : "amount-expense"}`;
    amountCell.textContent = `${transaction.type === "Income" ? "+" : "−"} ${formatMoney(Number(transaction.amount))}`;
    row.appendChild(amountCell);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete transaction: ${transaction.description}`);
    deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.appendChild(cell);
}

function deleteTransaction(id) {
  const transaction = transactions.find(item => item.id === id);
  if (!transaction) return;

  const confirmed = window.confirm(`Delete "${transaction.description}"?`);
  if (!confirmed) return;

  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  updateSummary();
  renderTransactions();
  showMessage("Transaction deleted successfully.", "success");
}

transactionForm.addEventListener("submit", event => {
  event.preventDefault();

  const type = typeInput.value;
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!type || !description || !category || !date) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage("Amount must be a number greater than zero.", "error");
    amountInput.focus();
    return;
  }

  const transaction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    description,
    amount,
    category,
    date
  };

  transactions.push(transaction);
  saveTransactions();
  updateSummary();
  renderTransactions();

  transactionForm.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showMessage("Transaction added successfully.", "success");
  typeInput.focus();
});

clearButton.addEventListener("click", () => {
  transactionForm.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  showMessage("Form cleared.", "");
  typeInput.focus();
});

filterInput.addEventListener("change", renderTransactions);
searchInput.addEventListener("input", renderTransactions);

// Restore saved transactions and update the page when it opens.
updateSummary();
renderTransactions();
