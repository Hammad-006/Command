(function () {
  const switchContainer = document.querySelector(".toolSwitchBox");
  if (!switchContainer) return;

  const buttons = [...switchContainer.querySelectorAll(".modeBtn")];
  const indicator = switchContainer.querySelector(".selectionHighlight");
  const panels = [...document.querySelectorAll("[data-tool-panel]")];
  const modeOrder = buttons.map((button) => button.dataset.mode);

  let previousMode = null;

  function moveIndicatorTo(button) {
    if (!indicator || !button) return;
    indicator.style.width = `${button.offsetWidth}px`;
    indicator.style.transform = `translateX(${button.offsetLeft - 5}px)`;
  }

  // Tells the CSS which direction the pill is travelling in, so the
  // liquidSwitchWide keyframe animation actually has something to key off.
  // On the very first call (previousMode still null) both attributes are
  // set to the same index, which deliberately matches none of the
  // .toolSwitchBox[c-previous][c-current] rules, so no animation plays
  // on initial page load.
  function updateSwitchAttributes(mode) {
    const currentIndex = modeOrder.indexOf(mode) + 1;
    const previousIndex = previousMode
      ? modeOrder.indexOf(previousMode) + 1
      : currentIndex;

    switchContainer.setAttribute("c-previous", String(previousIndex));
    switchContainer.setAttribute("c-current", String(currentIndex));
  }

  function activateMode(mode) {
    const activeButton =
      buttons.find((button) => button.dataset.mode === mode) || buttons[0];
    if (!activeButton) return;

    updateSwitchAttributes(activeButton.dataset.mode);

    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.toolPanel === activeButton.dataset.mode;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });

    moveIndicatorTo(activeButton);
    previousMode = activeButton.dataset.mode;
    window.dispatchEvent(
      new CustomEvent("toolModeChange", {
        detail: { mode: activeButton.dataset.mode },
      }),
    );
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => activateMode(button.dataset.mode));
  });

  requestAnimationFrame(() => {
    const current = buttons.find((button) =>
      button.classList.contains("active"),
    );
    activateMode(current?.dataset.mode || buttons[0]?.dataset.mode);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const current = buttons.find((button) =>
        button.classList.contains("active"),
      );
      moveIndicatorTo(current);
    }, 80);
  });
})();

/* Footer Qoutes */

const quotes = [
  `"The true function of logic [...] is analytic rather than constructive; [...] while it liberates imagination as to what the world may be, it refuses to legislate as to what the world is." — Bertrand Russell`,
  `"Logic takes care of itself; all we have to do is to look and see how it does it." — Ludwig Wittgenstein`,
  `"Law is reason, free from passion" — Aristotle`,
  `"To discover truths is the task of all sciences; it falls to logic to discern the laws of truth." — Gottlob Frege`,
  `"Contrariwise, if it was so, it might be; and if it were so, it would be; but as it isn't, it ain't. That's logic." — Lewis Carroll`,
  `"Logic is a science of the necessary laws of thought, without which no employment of the understanding takes place." — Immanuel Kant`,
  `"The two eyes of exact science are mathematics and logic: the mathematical sect puts out the logical eye, the logical sect puts out the mathematical eye." — De Morgan`,
  `"Logic is rooted in the social principle." — Charles Sanders Peirce`,
  `"What we cannot speak about we must pass over in silence." — Ludwig Wittgenstein`,
  `"The design of this treatise is to investigate the fundamental laws of those operations of the mind by which reasoning is performed." — George Boole`,
  `"The sentence 'snow is white' is true if and only if snow is white." — Alfred Tarski`,
];

let i = 0;
function showQoutes() {
  const footerQoutes = document.querySelector(".footer-qoutes");
  if (!footerQoutes) return;

  /*   console.log(i);
   */ footerQoutes.textContent = quotes[i];
  i = (i + 1) % quotes.length;
}

setInterval(showQoutes, 10000);

/*  */
