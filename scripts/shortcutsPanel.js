(function () {
  const trigger = document.getElementById("shortcutsTrigger");
  const panel = document.getElementById("shortcutsPanel");
  const header = document.getElementById("shortcutsPanelHeader");
  const closeBtn = document.getElementById("shortcutsPanelClose");
  const resizeHandle = document.getElementById("shortcutsPanelResize");
  const searchInput = document.getElementById("shortcutsSearchInput");
  const categoriesNav = document.getElementById("shortcutsCategories");
  const listEl = document.getElementById("shortcutsList");

  if (!trigger || !panel) return;

  const MOBILE_BREAKPOINT = 680;
  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 340;
  const VIEWPORT_MARGIN = 16;

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     DATA — add new entries here as Lemma grows.
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  const categoryMeta = {
    syntax: { label: "Syntax", icon: "∴" },
    global: { label: "Global", icon: "⌘" },
    table: { label: "Truth Table", icon: "▦" },
  };

  const shortcuts = [
    {
      category: "syntax",
      label: "Conjunction (AND)",
      keys: ["&", "^", "AND"],
      symbol: "∧",
    },
    {
      category: "syntax",
      label: "Disjunction (OR)",
      keys: ["|", "OR"],
      symbol: "∨",
    },
    {
      category: "syntax",
      label: "Negation (NOT)",
      keys: ["!", "-", "~", "NOT"],
      symbol: "¬",
    },
    {
      category: "syntax",
      label: "Implication (IF)",
      keys: ["->", "IF"],
      symbol: "→",
    },
    {
      category: "syntax",
      label: "Biconditional (IFF)",
      keys: ["<>", "IFF"],
      symbol: "↔",
    },
    {
      category: "syntax",
      label: "Grouping (auto-pairs)",
      keys: ["(", "[", "{"],
      symbol: "( )",
    },

    { category: "global", label: "Open this panel", keys: ["Shift", "?"] },
    { category: "global", label: "Close this panel", keys: ["Esc"] },
    {
      category: "global",
      label: "Focus the active expression field",
      keys: ["/"],
    },

    { category: "table", label: "Generate truth table", keys: ["Enter"] },
  ];

  let activeCategory = "syntax";

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     RENDER
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  function renderCategories() {
    const cats = [...new Set(shortcuts.map((s) => s.category))];
    categoriesNav.replaceChildren(
      ...cats.map((cat) => {
        const meta = categoryMeta[cat] || { label: cat, icon: "•" };
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "shortcutsCat" + (cat === activeCategory ? " active" : "");
        btn.dataset.category = cat;
        btn.innerHTML = `<span class="shortcutsCat-icon" aria-hidden="true">${meta.icon}</span>${meta.label}`;
        btn.addEventListener("click", () => {
          activeCategory = cat;
          searchInput.value = "";
          renderCategories();
          renderList();
        });
        return btn;
      }),
    );
  }

  function keyBadges(keys) {
    return keys
      .map((k, idx) => {
        const sep = idx === 0 ? "" : `<span class="shortcutRow-or">or</span>`;
        return `${sep}<kbd>${k}</kbd>`;
      })
      .join("");
  }

  function renderRow(item) {
    const row = document.createElement("div");
    row.className = "shortcutRow";
    const keysHtml = item.keys ? keyBadges(item.keys) : "";
    const symbolHtml = item.symbol
      ? `<span class="shortcutRow-symbol">${item.symbol}</span>`
      : "";
    row.innerHTML = `
      <span class="shortcutRow-label">${item.label}</span>
      <span class="shortcutRow-keys">${keysHtml}${symbolHtml}</span>
    `;
    return row;
  }

  function renderList() {
    const term = searchInput.value.trim().toLowerCase();
    listEl.replaceChildren();

    if (term) {
      const matches = shortcuts.filter(
        (s) =>
          s.label.toLowerCase().includes(term) ||
          (s.keys || []).some((k) => k.toLowerCase().includes(term)),
      );
      if (!matches.length) {
        const empty = document.createElement("p");
        empty.className = "shortcutsPanel-empty";
        empty.textContent = `No matches for "${searchInput.value.trim()}".`;
        listEl.appendChild(empty);
        return;
      }
      let lastCat = null;
      matches.forEach((item) => {
        if (item.category !== lastCat) {
          const heading = document.createElement("p");
          heading.className = "shortcutsPanel-categoryHeading";
          heading.textContent =
            (categoryMeta[item.category] || {}).label || item.category;
          listEl.appendChild(heading);
          lastCat = item.category;
        }
        listEl.appendChild(renderRow(item));
      });
      return;
    }

    shortcuts
      .filter((s) => s.category === activeCategory)
      .forEach((item) => listEl.appendChild(renderRow(item)));
  }

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     GEOMETRY — default size/position, matches the original fixed layout
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  function applyDefaultGeometry() {
    if (isMobile()) {
      panel.style.removeProperty("width");
      panel.style.removeProperty("height");
      panel.style.removeProperty("left");
      panel.style.removeProperty("top");
      return;
    }
    const width = Math.min(420, window.innerWidth - VIEWPORT_MARGIN * 2);
    const height = window.innerHeight - VIEWPORT_MARGIN * 2;
    const left = window.innerWidth - width - VIEWPORT_MARGIN;
    const top = VIEWPORT_MARGIN;

    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function clampToViewport() {
    if (isMobile()) return;
    const rect = panel.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;

    if (left + rect.width > window.innerWidth - 4)
      left = window.innerWidth - rect.width - 4;
    if (top + rect.height > window.innerHeight - 4)
      top = window.innerHeight - rect.height - 4;
    if (left < 4) left = 4;
    if (top < 4) top = 4;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     OPEN / CLOSE
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  function openPanel() {
    if (!panel.dataset.sized) {
      applyDefaultGeometry();
      panel.dataset.sized = "true";
    }
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("is-open"));
    trigger.setAttribute("aria-expanded", "true");
    searchInput.value = "";
    renderCategories();
    renderList();
    searchInput.focus();
  }

  function closePanel() {
    panel.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    const onEnd = () => {
      panel.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd, { once: true });
    trigger.focus();
  }

  function togglePanel() {
    if (panel.hidden) openPanel();
    else closePanel();
  }

  function focusPrimaryInput() {
    const activePanel = document.querySelector(".tool-panel.active");
    const primaryInput = activePanel?.querySelector(".input-field");
    if (primaryInput) primaryInput.focus();
  }

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     DRAG — grab anywhere on the header except its buttons
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  function startDrag(e) {
    if (isMobile() || e.target.closest("button")) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;

    panel.classList.add("is-dragging");

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const left = Math.max(
        4,
        Math.min(startLeft + dx, window.innerWidth - rect.width - 4),
      );
      const top = Math.max(
        4,
        Math.min(startTop + dy, window.innerHeight - rect.height - 4),
      );

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    function onUp() {
      panel.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     RESIZE — top-left handle. The bottom-right corner is the fixed
     anchor now: dragging the handle up/left grows the window, and
     left/top are recomputed each frame so the opposite corner never moves.
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  function startResize(e) {
    if (isMobile()) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const rightEdge = rect.left + rect.width;
    const bottomEdge = rect.top + rect.height;

    panel.classList.add("is-resizing");

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const maxWidth = rightEdge - 4;
      const maxHeight = bottomEdge - 4;

      const width = Math.max(MIN_WIDTH, Math.min(startWidth - dx, maxWidth));
      const height = Math.max(
        MIN_HEIGHT,
        Math.min(startHeight - dy, maxHeight),
      );

      panel.style.width = `${width}px`;
      panel.style.height = `${height}px`;
      panel.style.left = `${rightEdge - width}px`;
      panel.style.top = `${bottomEdge - height}px`;
    }

    function onUp() {
      panel.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  /* ^^^^^^^^^^^^^^^^^^^^^^^
     WIRE UP
  ^^^^^^^^^^^^^^^^^^^^^^^ */
  trigger.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  header.addEventListener("pointerdown", startDrag);
  if (resizeHandle) resizeHandle.addEventListener("pointerdown", startResize);
  searchInput.addEventListener("input", renderList);

  window.addEventListener("resize", () => {
    if (panel.hidden) {
      panel.dataset.sized = "";
      return;
    }
    if (isMobile()) applyDefaultGeometry();
    else clampToViewport();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      closePanel();
      return;
    }

    const isTyping = ["INPUT", "TEXTAREA"].includes(
      document.activeElement?.tagName,
    );

    if (e.key === "?" && e.shiftKey && panel.hidden && !isTyping) {
      e.preventDefault();
      openPanel();
      return;
    }

    if (e.key === "/" && !isTyping && panel.hidden) {
      e.preventDefault();
      focusPrimaryInput();
    }
  });
})();
