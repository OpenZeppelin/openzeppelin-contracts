function gtag() {
  dataLayer.push(arguments);
}
window.dataLayer = window.dataLayer || [];
gtag("js", new Date());
gtag("config", document.getElementById("ga-key").getAttribute("value"));
