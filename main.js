(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CONTACT = 'hello@northlightagents.com';

  /* mobile menu */
  var btn = document.querySelector('.menu'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  }

  /* gentle reveal */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add('on'); });

  /* 3D tilt on pointer devices */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 8, base = el.classList.contains('frame') ? 'rotateY(-9deg) rotateX(4deg)' : '';
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'rotateY(' + (x * max * 2) + 'deg) rotateX(' + (-y * max * 2) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = base; });
    });
  }

  /* sample activity log */
  var log = document.getElementById('log');
  if (log) {
    var lines = [
      ['09:02', 'Research', '#5FE0F0', 'Reading 14 sources on warehouse automation in Poland.'],
      ['09:06', 'Research', '#5FE0F0', 'Brief ready with 11 claims and links. Handed to Fact-checker.'],
      ['09:07', 'Fact-checker', '#6EF0B0', '10 of 11 claims confirmed. 1 flagged: the source is from 2019.'],
      ['09:12', 'Writer', '#FFC25E', 'Draft updated. The flagged claim is removed.'],
      ['09:13', 'Lead scout', '#8E7BFF', 'Found 9 companies that match your profile. 6 have a named contact.'],
      ['09:15', 'Assistant', '#7AA7FF', 'Prepared 6 outreach drafts. None sent.'],
      ['09:15', 'Needs you', '#FFC25E', 'Approve the article and the 6 drafts before anything goes out.', true]
    ];
    var i = 0;
    function add() {
      if (log.children.length >= 7) log.removeChild(log.firstChild);
      var l = lines[i % lines.length], li = document.createElement('li');
      if (l[4]) li.className = 'ask';
      li.style.setProperty('--c', l[2]);
      var t = document.createElement('time'); t.textContent = l[0];
      var s = document.createElement('span'), b = document.createElement('b');
      b.textContent = l[1] + ': '; s.appendChild(b); s.appendChild(document.createTextNode(l[3]));
      li.appendChild(t); li.appendChild(s); log.appendChild(li); i++;
    }
    if (reduce) { for (var k = 0; k < lines.length; k++) add(); }
    else { add(); setInterval(function () { if (!document.hidden) add(); }, 1900); }
  }

  /* contact form: opens the visitor's email app with the message filled in */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return;
      var f = form.elements;
      var body = 'Name: ' + f.name.value + '\nCompany: ' + f.company.value + '\nEmail: ' + f.email.value +
        '\nTeam size: ' + f.size.value + '\n\nWhat I would like to hand off:\n' + f.message.value + '\n';
      var url = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('Discovery call request from ' + f.name.value) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app with the message ready to send. If nothing opens, write to ' + CONTACT + '.';
      window.location.href = url;
    });
  }

  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
})();
