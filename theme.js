/* Night mode: the site is light by default. A visitor can switch to night mode and the choice is remembered. */
(function () {
  var d = document.documentElement, K = 'nl-theme', saved = null;
  try { saved = localStorage.getItem(K); } catch (e) {}
  function resolve() { return saved === 'dark' ? 'dark' : 'light'; }
  function apply(t) {
    d.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0B0F17' : '#FAFAF8');
    var bs = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < bs.length; i++) { bs[i].setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); bs[i].setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to night mode'); }
  }
  apply(resolve());
  document.addEventListener('DOMContentLoaded', function () {
    apply(resolve());
    var bs = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < bs.length; i++) bs[i].addEventListener('click', function () {
      saved = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(K, saved); } catch (e) {}
      apply(saved);
    });
  });
})();
