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
    if (/[A-Za-z]/.test(ch))
      tokens.push({ type: TT.VAR, val: ch }); // VAR not var
    else if (ch === "¬") tokens.push({ type: TT.NOT });
    else if (ch === "∧") tokens.push({ type: TT.AND });
    else if (ch === "∨") tokens.push({ type: TT.OR });
    else if (ch === "→") tokens.push({ type: TT.IF });
    else if (ch === "↔") tokens.push({ type: TT.IFF });
    else if (ch === "(") tokens.push({ type: TT.LPAREN });
    else if (ch === ")") tokens.push({ type: TT.RPAREN });
    else throw new Error(`Invalid Character/Symbol: ${ch}`);
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
    if (type && t?.type !== type)
      throw new Error(`Eat shit cuz what's this: ${type}`);
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
      throw new Error(
        `Fuck up at [parseATOM]. Incomplete Expression prolly, check the end of the formula`,
      );
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
    throw new Error(`Atom (character) not valid somewhere in the input`);
  }

  const tree = parseIFF();

  if (i < tokens.length)
    throw new Error(
      `not able to parse beyond ${tokens[i]?.val ?? tokens[i]?.type}`,
    );

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
