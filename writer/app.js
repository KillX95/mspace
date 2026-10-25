const editor = document.getElementById("editor");
const docTitle = document.getElementById("docTitle");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const openFileBtn = document.getElementById("openFileBtn");
const fileInput = document.getElementById("fileInput");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const downloadBtn = document.getElementById("downloadBtn");
const formatBlock = document.getElementById("formatBlock");
const fontName = document.getElementById("fontName");
const fontSize = document.getElementById("fontSize");
const wordCountEl = document.getElementById("wordCount");
const charCountEl = document.getElementById("charCount");
const toast = document.getElementById("toast");

const STORAGE_KEY = "marianSpaceWriter_doc";

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
}

function exec(cmd, value = null) {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(cmd, false, value);
    editor.focus();
    updateCounts();
    updateActiveStates();
}

document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const cmd = btn.dataset.cmd;
        if (cmd === "createLink") {
            const url = prompt("Enter link URL:", "https://");
            if (url) exec("createLink", url);
            return;
        }
        exec(cmd);
    });
});

formatBlock.addEventListener("change", () => {
    exec("formatBlock", formatBlock.value);
});

fontName.addEventListener("change", () => {
    exec("fontName", fontName.value);
});

fontSize.addEventListener("change", () => {
    exec("fontSize", fontSize.value);
});

saveBtn.addEventListener("click", () => {
    const data = {
        title: docTitle.value || "Untitled document",
        content: editor.innerHTML,
        updatedAt: new Date().toISOString(),
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        showToast("Document saved in browser");
    } catch (error) {
        console.error(error);
        showToast("Failed to save");
    }
});

loadBtn.addEventListener("click", () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            showToast("No saved document found");
            return;
        }
        const data = JSON.parse(raw);
        docTitle.value = data.title || "Untitled document";
        editor.innerHTML = data.content || "";
        updateCounts();
        showToast("Document loaded from browser");
    } catch (error) {
        console.error(error);
        showToast("Failed to load");
    }
});

openFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target.result;
        if (typeof result !== "string") {
            showToast("Cannot read this file");
            return;
        }

        const name = file.name.replace(/\.[^/.]+$/, "");
        docTitle.value = name || "Untitled document";

        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(result, "text/html");
                const body = doc.body;
                if (body && body.innerHTML.trim()) {
                    editor.innerHTML = body.innerHTML;
                } else {
                    editor.innerHTML = result;
                }
            } catch (error) {
                console.error(error);
                editor.innerHTML = result;
            }
        } else if (lowerName.endsWith(".md")) {
            const escaped = result
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>");
            editor.innerHTML = `<pre>${escaped}</pre>`;
        } else {
            const escaped = result
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>");
            editor.innerHTML = `<p>${escaped.replace(/<br><br>/g, "</p><p>")}</p>`;
        }

        updateCounts();
        editor.focus();
        showToast(`Opened "${file.name}"`);
    };

    reader.onerror = () => {
        showToast("Error reading file");
    };

    reader.readAsText(file);
});

clearBtn.addEventListener("click", () => {
    if (confirm("Create a new document? Current content will be lost if not saved.")) {
        docTitle.value = "Untitled document";
        editor.innerHTML = "";
        updateCounts();
        editor.focus();
        showToast("New document created");
    }
});

printBtn.addEventListener("click", () => {
    window.print();
});

downloadBtn.addEventListener("click", () => {
    const title = (docTitle.value || "untitled-document")
        .replace(/[^a-z0-9\u00C0-\u017F]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(docTitle.value || "Untitled document")}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Roboto:wght@400;500;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: "Inter", sans-serif; line-height: 1.7; max-width: 816px; margin: 96px auto; padding: 0 40px; color: #1f2328; }
        h1, h2, h3, h4 { font-weight: 600; line-height: 1.3; }
        blockquote { border-left: 3px solid #2563eb; padding-left: 1.6em; color: #656d76; font-style: italic; }
        pre { background: #f6f8fa; border: 1px solid #d0d7de; padding: 16px; overflow-x: auto; font-family: "Source Code Pro", monospace; }
        ul, ol { padding-left: 2.4em; }
        a { color: #2563eb; }
    </style>
</head>
<body>
${editor.innerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "marian-space-writer"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("HTML file downloaded");
});

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function updateCounts() {
    const text = editor.innerText || "";
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    wordCountEl.textContent = `${words} word${words === 1 ? "" : "s"}`;
    charCountEl.textContent = `${chars} character${chars === 1 ? "" : "s"}`;
}

function updateActiveStates() {
    document.querySelectorAll(".tool-btn").forEach((btn) => {
        const cmd = btn.dataset.cmd;
        if (!cmd || cmd === "createLink" || cmd === "unlink" || cmd === "removeFormat") {
            btn.classList.remove("active");
            return;
        }
        try {
            if (document.queryCommandState(cmd)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        } catch (error) {
            btn.classList.remove("active");
        }
    });
}

editor.addEventListener("input", updateCounts);
editor.addEventListener("keyup", updateActiveStates);
editor.addEventListener("mouseup", updateActiveStates);
editor.addEventListener("focus", updateActiveStates);

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveBtn.click();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        exec("bold");
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        exec("italic");
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
        event.preventDefault();
        exec("underline");
    }
});

updateCounts();
editor.focus();
