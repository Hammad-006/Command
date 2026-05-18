/* const heroHeading = document.querySelector(".heroHeading");

if (heroHeading) {
  const resetHeading = () => {
    heroHeading.style.transform =
      "translate(-50%, -50%) perspective(700px) rotateX(0deg) rotateY(0deg)";
    heroHeading.style.textShadow = "0 0 20px rgba(255, 255, 255, 0.12)";
  };

  window.addEventListener("pointermove", (event) => {
    const rect = heroHeading.getBoundingClientRect();
    const deltaX = event.clientX - (rect.left + rect.width / 2);
    const deltaY = event.clientY - (rect.top + rect.height / 2);
    const rotateY = (deltaX / rect.width) * 20;
    const rotateX = -(deltaY / rect.height) * 20;
    const shadowX = (deltaX / rect.width) * 18;
    const shadowY = (deltaY / rect.height) * 18;

    heroHeading.style.transform = `translate(-50%, -50%) perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    heroHeading.style.textShadow = `${shadowX}px ${shadowY}px 35px rgba(4, 255, 255, 0.25), ${-shadowX}px ${-shadowY}px 30px rgba(255, 100, 255, 0.18)`;

    document.documentElement.style.setProperty(
      "--hero-glow-x",
      `${(event.clientX / window.innerWidth) * 100}%`,
    );
    document.documentElement.style.setProperty(
      "--hero-glow-y",
      `${(event.clientY / window.innerHeight) * 100}%`,
    );
  });

  window.addEventListener("pointerleave", resetHeading);
  window.addEventListener("blur", resetHeading);
}
 */
