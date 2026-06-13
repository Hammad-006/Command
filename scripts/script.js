const input = document.querySelector(".input");
const genBtn = document.querySelector(".genBtn");
const opt = document.querySelector(".opt");

/* ^^^^Testing/ Debugging */

/* input.addEventListener("input", (e) => {
  console.log(` Start: ${input.selectionStart} ||| End: ${input.selectionEnd}`);
}); */

/* ^^^ clear button hide and show^^^ */
const clrbtn = document.querySelector(".clearBtn");
input.addEventListener("input", () => {
  clrbtn.style.display = input.value.trim() ? "block" : "none";
});

clrbtn.addEventListener("click", () => {
  input.value = ``;
  clrbtn.style.display = "none";
  input.focus();
});

/* ^^^^^^^Inser and Cursor reposition^^^^^^^^^^^^ */

repositionCursor = (currentPos, offset) => {
  input.selectionStart = input.selectionEnd = currentPos + offset;
};
insertSym = (sym) => {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const currentText = input.value;
  input.value = currentText.slice(0, start) + sym + currentText.slice(end);
  let offset = sym.length;
  repositionCursor(start, offset);
  input.focus();
};

/* ^^^^^^^ */

const loadSuggetions = (formula) => {
  insertSym(formula);
};

/* ^^^^^Keydown EventListner^^^^^^ */
//Events for Input fild...
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && input.value !== ``) {
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
  if (input.value === ``) return;
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
const showError = (err) => {
  const errorMsg = document.querySelector(".errorMsg");
  errorMsg.textContent = msg;
  errorMsg.classList.add("showError");
};

const hideError = () => {
  document.querySelector(".errorMsg").classList.remove("showError");
};

/* ^^^^^^Extracting the Variables form the input^^^^^^^^ */

function getVars(formula) {
  const vars = new Set();
  for (const char of formula) {
    if (/[A-Za-z]/.test(char)) vars.add(char);
  }
  console.log([...vars]);
  return [...vars].sort();
}

/* ^^^^^^ */
// Note: here we have used for-of loop and it works fine for now. But if we need to access index to check the next chars then we need a while loop with manual updating of i.
const tokenizer = (formula) => {
  let tokens = [];
  for (const ch of formula) {
    if (ch == " ") continue;
    if (ch === /[A-Za-z]/)
      tokens.push({ type: "VAR", val: ch }); // VAR not var
    else if (ch === "¬") tokens.push({ type: "NOT" });
    else if (ch === "∧") tokens.push({ type: "AND" });
    else if (ch === "∨") tokens.push({ type: "OR" });
    else if (ch === "→") tokens.push({ type: "IF" });
    else if (ch === "↔") tokens.push({ type: "IFF" });
    else if (ch === "(") tokens.push({ type: "LPAREN" });
    else if (ch === ")") tokens.push({ type: "RPAREN" });
    else throw new Error(`Invalid character/Symbol: ${ch}`);
  }
  return tokens;
};

/* ^^^^^^^^Generate^^^^^^^^^ */

const generateTruthTable = () => {
  hideError();
  const rawval = input.value.trim();
  console.log(`User Input: ${input.value}`);
  const vars = getVars(rawval);
};

/* ^^^^^^^^ */
