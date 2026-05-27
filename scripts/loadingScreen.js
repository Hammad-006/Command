window.addEventListener("load", () => {
  const loadingScr = document.querySelector(".loadingScr");
  if (!loadingScr) return;

  // trigger the hide animation (expects a CSS transition)
  loadingScr.classList.add("hideLoadingScr");

  // wait for the CSS transition to finish, then remove the element
  loadingScr.addEventListener(
    "transitionend",
    () => {
      loadingScr.remove();
    },
    { once: true }
  );
});
