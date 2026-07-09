(function () {
  const switchContainer = document.querySelector(".toolSwitchBox");
  if (!switchContainer) return;

  const buttons = [...switchContainer.querySelectorAll(".modeBtn")];
  const indicator = switchContainer.querySelector(".selectionHighlight");
  const panels = [...document.querySelectorAll("[data-tool-panel]")];

  function moveIndicatorTo(button) {
    if (!indicator || !button) return;
    indicator.style.width = `${button.offsetWidth}px`;
    indicator.style.transform = `translateX(${button.offsetLeft - 5}px)`;
  }

  function activateMode(mode) {
    const activeButton =
      buttons.find((button) => button.dataset.mode === mode) || buttons[0];
    if (!activeButton) return;

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
    const current = buttons.find((button) => button.classList.contains("active"));
    activateMode(current?.dataset.mode || buttons[0]?.dataset.mode);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const current = buttons.find((button) => button.classList.contains("active"));
      moveIndicatorTo(current);
    }, 80);
  });
})();
