let info = document.querySelector(".info");

let watcher = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    info.classList.add("showBlob");
    console.log(entries);
  }
});

watcher.observe(info);
