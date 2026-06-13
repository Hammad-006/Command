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
  input.dispatchEvent(new Event("input", { bubbles: true }));
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

/* ^^^Generating Tokens for the formula^^ */
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

/* ^^^^^ Parseing adn tree building Logic ^^^^^ */
const parse = (tokens) => {
  let i = 0;
  const peek = () => {
    return tokens[i];
  };

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
    if (type && t?.type !== type)
      throw new Error(`Eat shit cuz what's this: ${type}`);
    i++;
    //here we are not returning anything, cuz we dont need to.
  };

  //Ordered from loosest to tightest puh: IFF → IF → OR → AND → NOT → ATOM

  function parseIFF() {
    let left = parseIF();
    while (peek()?.type === "IFF") {
      eat("IFF");
      let right = parseNOT();
      left = { type: "IFF", left, right };
    }
    return left;
  }

  function parseIF() {
    let left = parseOR();
    while (peek()?.type() === "IF") {
      eat("IF");
      let right = parseNOT();
      left = { type: "IF", left, right };
    }
    return left;
  }

  function parseOR() {
    let left = parseAND();
    while (peek()?.type === "OR") {
      eat("OR");
      let right = parseNOT();
      left = { type: "OR", left, right };
    }
    return left;
  }

  function parseAND() {
    let left = parseNOT();
    while (peek()?.type === "AND") {
      eat("AND");
      let right = parseNOT();
      left = { type: "AND", left, right };
    }
    return left;
  }

  function parseNOT() {
    if (peek()?.type === "NOT") {
      eat("NOT");
      let operand = parseNOT();
      return { type: "NOT", val: operand };
    }
    return parseATOM();
  }

  function parseATOM() {
    const t = peek();
    if (!t)
      throw new Error(
        `Fuck up at [parseATOM]. Incomplete Expression prolly, check the end of the formula`,
      );
    if (t.type === `VAR`) {
      eat("VAR");
      return { type: "VAR", val: t.val };
    }
    if (t.type === `LPAREN`) {
      eat("LPAREN");
      const subExpression = parseIFF();
      eat("RPAREN");
      return subExpression;
    }
    throw new Error(`Atom (character) not valid somewhere in the input`);
  }

  const tree = parseIFF();

  if (i < tokens.length)
    throw new Error(`not able to parse beyond ${token[i]}`);

  return tree;
};

/* ^^^^^^^^Generate^^^^^^^^^ */

const generateTruthTable = () => {
  hideError();
  const rawval = input.value.trim();
  console.log(`User Input: ${input.value}`);
  const vars = getVars(rawval);
};

/* ^^^^^^^^ */
