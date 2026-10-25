const tabBtns = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");
const builderActions = document.getElementById("builderActions");
const responsesActions = document.getElementById("responsesActions");

const formTitle = document.getElementById("formTitle");
const formDesc = document.getElementById("formDesc");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const exportFormBtn = document.getElementById("exportFormBtn");
const newFormBtn = document.getElementById("newFormBtn");
const questionsList = document.getElementById("questionsList");

const importDatBtn = document.getElementById("importDatBtn");
const datInput = document.getElementById("datInput");
const clearResponsesBtn = document.getElementById("clearResponsesBtn");
const responsesFormTitle = document.getElementById("responsesFormTitle");
const responseCount = document.getElementById("responseCount");
const responsesList = document.getElementById("responsesList");

const questionTemplate = document.getElementById("questionTemplate");
const optionTemplate = document.getElementById("optionTemplate");

const toast = document.getElementById("toast");

let questions = [];
let responses = [];
let formId = generateId();

function generateId() {
    return "f_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1500);
}

tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
        if (btn.dataset.tab === "builder") {
            builderActions.classList.remove("hidden");
            responsesActions.classList.add("hidden");
        } else {
            builderActions.classList.add("hidden");
            responsesActions.classList.remove("hidden");
        }
    });
});

addQuestionBtn.addEventListener("click", () => addQuestion());

function addQuestion(data = null) {
    const id = data && data.id ? data.id : "q_" + Math.random().toString(36).slice(2, 9);
    const q = {
        id,
        title: data ? data.title : "",
        type: data ? data.type : "short",
        options: data && data.options ? [...data.options] : ["Option 1"],
        scaleMin: data ? data.scaleMin : 1,
        scaleMax: data ? data.scaleMax : 5,
        scaleMinLabel: data ? data.scaleMinLabel : "",
        scaleMaxLabel: data ? data.scaleMaxLabel : ""
    };
    questions.push(q);
    renderQuestions();
}

function renderQuestions() {
    questionsList.innerHTML = "";
    questions.forEach((q, index) => {
        const node = questionTemplate.content.cloneNode(true);
        const card = node.querySelector(".question-card");
        card.dataset.id = q.id;

        const titleInput = node.querySelector(".question-title");
        titleInput.value = q.title;
        titleInput.addEventListener("input", () => {
            q.title = titleInput.value;
        });

        const typeSelect = node.querySelector(".question-type");
        typeSelect.value = q.type;
        typeSelect.addEventListener("change", () => {
            q.type = typeSelect.value;
            renderQuestions();
        });

        const optionsSection = node.querySelector(".options-section");
        const scaleSection = node.querySelector(".scale-section");
        if (q.type === "multiple" || q.type === "checkboxes" || q.type === "dropdown") {
            optionsSection.classList.remove("hidden");
            const optionsList = node.querySelector(".options-list");
            optionsList.innerHTML = "";
            q.options.forEach((opt, oi) => {
                const onode = optionTemplate.content.cloneNode(true);
                const oinput = onode.querySelector(".option-input");
                oinput.value = opt;
                oinput.addEventListener("input", () => {
                    q.options[oi] = oinput.value;
                });
                onode.querySelector(".remove-option").addEventListener("click", () => {
                    if (q.options.length <= 1) return;
                    q.options.splice(oi, 1);
                    renderQuestions();
                });
                optionsList.appendChild(onode);
            });
            node.querySelector(".add-option").addEventListener("click", () => {
                q.options.push("Option " + (q.options.length + 1));
                renderQuestions();
            });
        }
        if (q.type === "scale") {
            scaleSection.classList.remove("hidden");
            const smin = node.querySelector(".scale-min");
            const smax = node.querySelector(".scale-max");
            const sminl = node.querySelector(".scale-min-label");
            const smaxl = node.querySelector(".scale-max-label");
            smin.value = q.scaleMin;
            smax.value = q.scaleMax;
            sminl.value = q.scaleMinLabel;
            smaxl.value = q.scaleMaxLabel;
            smin.addEventListener("input", () => q.scaleMin = parseInt(smin.value) || 1);
            smax.addEventListener("input", () => q.scaleMax = parseInt(smax.value) || 5);
            sminl.addEventListener("input", () => q.scaleMinLabel = sminl.value);
            smaxl.addEventListener("input", () => q.scaleMaxLabel = smaxl.value);
        }

        node.querySelector(".move-up").addEventListener("click", () => {
            if (index === 0) return;
            const tmp = questions[index - 1];
            questions[index - 1] = questions[index];
            questions[index] = tmp;
            renderQuestions();
        });
        node.querySelector(".move-down").addEventListener("click", () => {
            if (index === questions.length - 1) return;
            const tmp = questions[index + 1];
            questions[index + 1] = questions[index];
            questions[index] = tmp;
            renderQuestions();
        });
        node.querySelector(".delete").addEventListener("click", () => {
            questions.splice(index, 1);
            renderQuestions();
        });

        questionsList.appendChild(node);
    });
}

newFormBtn.addEventListener("click", () => {
    if (questions.length && !confirm("Create a new form? Current form will be lost.")) return;
    questions = [];
    formTitle.value = "Untitled form";
    formDesc.value = "Add a description";
    formId = generateId();
    addQuestion();
    showToast("New form created");
});

if (questions.length === 0) {
    addQuestion();
}

exportFormBtn.addEventListener("click", () => {
    if (questions.length === 0) {
        showToast("Add at least one question");
        return;
    }
    const formData = {
        id: formId,
        title: formTitle.value || "Untitled form",
        description: formDesc.value || "",
        questions: questions
    };
    const html = buildExportHtml(formData);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (formData.title).replace(/[^a-z0-9\u00C0-\u017F]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "easypolls-form";
    a.href = url;
    a.download = "MarianSpaceEasyPolls_Form_" + safe + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Form HTML exported");
});

function buildExportHtml(form) {
    const qs = JSON.stringify(form.questions).replace(/</g, "\\u003c");
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(form.title)} - MarianSpace EasyPolls</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root { --bg:#f8fafc; --surface:#fff; --border:#cbd5e1; --text:#0f172a; --sub:#475569; --accent:#7c3aed; }
        *{margin:0;padding:0;box-sizing:border-box;font-family:Inter,sans-serif}
        body{background:var(--bg);color:var(--text);line-height:1.7}
        header{background:var(--surface);border-bottom:1px solid var(--border);padding:32px 16px;text-align:center}
        header h1{font-size:28px;margin-bottom:6px}
        header p{color:var(--sub)}
        main{max-width:720px;margin:32px auto;padding:0 16px;display:flex;flex-direction:column;gap:18px}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.06)}
        .card-header{padding:20px 28px}
        .card-header h2{font-size:18px}
        .card-body{border-top:1px solid var(--border);padding:18px 28px;display:flex;flex-direction:column;gap:12px}
        .option{display:flex;align-items:center;gap:12px}
        input[type=text], textarea{width:100%;border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:14px}
        textarea{min-height:120px;resize:vertical}
        .scale{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .scale-btn{border:1px solid var(--border);border-radius:999px;padding:6px 12px;background:transparent;cursor:pointer}
        .scale-btn.active{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.6);color:var(--accent)}
        .actions{max-width:720px;margin:0 auto 64px;padding:0 16px;display:flex;justify-content:flex-end}
        .submit{border:none;background:var(--accent);color:#fff;padding:10px 18px;border-radius:999px;cursor:pointer}
        footer{max-width:720px;margin:0 auto 48px;padding:0 16px;text-align:center;color:var(--sub);font-size:13px}
    </style>
</head>
<body>
    <header>
        <h1>${escapeHtml(form.title)}</h1>
        <p>${escapeHtml(form.description)}</p>
    </header>
    <main id="form"></main>
    <div class="actions">
        <button class="submit" id="submitBtn">Submit & Download .dat</button>
    </div>
    <footer>MarianSpace EasyPolls</footer>
    <script>
        const FORM = ${qs};
        const FORM_META = {id:"${form.id}", title:${JSON.stringify(form.title)}};
        const main = document.getElementById('form');
        const answers = {};
        FORM.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = 'card';
            const header = document.createElement('div');
            header.className = 'card-header';
            const h = document.createElement('h2');
            h.textContent = (idx+1) + '. ' + q.title;
            header.appendChild(h);
            card.appendChild(header);
            const body = document.createElement('div');
            body.className = 'card-body';
            if (q.type === 'short') {
                const input = document.createElement('input');
                input.type = 'text';
                input.addEventListener('input', () => answers[q.id] = input.value);
                body.appendChild(input);
            } else if (q.type === 'paragraph') {
                const ta = document.createElement('textarea');
                ta.addEventListener('input', () => answers[q.id] = ta.value);
                body.appendChild(ta);
            } else if (q.type === 'multiple') {
                (q.options||[]).forEach(opt => {
                    const row = document.createElement('label');
                    row.className = 'option';
                    const r = document.createElement('input');
                    r.type = 'radio';
                    r.name = q.id;
                    r.addEventListener('change', () => answers[q.id] = opt);
                    row.appendChild(r);
                    row.appendChild(document.createTextNode(opt));
                    body.appendChild(row);
                });
            } else if (q.type === 'checkboxes') {
                answers[q.id] = [];
                (q.options||[]).forEach(opt => {
                    const row = document.createElement('label');
                    row.className = 'option';
                    const c = document.createElement('input');
                    c.type = 'checkbox';
                    c.addEventListener('change', () => {
                        if (c.checked) answers[q.id].push(opt);
                        else answers[q.id] = answers[q.id].filter(x=>x!==opt);
                    });
                    row.appendChild(c);
                    row.appendChild(document.createTextNode(opt));
                    body.appendChild(row);
                });
            } else if (q.type === 'dropdown') {
                const sel = document.createElement('select');
                sel.innerHTML = '<option value="">Select...</option>' + (q.options||[]).map(o=>'<option value="'+o.replace(/"/g,'&quot;')+'">'+o+'</option>').join('');
                sel.addEventListener('change', () => answers[q.id] = sel.value);
                body.appendChild(sel);
            } else if (q.type === 'scale') {
                const wrap = document.createElement('div');
                wrap.className = 'scale';
                const min = q.scaleMin||1, max = q.scaleMax||5;
                for (let i=min; i<=max; i++) {
                    const b = document.createElement('button');
                    b.className = 'scale-btn';
                    b.type = 'button';
                    b.textContent = i;
                    b.addEventListener('click', () => {
                        Array.from(wrap.querySelectorAll('.scale-btn')).forEach(x=>x.classList.remove('active'));
                        b.classList.add('active');
                        answers[q.id] = i;
                    });
                    wrap.appendChild(b);
                }
                if (q.scaleMinLabel) {
                    const l = document.createElement('span');
                    l.textContent = q.scaleMinLabel;
                    wrap.prepend(l);
                }
                if (q.scaleMaxLabel) {
                    const l2 = document.createElement('span');
                    l2.textContent = q.scaleMaxLabel;
                    wrap.append(l2);
                }
                body.appendChild(wrap);
            }
            card.appendChild(body);
            main.appendChild(card);
        });
        document.getElementById('submitBtn').addEventListener('click', () => {
            const payload = {
                formId: FORM_META.id,
                formTitle: FORM_META.title,
                submittedAt: new Date().toISOString(),
                answers: answers
            };
            const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'MarianSpaceEasyPolls_Response_' + Date.now() + '.dat';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Response downloaded as .dat file');
        });
    </script>
</body>
</html>`;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

importDatBtn.addEventListener("click", () => {
    datInput.value = "";
    datInput.click();
});

datInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            responses.push({
                source: file.name,
                formId: data.formId,
                formTitle: data.formTitle,
                submittedAt: data.submittedAt,
                answers: data.answers || {}
            });
        } catch (err) {
            console.error(err);
            showToast("Invalid .dat file: " + file.name);
        }
    }
    renderResponses();
    showToast(files.length + " response(s) imported");
});

clearResponsesBtn.addEventListener("click", () => {
    if (responses.length && confirm("Clear all imported responses?")) {
        responses = [];
        renderResponses();
        showToast("Responses cleared");
    }
});

function renderResponses() {
    responsesList.innerHTML = "";
    responseCount.textContent = responses.length + (responses.length === 1 ? " response" : " responses");
    if (responses.length === 0) {
        responsesFormTitle.textContent = "No form loaded";
        return;
    }
    const title = responses[0].formTitle || "Form responses";
    responsesFormTitle.textContent = title;
    const grouped = {};
    responses.forEach((r) => {
        if (!grouped[r.formId]) grouped[r.formId] = [];
        grouped[r.formId].push(r);
    });
    Object.values(grouped).forEach((group) => {
        const card = document.createElement("div");
        card.className = "response-card";
        const header = document.createElement("div");
        header.className = "response-card-header";
        const h = document.createElement("h3");
        h.textContent = group[0].formTitle || "Form";
        const sub = document.createElement("p");
        sub.className = "muted";
        sub.textContent = group.length + " submission(s)";
        header.appendChild(h);
        header.appendChild(sub);
        card.appendChild(header);
        const body = document.createElement("div");
        body.className = "response-card-body";
        const qmap = {};
        questions.forEach((q) => (qmap[q.id] = q));
        const allQids = new Set();
        group.forEach((r) => Object.keys(r.answers || {}).forEach((k) => allQids.add(k)));
        Array.from(allQids).forEach((qid) => {
            const q = qmap[qid];
            const item = document.createElement("div");
            item.className = "response-item";
            const qlabel = document.createElement("div");
            qlabel.className = "response-question";
            qlabel.textContent = q ? q.title || qid : qid;
            item.appendChild(qlabel);

            if (q && (q.type === "multiple" || q.type === "checkboxes" || q.type === "dropdown")) {
                const counts = {};
                (q.options || []).forEach((opt) => (counts[opt] = 0));
                group.forEach((r) => {
                    const val = r.answers[qid];
                    if (val === undefined || val === null || val === "") return;
                    if (Array.isArray(val)) {
                        val.forEach((v) => {
                            if (counts.hasOwnProperty(v)) counts[v]++;
                            else counts[v] = (counts[v] || 0) + 1;
                        });
                    } else {
                        if (counts.hasOwnProperty(val)) counts[val]++;
                        else counts[val] = (counts[val] || 0) + 1;
                    }
                });
                const entries = Object.entries(counts).filter(([, c]) => c > 0);
                if (entries.length > 0) {
                    const values = document.createElement("div");
                    values.className = "response-values";
                    entries.forEach(([opt, c]) => {
                        const pill = document.createElement("span");
                        pill.className = "response-pill";
                        pill.textContent = opt + " • " + c;
                        values.appendChild(pill);
                    });
                    item.appendChild(values);
                    const wrap = document.createElement("div");
                    wrap.className = "chart-wrap";
                    const canvas = document.createElement("canvas");
                    wrap.appendChild(canvas);
                    item.appendChild(wrap);
                    setTimeout(() => {
                        if (typeof Chart === "undefined") return;
                        new Chart(canvas, {
                            type: "pie",
                            data: {
                                labels: entries.map(([opt]) => opt),
                                datasets: [{
                                    data: entries.map(([, c]) => c),
                                    backgroundColor: [
                                        "rgba(124, 58, 237, 0.8)",
                                        "rgba(59, 130, 246, 0.8)",
                                        "rgba(16, 185, 129, 0.8)",
                                        "rgba(245, 158, 11, 0.8)",
                                        "rgba(239, 68, 68, 0.8)",
                                        "rgba(168, 85, 247, 0.8)",
                                        "rgba(14, 165, 233, 0.8)",
                                        "rgba(34, 197, 94, 0.8)"
                                    ],
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                plugins: {
                                    legend: {
                                        position: "bottom"
                                    }
                                }
                            }
                        });
                    }, 0);
                } else {
                    const empty = document.createElement("span");
                    empty.className = "muted";
                    empty.textContent = "No answers";
                    item.appendChild(empty);
                }
                body.appendChild(item);
                return;
            }

            const values = document.createElement("div");
            values.className = "response-values";
            group.forEach((r) => {
                const val = r.answers[qid];
                if (val === undefined || val === null || val === "") return;
                if (Array.isArray(val)) {
                    val.forEach((v) => {
                        const pill = document.createElement("span");
                        pill.className = "response-pill";
                        pill.textContent = v;
                        values.appendChild(pill);
                    });
                } else if (typeof val === "string" && val.length > 80) {
                    const txt = document.createElement("div");
                    txt.className = "response-text";
                    txt.textContent = val;
                    values.appendChild(txt);
                } else {
                    const pill = document.createElement("span");
                    pill.className = "response-pill";
                    pill.textContent = val;
                    values.appendChild(pill);
                }
            });
            if (values.children.length === 0) {
                const empty = document.createElement("span");
                empty.className = "muted";
                empty.textContent = "No answers";
                values.appendChild(empty);
            }
            item.appendChild(values);
            body.appendChild(item);
        });
        card.appendChild(body);
        responsesList.appendChild(card);
    });
}
