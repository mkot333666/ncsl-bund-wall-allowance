const workersBody = document.getElementById("workersBody");

const addWorkerBtn = document.getElementById("addWorkerBtn");
const exportBtn = document.getElementById("exportBtn");
const printBtn = document.getElementById("printBtn");
const clearBtn = document.getElementById("clearBtn");

const grandTotalDisplay = document.getElementById("grandTotal");
const summaryTotal = document.getElementById("summaryTotal");
const workerCount = document.getElementById("workerCount");
const saveStatus = document.getElementById("saveStatus");

const STORAGE_KEY = "ncslBundWallAllowanceV1";

const amountFields = [
    "mondayA", "mondayB",
    "tuesdayA", "tuesdayB",
    "wednesdayA", "wednesdayB",
    "thursdayA", "thursdayB",
    "fridayA", "fridayB",
    "saturdayA", "saturdayB"
];

const fieldLabels = [
    "Monday Mbaise A",
    "Monday Mbaise B",
    "Tuesday Mbaise A",
    "Tuesday Mbaise B",
    "Wednesday Mbaise A",
    "Wednesday Mbaise B",
    "Thursday Mbaise A",
    "Thursday Mbaise B",
    "Friday Mbaise A",
    "Friday Mbaise B",
    "Saturday Mbaise A",
    "Saturday Mbaise B"
];

function formatMoney(amount) {
    return "₦" + amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
}

function addWorker(data = {}) {
    const row = document.createElement("tr");

    const numberCell = document.createElement("td");
    numberCell.className = "serial-number";
    row.appendChild(numberCell);

    // Worker name
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");

    nameInput.type = "text";
    nameInput.className = "worker-name";
    nameInput.placeholder = "Worker's full name";
    nameInput.value = data.name || "";
    nameInput.setAttribute("aria-label", "Worker name");

    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);

    // Twelve daily amount fields
    amountFields.forEach(field => {
        const cell = document.createElement("td");
        const input = document.createElement("input");

        input.type = "number";
        input.min = "0";
        input.step = "0.01";
        input.placeholder = "0.00";
        input.className = "amount-input";
        input.dataset.field = field;
        input.value = data[field] ?? "";
        input.setAttribute("aria-label", field);

        cell.appendChild(input);
        row.appendChild(cell);
    });

    // Weekly total
    const totalCell = document.createElement("td");
    totalCell.className = "total-cell";
    totalCell.textContent = "₦0.00";
    row.appendChild(totalCell);

    // Account number
    const accountCell = document.createElement("td");
    const accountInput = document.createElement("input");

    accountInput.type = "text";
    accountInput.inputMode = "numeric";
    accountInput.className = "account-input";
    accountInput.placeholder = "Account number";
    accountInput.value = data.account || "";
    accountInput.setAttribute("aria-label", "Account number");

    accountCell.appendChild(accountInput);
    row.appendChild(accountCell);

    // Bank name
    const bankCell = document.createElement("td");
    const bankInput = document.createElement("input");

    bankInput.type = "text";
    bankInput.className = "bank-input";
    bankInput.placeholder = "Bank name";
    bankInput.value = data.bank || "";
    bankInput.setAttribute("aria-label", "Bank name");

    bankCell.appendChild(bankInput);
    row.appendChild(bankCell);

    // Remove worker
    const actionCell = document.createElement("td");
    actionCell.className = "no-print";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
        if (confirm("Remove this worker from the allowance form?")) {
            row.remove();
            updateAll();
        }
    });

    actionCell.appendChild(removeButton);
    row.appendChild(actionCell);

    // Update when an entry changes
    row.addEventListener("input", updateAll);

    workersBody.appendChild(row);

    updateAll();
}

function calculateWorkerTotal(row) {
    let total = 0;

    amountFields.forEach(field => {
        const input = row.querySelector(
            `[data-field="${field}"]`
        );

        total += getNumber(input.value);
    });

    const totalCell = row.querySelector(".total-cell");
    totalCell.textContent = formatMoney(total);

    return total;
}

function updateAll() {
    let grandTotal = 0;
    let count = 0;

    const rows = workersBody.querySelectorAll("tr");

    rows.forEach((row, index) => {
        count++;

        row.querySelector(".serial-number").textContent = index + 1;

        grandTotal += calculateWorkerTotal(row);
    });

    grandTotalDisplay.textContent = formatMoney(grandTotal);
    summaryTotal.textContent = formatMoney(grandTotal);
    workerCount.textContent = count;

    saveData();
}

function collectData() {
    const rows = workersBody.querySelectorAll("tr");

    const workers = [];

    rows.forEach(row => {
        const worker = {
            name: row.querySelector(".worker-name").value.trim(),
            account: row.querySelector(".account-input").value.trim(),
            bank: row.querySelector(".bank-input").value.trim()
        };

        amountFields.forEach(field => {
            worker[field] = row.querySelector(
                `[data-field="${field}"]`
            ).value;
        });

        workers.push(worker);
    });

    return {
        weekEnding: document.getElementById("weekEnding").value,
        weekReference: document.getElementById("weekReference").value,
        workers: workers
    };
}

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(collectData())
        );

        saveStatus.textContent =
            "Saved automatically on this device.";
    } catch (error) {
        saveStatus.textContent =
            "Could not save. Please export a backup.";
        console.error("Saving failed:", error);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            addWorker();
            return;
        }

        const data = JSON.parse(saved);

        document.getElementById("weekEnding").value =
            data.weekEnding || "";

        document.getElementById("weekReference").value =
            data.weekReference || "";

        workersBody.innerHTML = "";

        if (Array.isArray(data.workers) && data.workers.length > 0) {
            data.workers.forEach(worker => addWorker(worker));
        } else {
            addWorker();
        }

        updateAll();

    } catch (error) {
        console.error("Loading failed:", error);
        workersBody.innerHTML = "";
        addWorker();
    }
}

function escapeCSV(value) {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
}

function exportCSV() {
    const data = collectData();

    const headers = [
        "S/N",
        "Worker's Name",
        ...fieldLabels,
        "Total (NGN)",
        "Account Number",
        "Bank Name"
    ];

    const rows = [headers];

    let grandTotal = 0;

    data.workers.forEach((worker, index) => {
        let total = 0;

        const dailyValues = amountFields.map(field => {
            const value = getNumber(worker[field]);
            total += value;
            return value.toFixed(2);
        });

        grandTotal += total;

        rows.push([
            index + 1,
            worker.name,
            ...dailyValues,
            total.toFixed(2),
            worker.account,
            worker.bank
        ]);
    });

    rows.push([
        "",
        "GRAND TOTAL",
        ...Array(12).fill(""),
        grandTotal.toFixed(2),
        "",
        ""
    ]);

    const csvContent = "\uFEFF" + rows
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = data.weekEnding || "week";

    link.href = url;
    link.download = `NCSL_Bund_Wall_Allowance_${date}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function clearWeek() {
    const confirmed = confirm(
        "Are you sure you want to clear this week's workers and allowance entries? Export a backup first if you need one."
    );

    if (!confirmed) return;

    workersBody.innerHTML = "";

    document.getElementById("weekEnding").value = "";
    document.getElementById("weekReference").value = "";

    addWorker();
    updateAll();
}

addWorkerBtn.addEventListener("click", () => addWorker());

exportBtn.addEventListener("click", exportCSV);

printBtn.addEventListener("click", () => window.print());

clearBtn.addEventListener("click", clearWeek);

document.getElementById("weekEnding").addEventListener(
    "change",
    saveData
);

document.getElementById("weekReference").addEventListener(
    "input",
    saveData
);

// Load saved entries when the application opens
loadData();

// Register offline support
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log("NCSL offline support is ready.");
            })
            .catch(error => {
                console.error("Offline setup failed:", error);
            });
    });
}