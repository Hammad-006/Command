/* ^^^^^^^^^^^^^^^^^^^^^^^
           GLOBAL VALUES
        ^^^^^^^^^^^^^^^^^^^^^^^ */
const input = document.getElementById("tableInput");
const genBtn = document.getElementById("tableGenBtn");
const clrbtn = document.querySelector(".clearBtn");
const tableDetails = document.getElementById("tableDetails");
const errorMsgBox = document.getElementById("truthTableError");
const errorMsg = document.getElementById("errorMsg");
const tableStage = document.getElementById("tableStage");
const renderTableDom = document.getElementById("renderTable");
const verdictBadge = document.getElementById("verdictBadge");

const TT = {
  VAR: "VAR",
  AND: "AND",
  OR: "OR",
  IF: "IF",
  IFF: "IFF",
  NOT: "NOT",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
};

/* ^^^^^^^^^^^^^^^^^^^^^^^
           CLEAR BUTTON
        ^^^^^^^^^^^^^^^^^^^^^^^ */
input.addEventListener("input", () => {
  clrbtn.style.display = input.value.trim ? "flex" : "none";
});

clrbtn.addEventListener("click", () => {
  input.value = ``;
  clrbtn.style.display = "none";
  hideError();
  clearTable();
  input.focus();
});

/* ^^^^^^^^^^^^^^^^^^^^^^^
           INSERT & CURSOR REPOSITION
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function insertSym(sym) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const currentText = input.value;
  input.value = currentText.slice(0, start) + sym + currentText.slice(end);
  let offset = sym.length;
  repositionCursor(start, offset);
  input.focus();
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function repositionCursor(currentPos, offset) {
  input.selectionStart = input.selectionEnd = currentPos + offset;
}

function loadSuggestion(formula) {
  input.value = formula;
  input.focus();
  input.dispatchEvent(new Event("input", { bubbles: true }));
  generateTruthTable();
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           EVENT LISTENERS
        ^^^^^^^^^^^^^^^^^^^^^^^ */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    generateTruthTable();
    return;
  }
  if (e.key === "(") {
    e.preventDefault();
    let start = input.selectionStart;
    insertSym("()");
    repositionCursor(start, 1);
  }
  if (e.key === "[") {
    e.preventDefault();
    let start = input.selectionStart;
    insertSym("[]");
    repositionCursor(start, 1);
  }
  if (e.key === "{") {
    e.preventDefault();
    let start = input.selectionStart;
    insertSym("{}");
    repositionCursor(start, 1);
  }
});

genBtn.addEventListener("click", () => {
  generateTruthTable();
});

/* Keyboard shortcuts for symbols */
input.addEventListener("input", (e) => {
  const start = input.selectionStart;
  let v = input.value.toUpperCase();
  const oldLen = v.length;

  v = v.replaceAll("&", "∧");
  v = v.replaceAll("^", "∧");
  v = v.replaceAll("AND", "∧");
  v = v.replaceAll("|", "∨");
  v = v.replaceAll("OR", "∨");

  v = v.replaceAll("!", "¬");
  v = v.replaceAll("NOT", "¬");
  v = v.replaceAll("~", "¬");

  v = v.replaceAll("->", "→");
  v = v.replaceAll("IF", "→");

  v = v.replaceAll("<>", "↔");
  v = v.replaceAll("IOI", "↔");

  if (v !== input.value) {
    input.value = v;
    let diff = v.length - oldLen;
    repositionCursor(start, diff);
  }
});

/* ^^^^^^^^^^^^^^^^^^^^^^^
           ERROR HANDLING
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function showError(message) {
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsgBox.classList.add("showError");
  }
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function hideError() {
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsgBox.classList.remove("showError");
  }
  input.setAttribute("aria-invalid", "false");
}

function clearTable() {
  tableStage.classList.remove("visible");
  if (renderTableDom) renderTableDom.replaceChildren();
}

function tokenLabel(token) {
  if (!token) return "the end of the expression";
  if (token.type === TT.VAR) return `variable "${token.val}"`;
  const labels = {
    [TT.AND]: "∧",
    [TT.OR]: "∨",
    [TT.IF]: "→",
    [TT.IFF]: "↔",
    [TT.NOT]: "¬",
    [TT.LPAREN]: "(",
    [TT.RPAREN]: ")",
  };
  return `"${labels[token.type] ?? token.type}"`;
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           TOKENIZER
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function tokenizer(formula) {
  let tokens = [];
  for (const ch of formula) {
    if (/\s/.test(ch)) continue;
    if (/[A-Za-z]/.test(ch)) tokens.push({ type: TT.VAR, val: ch });
    else if (ch === "¬") tokens.push({ type: TT.NOT });
    else if (ch === "∧") tokens.push({ type: TT.AND });
    else if (ch === "∨") tokens.push({ type: TT.OR });
    else if (ch === "→") tokens.push({ type: TT.IF });
    else if (ch === "↔") tokens.push({ type: TT.IFF });
    else if (ch === "(" || ch === "[" || ch === "{")
      tokens.push({ type: TT.LPAREN });
    else if (ch === ")" || ch === "]" || ch === "}")
      tokens.push({ type: TT.RPAREN });
    else
      throw new Error(
        `Invalid character "${ch}". Use variables A-Z and the operators ¬, ∧, ∨, →, ↔.`,
      );
  }
  return tokens;
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           PARSER
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function parse(tokens) {
  let i = 0;
  const peek = () => tokens[i];

  const eat = (type) => {
    const t = peek();
    if (type && t?.type !== type) {
      if (type === TT.RPAREN) throw new Error("Missing closing parenthesis.");
      throw new Error(`Expected ${type}, but found ${tokenLabel(t)}.`);
    }
    i++;
  };

  function parseIFF() {
    let left = parseIF();
    while (peek()?.type === TT.IFF) {
      eat(TT.IFF);
      let right = parseIF();
      left = { type: TT.IFF, left, right };
    }
    return left;
  }

  function parseIF() {
    let left = parseOR();
    if (peek()?.type === TT.IF) {
      eat(TT.IF);
      let right = parseIF();
      left = { type: TT.IF, left, right };
    }
    return left;
  }

  function parseOR() {
    let left = parseAND();
    while (peek()?.type === TT.OR) {
      eat(TT.OR);
      let right = parseAND();
      left = { type: TT.OR, left, right };
    }
    return left;
  }

  function parseAND() {
    let left = parseNOT();
    while (peek()?.type === TT.AND) {
      eat(TT.AND);
      let right = parseNOT();
      left = { type: TT.AND, left, right };
    }
    return left;
  }

  function parseNOT() {
    if (peek()?.type === TT.NOT) {
      eat(TT.NOT);
      let operand = parseNOT();
      return { type: TT.NOT, operand };
    }
    return parseATOM();
  }

  function parseATOM() {
    const t = peek();
    if (!t)
      throw new Error("Incomplete expression. Check the end of the formula.");
    if (t.type === TT.VAR) {
      eat(TT.VAR);
      return { type: TT.VAR, val: t.val };
    }
    if (t.type === TT.LPAREN) {
      eat(TT.LPAREN);
      const subExpression = parseIFF();
      eat(TT.RPAREN);
      return subExpression;
    }
    if (t.type === TT.RPAREN)
      throw new Error("Unexpected closing parenthesis.");
    throw new Error(`Expected a variable or "(", but found ${tokenLabel(t)}.`);
  }

  const tree = parseIFF();

  if (i < tokens.length)
    throw new Error(
      `Unexpected ${tokenLabel(tokens[i])}. Add an operator between expressions.`,
    );

  return tree;
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
   EXTRACT SUB-EXPRESSIONS FOR COLUMNS
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */
function extractSubExpressions(node) {
  const subs = [];
  const seen = new Set();

  function walk(n) {
    if (!n) return;
    const key = JSON.stringify(n);
    if (seen.has(key)) return;
    seen.add(key);

    if (n.type === TT.VAR) {
      subs.push({ type: TT.VAR, val: n.val, node: n });
    } else if (n.type === TT.NOT) {
      walk(n.operand);
      subs.push({ type: TT.NOT, node: n });
    } else {
      walk(n.left);
      walk(n.right);
      subs.push({ type: n.type, node: n });
    }
  }
  walk(node);
  return subs;
}

function formatSubExpr(node) {
  if (node.type === TT.VAR) return node.val;
  if (node.type === TT.NOT) return `¬${formatSubExpr(node.operand)}`;
  const op = { [TT.AND]: "∧", [TT.OR]: "∨", [TT.IF]: "→", [TT.IFF]: "↔" }[
    node.type
  ];
  return `(${formatSubExpr(node.left)} ${op} ${formatSubExpr(node.right)})`;
}

function formatSubExprShort(node) {
  if (node.type === TT.VAR) return node.val;
  if (node.type === TT.NOT) return `¬${formatSubExprShort(node.operand)}`;
  const op = { [TT.AND]: "∧", [TT.OR]: "∨", [TT.IF]: "→", [TT.IFF]: "↔" }[
    node.type
  ];
  const left =
    node.left.type === TT.VAR
      ? node.left.val
      : `(${formatSubExprShort(node.left)})`;
  const right =
    node.right.type === TT.VAR
      ? node.right.val
      : `(${formatSubExprShort(node.right)})`;
  return `${left} ${op} ${right}`;
}
/* ^^^^^^^^^^^^^^^^^^^^^^^
           EXTRACT VARIABLES
  ^^^^^^^^^^^^^^^^^^^^^^^ */
function getVars(formula) {
  const vars = new Set();
  for (const char of formula) {
    if (/[A-Za-z]/.test(char)) vars.add(char);
  }
  return [...vars].sort();
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           GET ROWS
    ^^^^^^^^^^^^^^^^^^^^^^^ */
function getRows(vars) {
  let allAssignments = [];
  const n = vars.length;
  const rows = Math.pow(2, n);

  for (let row = 0; row < rows; row++) {
    let assignment = {};
    vars.forEach((eachVar, bitPos) => {
      assignment[eachVar] = !!((row >> (n - 1 - bitPos)) & 1);
    });
    allAssignments.push(assignment);
  }
  return [...allAssignments];
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           EVALUVATE
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function evaluate(node, assignment) {
  if (!node || !assignment)
    throw new Error("Error while evaluating, check tree or assignments");
  if (node.type === TT.VAR) return assignment[node.val];
  if (node.type === TT.NOT) return !evaluate(node.operand, assignment);
  if (node.type === TT.AND)
    return evaluate(node.left, assignment) && evaluate(node.right, assignment);
  if (node.type === TT.OR)
    return evaluate(node.left, assignment) || evaluate(node.right, assignment);
  if (node.type === TT.IF)
    return !evaluate(node.left, assignment) || evaluate(node.right, assignment);
  if (node.type === TT.IFF)
    return evaluate(node.left, assignment) === evaluate(node.right, assignment);
  throw new Error(`Unknown expression node: ${node.type}`);
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           GENERATE
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function generateTruthTable() {
  hideError();
  clearTable();

  const rawVal = input.value.trim();
  if (!rawVal) {
    showError("Please enter a logical expression before generating the table.");
    return;
  }

  const vars = getVars(rawVal);
  const n = vars.length;

  if (n === 0) {
    showError("Formula must contain at least one variable (A-Z).");
    return;
  }
  if (n > 6) {
    showError(
      `Your formula has ${n} variables, that's ${Math.pow(2, vars.length)} rows (⊙ｏ⊙). Keep it readable plz `,
    );
    return;
  }

  let tokens, tree;
  try {
    tokens = tokenizer(rawVal);
    tree = parse(tokens);
  } catch (err) {
    showError(err.message);
    return;
  }

  try {
    if (!renderTableDom) {
      throw new Error("Table container was not found on the page.");
    }
    const allRowAssignments = getRows(vars);
    const results = allRowAssignments.map((eachRowAssignment) =>
      evaluate(tree, eachRowAssignment),
    );

    renderStats(results);
    const table = renderTable(vars, allRowAssignments, results, tree);
    renderTableDom.replaceChildren(table);

    if (tableDetails) {
      tableDetails.textContent = `${vars.length} variables / ${allRowAssignments.length} rows`;
    }

    tableStage.classList.add("visible");

    // Smooth scroll to table
    setTimeout(() => {
      tableStage.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } catch (err) {
    showError(`Could not build the truth table. ${err.message}`);
    clearTable();
  }
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
           RENDER TABLE
        ^^^^^^^^^^^^^^^^^^^^^^^ */

function renderTable(vars, allRowAssignments, results, tree) {
  const rows = allRowAssignments.length;
  const fragTable = document.createDocumentFragment();
  const head = document.createElement("thead");
  const body = document.createElement("tbody");

  // Get sub-expressions in evaluation order
  const subExprs = extractSubExpressions(tree);
  // Filter: vars first (already in vars array), then intermediates
  const varNodes = subExprs.filter((s) => s.type === TT.VAR);
  const opNodes = subExprs.filter((s) => s.type !== TT.VAR);

  const headRow = document.createElement("tr");
  // Variable headers
  vars.forEach((v) => {
    const th = document.createElement("th");
    th.textContent = v;
    headRow.appendChild(th);
  });
  // Sub-expression headers
  opNodes.forEach((sub) => {
    const th = document.createElement("th");
    th.className = "subexpr-head";
    th.textContent = formatSubExprShort(sub.node);
    th.title = formatSubExpr(sub.node);
    headRow.appendChild(th);
  });
  // Final result header
  const thResult = document.createElement("th");
  thResult.className = "result-head";
  thResult.textContent = `Resulting Truth Status`;
  headRow.appendChild(thResult);

  for (let row = 0; row < rows; row++) {
    const tr = document.createElement("tr");
    tr.style.setProperty("--row-index", row);

    // Variable values
    vars.forEach((eachVar) => {
      const td = document.createElement("td");
      const value = allRowAssignments[row][eachVar];
      td.className = `truth-cell ${value ? "is-true" : "is-false"}`;
      td.innerHTML = `<span class="truth-mark">${value ? "T" : "F"}</span>`;
      tr.appendChild(td);
    });
    // Sub-expression values
    opNodes.forEach((sub) => {
      const td = document.createElement("td");
      const val = evaluate(sub.node, allRowAssignments[row]);
      td.className = `truth-cell ${val ? "is-true" : "is-false"}`;
      td.innerHTML = `<span class="truth-mark">${val ? "T" : "F"}</span>`;
      tr.appendChild(td);
    });
    // Final result
    const td = document.createElement("td");
    td.className = `resultCell ${results[row] ? "is-true" : "is-false"}`;
    td.innerHTML = `<span class="verdict">${results[row] ? "True" : "False"}</span>`;
    tr.appendChild(td);

    body.appendChild(tr);
  }

  head.appendChild(headRow);
  fragTable.appendChild(head);
  fragTable.appendChild(body);
  return fragTable;
}
/* ^^^^^^^^^^^^^^^^^^^^^^^
           RENDER STATS
        ^^^^^^^^^^^^^^^^^^^^^^^ */
function renderStats(results) {
  const satisfiable = document.getElementById("satisfiable");
  const trueRows = document.getElementById("nTrue");
  const falseRows = document.getElementById("nFalse");

  const n = results.length;
  const trueCount = results.filter((r) => r).length;
  const falseCount = n - trueCount;
  const isTautology = trueCount === n;
  const isContradiction = falseCount === n;
  const isContingency = !isTautology && !isContradiction;

  verdictBadge.textContent = isTautology
    ? "• Tautology"
    : isContingency
      ? "• Contingency"
      : "• Contradiction";

  verdictBadge.className =
    "verdict-badge " +
    (isTautology
      ? "verdict-tautology"
      : isContradiction
        ? "verdict-contradiction"
        : "verdict-contingency");

  satisfiable.textContent = trueCount > 0 ? "Yes" : "No";
  satisfiable.className = "stat-value " + (trueCount > 0 ? "yes" : "no");
  trueRows.textContent = trueCount;
  falseRows.textContent = falseCount;
}

/* ^^^^^^^^^^^^^^^^^^^^^^^
   URL STATE SHARING
^^^^^^^^^^^^^^^^^^^^^^^^^^^ */
(function () {
  // Load from URL on page load
  const hash = window.location.hash.slice(1);
  if (hash) {
    const params = new URLSearchParams(hash);
    const formula = params.get("formula");
    if (formula) {
      input.value = decodeURIComponent(formula);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      clrbtn.style.display = "flex";
      setTimeout(generateTruthTable, 100);
    }
  }

  // Update URL when generating
  const originalGenerate = generateTruthTable;
  generateTruthTable = function () {
    const result = originalGenerate.apply(this, arguments);
    const rawVal = input.value.trim();
    if (rawVal) {
      const params = new URLSearchParams();
      params.set("formula", encodeURIComponent(rawVal));
      window.history.replaceState(null, "", "#" + params.toString());
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
    return result;
  };
})();
