const input = document.querySelector(".input");
const genBtn = document.querySelector(".genBtn");
const opt = document.querySelector(".opt");

/* ^^^^Testing/ Debugging */

/* input.addEventListener("input", (e) => {
  console.log(` Start: ${input.selectionStart} ||| End: ${input.selectionEnd}`);
}); */

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

/* ^^^^^^^^^^^^^^^^^ */

function getVars(formula) {
  const vars = new Set();
  for (const char of formula) {
    if (/[A-za-z]/.test(char)) vars.add(char);
  }
  console.log([...vars]);
  return [...vars].sort();
}

/* ^^^^^^^^Generate^^^^^^^^^ */

const generateTruthTable = () => {
  const val = input.value;
  console.log(`User Input: ${input.value}`);
  getVars(val);
};
