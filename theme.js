/* Night mode: follows the visitor's system setting until they choose, then remembers the choice. */
(function () {
  var d = document.documentElement, K = 'nl-theme', saved = null;
  try { saved = localStorage.getItem(K); } catch (e) {}
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function resolve() { return saved === 'dark' || saved === 'light' ? saved : (mq && mq.matches ? 'dark' : 'light'); }
  function apply(t) {
    d.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0B0F17' : '#FAFAF8');
    var bs = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < bs.length; i++) { bs[i].setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); bs[i].setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to night mode'); }
  }
  apply(resolve());
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!saved) apply(resolve()); });
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
