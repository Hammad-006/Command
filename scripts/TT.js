/* ^^^^Testing/ Debugging 

alert("igiuyi");

 input.addEventListener("input", (e) => {
  console.log(` Start: ${input.selectionStart} ||| End: ${input.selectionEnd}`);
}); 

const d2b = (n) => {
  let res = "";
  while (n > 0) {
    let binaryDigit = n % 2;
    n = Math.floor(n / 2);
    res = binaryDigit + res;
  }
  return res;
};
console.log(d2b(7777));
*/

/* ^^^^^^^^^^ Global Values^^^^^^^ */

const input = document.querySelector(".input");
const genBtn = document.querySelector(".genBtn");
const opt = document.querySelector(".opt");
const clrbtn = document.querySelector(".clearBtn");
const tableDetails = document.querySelector(".tableDetials");
const errorMsgBox = document.querySelector(".errorMsgBox");
const errorMsg = document.querySelector(".errorMsg");

const renderTableDom = document.querySelector(".renderTable");
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

/* ^^^ clear button hide and show^^^ */
input.addEventListener("input", () => {
  clrbtn.style.display = input.value.trim() ? "block" : "none";
});

clrbtn.addEventListener("click", () => {
  input.value = ``;
  clrbtn.style.display = "none";
  hideError();
  clearTable();
  input.focus();
});

/* ^^^^^^^Inser and Cursor reposition^^^^^^^^^^^^ */

insertSym = (sym) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const currentText = input.value;
  input.value = currentText.slice(0, start) + sym + currentText.slice(end);
  let offset = sym.length;
  repositionCursor(start, offset);
  input.focus();
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

repositionCursor = (currentPos, offset) => {
  input.selectionStart = input.selectionEnd = currentPos + offset;
};

/* ^^^^^^^ */

const loadSuggetions = (formula) => {
  insertSym(formula);
};

/* ^^^^^ EventListner^^^^^^ */
//Events for Input fild...
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
});

/* ^^^^^^^^^ */

genBtn.addEventListener("click", (e) => {
  generateTruthTable();
});

/* Key Board ShortCut for symbols */

input.addEventListener("input", (e) => {
  const start = input.selectionStart;
  let v = input.value;
  const oldLen = v.length;
  v = v.replaceAll("&", "∧");
  v = v.replaceAll("|", "∨");
  v = v.replaceAll("!", "¬");
  v = v.replaceAll("->", "→");
  v = v.replaceAll("<>", "↔");
  if (v !== input.value) {
    input.value = v;
    let diff = v.length - oldLen;
    repositionCursor(start, diff);
  }
});

/* ^^^^^^^Error Handling Logic^^^^^^^^ */
const showError = (message) => {
  if (errorMsg) {
    errorMsg.textContent = message; // html ref: <div class="errorMsgBox"> <p class="errorMsg"></p> </div>
    errorMsgBox.classList.add("showError");
  }
  input.setAttribute("aria-invalid", "true");
  input.focus();
};

const hideError = () => {
  if (errorMsg) {
    errorMsg.textContent = "";
    errorMsgBox.classList.remove("showError");
  }
  input.setAttribute("aria-invalid", "false");
};

const clearTable = () => {
  renderTableDom?.replaceChildren();
};

const tokenLabel = (token) => {
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
};

/* ^^^Generating Tokens for the formula^^ */
// Note: here we have used for-of loop and it works fine for now. But if i need to access index to check the next chars then we need a while loop with manual updating of i.
const tokenizer = (formula) => {
  let tokens = [];
  for (const ch of formula) {
    if (/\s/.test(ch)) continue;
    if (/[A-Za-z]/.test(ch))
      tokens.push({ type: TT.VAR, val: ch }); // VAR not var
    else if (ch === "¬") tokens.push({ type: TT.NOT });
    else if (ch === "∧") tokens.push({ type: TT.AND });
    else if (ch === "∨") tokens.push({ type: TT.OR });
    else if (ch === "→") tokens.push({ type: TT.IF });
    else if (ch === "↔") tokens.push({ type: TT.IFF });
    else if (ch === "(") tokens.push({ type: TT.LPAREN });
    else if (ch === ")") tokens.push({ type: TT.RPAREN });
    else
      throw new Error(
        `Invalid character "${ch}". Use variables A-Z and the operators ¬, ∧, ∨, →, ↔.`,
      );
  }
  return tokens;
};

/* ^^^^^ Parseing adn tree building Logic ^^^^^ */

const parse = (tokens) => {
  let i = 0;
  const peek = () => tokens[i];

  const eat = (type) => {
    /*  genral form:
    function consume(expectedType) {
        const token = peek();
        if (token.type !== expectedType)
            throw Error("Wrong token");
        pos++;
        return token; 
    } */
    const t = peek();
    if (type && t?.type !== type) {
      if (type === TT.RPAREN) throw new Error("Missing closing parenthesis.");
      throw new Error(`Expected ${type}, but found ${tokenLabel(t)}.`);
    }
    i++;
    //here we are not returning anything, cuz we dont need to.
  };

  //Ordered from loosest to tightest puh: IFF → IF → OR → AND → NOT → ATOM

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
      // no while loop cuz {see below}
      eat(TT.IF);
      let right = parseIF(); // parseIF() cuz  of the right assoiativity rule for implications. Ex: P → (Q → R) not (P → Q) → R
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
};

/* ^^^^^^Extracting the Variables form the input^^^^^^^^ */

const getVars = (formula) => {
  const vars = new Set();
  for (const char of formula) {
    if (/[A-Za-z]/.test(char)) vars.add(char);
  }
  return [...vars].sort();
};

/* ^^^^ Get the assigned vlaues for each variable in all the rows  */

const getRows = (vars) => {
  let allAssignments = [];
  const n = vars.length;
  const rows = Math.pow(2, n);

  for (let row = 0; row < rows; row++) {
    let assignment = {};
    vars.forEach((eachVar, bitPos) => {
      assignment[eachVar] = !!((row >> (n - 1 - bitPos)) & 1); //ts is for MSB order. For LSB: row>>bitPos.
    });
    allAssignments.push(assignment); //pushing the entire assignment for a row at a time into the array

    /* ts gotta be outside the forEach loop cuz we aint tryna push each value per variable per row, 
    but rather the whole assignment of a row togwther. 
    Hint: look at where the assignment is declared.
      We need this :- [{ P: false, Q: false },...] not this:
                      [{P:false}, {Q:false},...] */
  }
  return [...allAssignments];
};

/* ^^^^^^^^^ Evaluvate ^^^^^^^^^  */

const evaluate = (node, assignment) => {
  if (!node || !assignment)
    throw new Error("Error while evaluate, check tree or assignments");
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
};

/* ^^^^^^^^Generate^^^^^^^^^ */

const generateTruthTable = () => {
  hideError();
  clearTable();

  const rawVal = input.value.trim();
  if (!rawVal) {
    showError("Please enter a logical expression before generating the table.");
    return;
  }

  const vars = getVars(rawVal);
  const n = vars.length;

  //---------

  if (n === 0) {
    showError("Formula must contain at least one variable (A-Z).");
    return;
  }
  if (n > 6) {
    showError(
      `That's ${Math.pow(2, vars.length)} rows — please keep it readable. Maximum 6 variables supported.`,
    );
    return;
  }

  //---------

  let tokens, tree;
  try {
    tokens = tokenizer(rawVal);
    tree = parse(tokens);
  } catch (err) {
    showError(err.message);
    return;
  }
  //---------
  try {
    if (!renderTableDom) {
      throw new Error("Table container was not found on the page.");
    }
    const allRowAssignments = getRows(vars); // [{P:flase, Q:false}, ...]
    const results = allRowAssignments.map(
      (
        eachRowAssignment, // [flase, true, true,...]
      ) => evaluate(tree, eachRowAssignment),
    );

    /* --- */
    renderStats(results);
    /* --- */
    const table = renderTable(vars, allRowAssignments, results);
    renderTableDom.replaceChildren(table);

    /* metadate */

    if (tableDetails) {
      tableDetails.textContent = `${vars.length} variables / ${allRowAssignments.length} rows`;
    }
    /*  */
  } catch (err) {
    showError(`Could not build the truth table. ${err.message}`);
    clearTable();
  }
};

/* ^^^^ Logic for injection of the Truth Table into the DOM ^^^^^^ */

const renderTable = (vars, allRowAssignments, results) => {
  const rows = allRowAssignments.length;

  const fragTable = document.createDocumentFragment();
  const head = document.createElement("thead");
  const body = document.createElement("tbody");

  /* --- */

  const headRow = document.createElement("tr");
  vars.forEach((v) => {
    const th = document.createElement("th");
    th.textContent = v;
    headRow.appendChild(th);
  });
  const thforformula = document.createElement("th");
  thforformula.className = "formulaHead";
  thforformula.textContent = input.value; //input is a global var
  headRow.appendChild(thforformula);

  /* --- */

  for (let row = 0; row < rows; row++) {
    const tr = document.createElement("tr");
    tr.style.setProperty("--row-index", row);
    vars.forEach((eachVar) => {
      const td = document.createElement("td");
      const value = allRowAssignments[row][eachVar];
      td.className = `truthCell ${value ? "is-true" : "is-false"}`;
      td.innerHTML = `<span class="truthMark">${value ? "T" : "F"}</span>`;
      tr.appendChild(td);
    });
    const td = document.createElement("td");
    td.className = `resultCell ${results[row] ? "is-true" : "is-false"}`;
    td.innerHTML = `<span class="verdict">${results[row] ? "True" : "False"}</span>`;
    tr.appendChild(td);

    body.appendChild(tr);
  }

  /* --- */
  head.appendChild(headRow);
  fragTable.appendChild(head);
  fragTable.appendChild(body);

  return fragTable;
};

/* ^^^^^^^^ Table Stats ^^^^^^^ */

const renderStats = (results) => {
  const vertictBadge = document.querySelector(".verdict");
  const satisfiable = document.querySelector(".satisfiable");
  const trueRows = document.querySelector(".nTrue");
  const fasleRows = document.querySelector(".nFalse");

  const n = results.length;
  const trueCount = results.filter((r) => r).length;
  const falseCount = n - trueCount;
  const isTautology = trueCount === n ? true : false;
  const isContradiction = falseCount === n ? true : false;
  const isContingency = !isTautology && !isContradiction;

  vertictBadge.textContent = isTautology
    ? "Tautology"
    : isContingency
      ? "Contingency"
      : "Contradiction";
  satisfiable.textContent = trueCount > 0 ? "Yes" : "No";
  trueRows.textContent = trueCount;
  fasleRows.textContent = falseCount;

  /*   console.log(`TC: ${trueCount}\nFC:${falseCount}\nStatus:${verdict}`);
   */
};
