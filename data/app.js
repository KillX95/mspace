const sheetEl = document.getElementById("sheet");
const workbookName = document.getElementById("workbookName");
const newBtn = document.getElementById("newBtn");
const saveMwbBtn = document.getElementById("saveMwbBtn");
const loadMwbBtn = document.getElementById("loadMwbBtn");
const mwbInput = document.getElementById("mwbInput");
const addRowBtn = document.getElementById("addRowBtn");
const addColBtn = document.getElementById("addColBtn");
const delRowBtn = document.getElementById("delRowBtn");
const delColBtn = document.getElementById("delColBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const printBtn = document.getElementById("printBtn");
const nameBox = document.getElementById("nameBox");
const formulaInput = document.getElementById("formulaInput");
const boldBtn = document.getElementById("boldBtn");
const italicBtn = document.getElementById("italicBtn");
const underlineBtn = document.getElementById("underlineBtn");
const sumBtn = document.getElementById("sumBtn");
const avgBtn = document.getElementById("avgBtn");
const clearFmtBtn = document.getElementById("clearFmtBtn");
const toast = document.getElementById("toast");
const selectionInfo = document.getElementById("selectionInfo");

let rows = 26;
let cols = 12;
let data = Array(rows).fill().map(() => Array(cols).fill({ value: "", formula: "", bold: false, italic: false, underline: false, align: "left" }));
let selected = { r: 0, c: 0 };
let selectionRange = null;

function colName(i) {
    let result = "";
    let n = i + 1;
    while (n > 0) {
        let rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1400);
}

function render() {
    sheetEl.innerHTML = "";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.className = "corner";
    headRow.appendChild(corner);
    for (let c = 0; c < cols; c++) {
        const th = document.createElement("th");
        th.textContent = colName(c);
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    sheetEl.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement("tr");
        const rh = document.createElement("th");
        rh.className = "row-header";
        rh.textContent = r + 1;
        tr.appendChild(rh);
        for (let c = 0; c < cols; c++) {
            const td = document.createElement("td");
            td.contentEditable = "true";
            td.dataset.r = r;
            td.dataset.c = c;
            td.className = cellClass(r, c);
            td.textContent = displayValue(r, c);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    sheetEl.appendChild(tbody);
    selectCell(selected.r, selected.c, false);
}

function cellClass(r, c) {
    const cell = data[r][c];
    let cls = [];
    if (cell.bold) cls.push("bold");
    if (cell.italic) cls.push("italic");
    if (cell.underline) cls.push("underline");
    if (cell.align && cell.align !== "left") cls.push("align-" + cell.align);
    return cls.join(" ");
}

function displayValue(r, c) {
    const cell = data[r][c];
    if (cell.formula && cell.formula.startsWith("=")) {
        const res = evalFormula(cell.formula, r, c);
        return res === undefined || res === null ? "" : res;
    }
    return cell.value || "";
}

function evalFormula(formula, sr, sc) {
    try {
        let expr = formula.slice(1);
        expr = expr.replace(/\bSUM\(([^()]+)\)/gi, (_, range) => sumRange(range, sr, sc));
        expr = expr.replace(/\bAVERAGE\(([^()]+)\)/gi, (_, range) => avgRange(range, sr, sc));
        expr = expr.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
            const c = colToIndex(col);
            const r = parseInt(row) - 1;
            if (r < 0 || r >= rows || c < 0 || c >= cols) return 0;
            const cell = data[r][c];
            if (cell.formula && cell.formula.startsWith("=")) {
                const v = evalFormula(cell.formula, r, c);
                return isNaN(v) ? 0 : v;
            }
            const num = parseFloat(cell.value);
            return isNaN(num) ? 0 : num;
        });
        const result = Function('"use strict"; return (' + expr + ')')();
        if (typeof result === "number" && isNaN(result)) return "#ERR";
        return result;
    } catch (e) {
        return "#ERR";
    }
}

function colToIndex(col) {
    let res = 0;
    for (let i = 0; i < col.length; i++) {
        res = res * 26 + (col.charCodeAt(i) - 65 + 1);
    }
    return res - 1;
}

function parseRange(range) {
    const parts = range.split(":");
    if (parts.length !== 2) return null;
    const m1 = parts[0].match(/([A-Z]+)(\d+)/i);
    const m2 = parts[1].match(/([A-Z]+)(\d+)/i);
    if (!m1 || !m2) return null;
    return { r1: parseInt(m1[2]) - 1, c1: colToIndex(m1[1].toUpperCase()), r2: parseInt(m2[2]) - 1, c2: colToIndex(m2[1].toUpperCase()) };
}

function sumRange(range) {
    const r = parseRange(range);
    if (!r) return 0;
    let s = 0;
    for (let i = Math.min(r.r1, r.r2); i <= Math.max(r.r1, r.r2); i++) {
        for (let j = Math.min(r.c1, r.c2); j <= Math.max(r.c1, r.c2); j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
            const cell = data[i][j];
            let val = 0;
            if (cell.formula && cell.formula.startsWith("=")) {
                val = parseFloat(evalFormula(cell.formula, i, j)) || 0;
            } else {
                val = parseFloat(cell.value) || 0;
            }
            s += val;
        }
    }
    return s;
}

function avgRange(range) {
    const r = parseRange(range);
    if (!r) return 0;
    let s = 0, count = 0;
    for (let i = Math.min(r.r1, r.r2); i <= Math.max(r.r1, r.r2); i++) {
        for (let j = Math.min(r.c1, r.c2); j <= Math.max(r.c1, r.c2); j++) {
            if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
            const cell = data[i][j];
            let val;
            if (cell.formula && cell.formula.startsWith("=")) {
                val = parseFloat(evalFormula(cell.formula, i, j));
            } else {
                val = parseFloat(cell.value);
            }
            if (!isNaN(val)) { s += val; count++; }
        }
    }
    return count ? s / count : 0;
}

function selectCell(r, c, updateInput = true) {
    document.querySelectorAll(".sheet td.selected").forEach(el => el.classList.remove("selected"));
    const td = document.querySelector(`.sheet td[data-r="${r}"][data-c="${c}"]`);
    if (td) td.classList.add("selected");
    selected = { r, c };
    nameBox.textContent = colName(c) + (r + 1);
    if (updateInput) {
        formulaInput.value = data[r][c].formula || data[r][c].value || "";
    }
    updateSelectionInfo();
}

sheetEl.addEventListener("click", (e) => {
    const td = e.target.closest("td[data-r]");
    if (!td) return;
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    selectCell(r, c);
});

sheetEl.addEventListener("input", (e) => {
    const td = e.target.closest("td[data-r]");
    if (!td) return;
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    const text = td.textContent;
    if (text.startsWith("=")) {
        data[r][c].formula = text;
        data[r][c].value = "";
    } else {
        data[r][c].formula = "";
        data[r][c].value = text;
    }
    formulaInput.value = data[r][c].formula || data[r][c].value || "";
    refreshAll();
});

function refreshAll() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const td = document.querySelector(`.sheet td[data-r="${r}"][data-c="${c}"]`);
            if (!td) continue;
            td.className = cellClass(r, c);
            td.textContent = displayValue(r, c);
        }
    }
    const td = document.querySelector(`.sheet td[data-r="${selected.r}"][data-c="${selected.c}"]`);
    if (td) td.classList.add("selected");
}

formulaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const text = formulaInput.value;
        if (text.startsWith("=")) {
            data[selected.r][selected.c].formula = text;
            data[selected.r][selected.c].value = "";
        } else {
            data[selected.r][selected.c].formula = "";
            data[selected.r][selected.c].value = text;
        }
        const td = document.querySelector(`.sheet td[data-r="${selected.r}"][data-c="${selected.c}"]`);
        if (td) {
            td.textContent = displayValue(selected.r, selected.c);
            td.className = cellClass(selected.r, selected.c);
            td.classList.add("selected");
        }
        refreshAll();
    }
});

boldBtn.addEventListener("click", () => { data[selected.r][selected.c].bold = !data[selected.r][selected.c].bold; refreshAll(); });
italicBtn.addEventListener("click", () => { data[selected.r][selected.c].italic = !data[selected.r][selected.c].italic; refreshAll(); });
underlineBtn.addEventListener("click", () => { data[selected.r][selected.c].underline = !data[selected.r][selected.c].underline; refreshAll(); });
document.querySelectorAll('.tool-btn[data-align]').forEach(btn => {
    btn.addEventListener("click", () => {
        data[selected.r][selected.c].align = btn.dataset.align;
        refreshAll();
    });
});

clearFmtBtn.addEventListener("click", () => {
    const c = data[selected.r][selected.c];
    c.bold = false; c.italic = false; c.underline = false; c.align = "left";
    refreshAll();
});

sumBtn.addEventListener("click", () => {
    formulaInput.value = "=SUM(" + colName(selected.c) + (selected.r + 1) + ":" + colName(selected.c) + (selected.r + 1) + ")";
    formulaInput.focus();
    formulaInput.select();
});

avgBtn.addEventListener("click", () => {
    formulaInput.value = "=AVERAGE(" + colName(selected.c) + (selected.r + 1) + ":" + colName(selected.c) + (selected.r + 1) + ")";
    formulaInput.focus();
    formulaInput.select();
});

addRowBtn.addEventListener("click", () => {
    rows++;
    data.push(Array(cols).fill().map(() => ({ value: "", formula: "", bold: false, italic: false, underline: false, align: "left" })));
    render();
    showToast("Row added");
});

addColBtn.addEventListener("click", () => {
    cols++;
    for (let r = 0; r < rows; r++) {
        data[r].push({ value: "", formula: "", bold: false, italic: false, underline: false, align: "left" });
    }
    render();
    showToast("Column added");
});

delRowBtn.addEventListener("click", () => {
    if (rows <= 1) return showToast("Cannot remove");
    rows--;
    data.pop();
    if (selected.r >= rows) selected.r = rows - 1;
    render();
    showToast("Last row removed");
});

delColBtn.addEventListener("click", () => {
    if (cols <= 1) return showToast("Cannot remove");
    cols--;
    for (let r = 0; r < rows; r++) data[r].pop();
    if (selected.c >= cols) selected.c = cols - 1;
    render();
    showToast("Last column removed");
});

newBtn.addEventListener("click", () => {
    if (confirm("New workbook? Unsaved content will be lost.")) {
        rows = 26; cols = 12;
        data = Array(rows).fill().map(() => Array(cols).fill({ value: "", formula: "", bold: false, italic: false, underline: false, align: "left" }));
        workbookName.value = "Untitled workbook";
        selected = { r: 0, c: 0 };
        render();
        showToast("New workbook created");
    }
});

saveMwbBtn.addEventListener("click", () => {
    const payload = {
        version: 1,
        name: workbookName.value || "Untitled workbook",
        rows,
        cols,
        data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (payload.name).replace(/[^a-z0-9\u00C0-\u017F]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "marian-space-data";
    a.href = url;
    a.download = safe + ".mwb";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(".mwb file downloaded");
});

loadMwbBtn.addEventListener("click", () => {
    mwbInput.value = "";
    mwbInput.click();
});

mwbInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const payload = JSON.parse(ev.target.result);
            rows = payload.rows || 26;
            cols = payload.cols || 12;
            data = Array(rows).fill().map((_, r) => Array(cols).fill().map((__, c) => {
                const src = payload.data && payload.data[r] && payload.data[r][c] ? payload.data[r][c] : {};
                return { value: src.value || "", formula: src.formula || "", bold: !!src.bold, italic: !!src.italic, underline: !!src.underline, align: src.align || "left" };
            }));
            workbookName.value = payload.name || file.name.replace(/\.mwb$/i, "");
            selected = { r: 0, c: 0 };
            render();
            showToast(".mwb file loaded");
        } catch (err) {
            console.error(err);
            showToast("Invalid .mwb file");
        }
    };
    reader.readAsText(file);
});

exportCsvBtn.addEventListener("click", () => {
    let csv = [];
    for (let r = 0; r < rows; r++) {
        let line = [];
        for (let c = 0; c < cols; c++) {
            let val = displayValue(r, c);
            if (typeof val === "number") val = val.toString();
            val = (val + "").replace(/"/g, '""');
            if (val.includes(",") || val.includes("\n") || val.includes('"')) val = '"' + val + '"';
            line.push(val);
        }
        csv.push(line.join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (workbookName.value || "workbook").replace(/[^a-z0-9\u00C0-\u017F]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "marian-space-data";
    a.href = url;
    a.download = safe + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("CSV exported");
});

printBtn.addEventListener("click", () => window.print());

function updateSelectionInfo() {
    selectionInfo.textContent = colName(selected.c) + (selected.r + 1) + " selected";
}

render();
selectCell(0, 0);
