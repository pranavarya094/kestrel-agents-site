(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CONTACT = 'hello@northlightagents.com';

  /* mobile menu: animated open/close */
  var btn = document.querySelector('.menu'), nav = document.getElementById('nav');
  if (btn && nav) {
    function setMenu(open) { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target) && !btn.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });
  }

  /* gentle reveal */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    rv.forEach(function (n) { io.observe(n); });
  } else rv.forEach(function (n) { n.classList.add('on'); });
  /* safety net: anything the visitor has already scrolled past is always shown */
  var tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; rv.forEach(function (n) { if (!n.classList.contains('on') && n.getBoundingClientRect().top < window.innerHeight) n.classList.add('on'); }); });
  }, { passive: true });


  /* hero scene: agents work in turn and hand a packet to the next one */
  var scene = document.getElementById('scene');
  if (scene) {
    var cards = Array.prototype.slice.call(scene.querySelectorAll('.ac')), packet = scene.querySelector('.packet'), tm = [];
    function ctr(el) { var r = el.getBoundingClientRect(), s = scene.getBoundingClientRect(); return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; }
    function setSt(c, txt) { var e = c.querySelector('.st'); if (e) e.textContent = txt; }
    function num(c, dur, instant) {
      var n = c.querySelector('[data-n]'); if (!n) return;
      var to = +n.getAttribute('data-n'), suf = n.getAttribute('data-suffix') || '';
      if (instant || reduce) { n.textContent = to + suf; return; }
      var t0 = null; (function f(t) { if (t0 === null) t0 = t; var p = Math.min((t - t0) / dur, 1); n.textContent = Math.round(to * p) + suf; if (p < 1) requestAnimationFrame(f); })(performance.now());
    }
    function resetAll() { cards.forEach(function (c) { c.classList.remove('run', 'active', 'done'); setSt(c, 'Idle'); var n = c.querySelector('[data-n]'); if (n) n.textContent = '0' + (n.getAttribute('data-suffix') || ''); }); packet.style.opacity = 0; }
    function later2(fn, ms) { tm.push(setTimeout(fn, ms)); }
    function step(i) {
      if (i >= cards.length) { cards.forEach(function (c) { c.classList.remove('active'); }); later2(function () { resetAll(); later2(function () { step(0); }, 900); }, 3400); return; }
      var c = cards[i]; c.classList.add('run', 'active'); setSt(c, 'Working'); num(c, 2200);
      later2(function () {
        c.classList.remove('active'); c.classList.add('done'); setSt(c, 'Done');
        if (i + 1 < cards.length) {
          var a = ctr(c), b = ctr(cards[i + 1]);
          packet.style.transition = 'none'; packet.style.transform = 'translate(' + a[0] + 'px,' + a[1] + 'px)'; packet.style.opacity = 1;
          void packet.offsetWidth; packet.style.transition = '';
          packet.style.transform = 'translate(' + b[0] + 'px,' + b[1] + 'px)';
          later2(function () { packet.style.opacity = 0; step(i + 1); }, 800);
        } else step(i + 1);
      }, 2500);
    }
    if (reduce) { cards.forEach(function (c) { c.classList.add('run', 'done'); setSt(c, 'Done'); num(c, 0, true); }); }
    else { resetAll(); later2(function () { step(0); }, 600); }
  }

  /* interactive task simulator (clearly labelled as simulated) */
  var sim = document.getElementById('sim');
  if (sim) {
    var A = {
      scout: ['Scout', '#6B5BD6'], research: ['Research', '#1B8FA6'], writer: ['Writer', '#C98A12'], check: ['Checker', '#1E9E6B'],
      strategy: ['Strategy', '#3B6FD8'], video: ['Video', '#E07A2E'], publish: ['Publisher', '#D1566B']
    };
    var S = [
      { label: 'Find leads', agents: ['scout', 'research', 'writer'], steps: [
        ['scout', 'Searching for companies that match your profile.', 1500],
        ['scout', 'Found 9 matches. 6 have a named decision maker.', 1700],
        ['research', 'Reading each company site for a reason to reach out.', 1700],
        ['writer', 'Drafting 6 personal messages. None are sent.', 1700]],
        res: ['6 outreach drafts are ready for you', 'Review the list and the messages. Nothing is sent until you approve.'] },
      { label: 'Research a market', agents: ['research', 'check', 'writer'], steps: [
        ['research', 'Reading 14 sources on warehouse automation in Poland.', 1500],
        ['research', 'Brief ready with 11 claims and a link behind each.', 1700],
        ['check', '10 of 11 claims confirmed. 1 flagged: the source is from 2019.', 1800],
        ['writer', 'Removed the flagged claim and finished the summary.', 1600]],
        res: ['A sourced market brief is ready', 'Every claim links to its source. One outdated claim was removed.'] },
      { label: 'Write an article', agents: ['strategy', 'writer', 'check'], steps: [
        ['strategy', 'Picked a topic from your customers’ most common questions.', 1500],
        ['writer', 'Drafted 900 words in your brand voice.', 1700],
        ['check', 'Checked 8 claims against sources. All confirmed.', 1700],
        ['check', 'Added a headline and search description.', 1400]],
        res: ['Article draft is ready to publish', 'Read it, change anything you like, then approve it for publishing.'] },
      { label: 'Run the content machine', agents: ['strategy', 'writer', 'video', 'publish'], steps: [
        ['strategy', 'Found 5 topics trending in your niche today.', 1500],
        ['writer', 'Wrote 5 short video scripts in your style.', 1500],
        ['video', 'Generating 5 videos. 3 of 5 are rendered.', 1700],
        ['publish', 'Scheduled posts across Instagram, TikTok and Shorts.', 1600]],
        res: ['14 videos are queued for this week', 'Approve the batch, or set rules so approved formats publish on their own, 24 hours a day.'] }
    ];
    var chips = sim.querySelector('.chips'), flow = document.getElementById('flow'), log = document.getElementById('log'), result = document.getElementById('result');
    var timers = [], cur = 0, auto = true;
    S.forEach(function (sc, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = sc.label; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { auto = false; run(i); });
      chips.appendChild(b);
    });
    function clearT() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function stamp(n) { var m = 2 + n * 3; return '09:' + (m < 10 ? '0' : '') + m; }
    function addLine(key, text, n, ask) {
      if (log.children.length >= 5) log.removeChild(log.firstChild);
      var li = document.createElement('li'); if (ask) li.className = 'ask';
      li.style.setProperty('--c', A[key] ? A[key][1] : '#101318');
      var t = document.createElement('time'); t.textContent = stamp(n);
      var s = document.createElement('span'), b = document.createElement('b');
      b.textContent = (A[key] ? A[key][0] : 'Needs you') + ': '; s.appendChild(b); s.appendChild(document.createTextNode(text));
      li.appendChild(t); li.appendChild(s); log.appendChild(li);
    }
    function setNodes(sc, activeIdx, allDone) {
      Array.prototype.forEach.call(flow.children, function (n, i) {
        n.classList.toggle('done', allDone ? i < flow.children.length - 1 || false : i < activeIdx);
        n.classList.toggle('on', !allDone && i === activeIdx || (allDone && i === flow.children.length - 1));
      });
    }
    function showResult(sc) {
      result.hidden = false; result.textContent = '';
      var st = document.createElement('strong'); st.textContent = sc.res[0];
      var p = document.createElement('p'); p.textContent = sc.res[1];
      var acts = document.createElement('div'); acts.className = 'acts';
      var ok = document.createElement('button'); ok.type = 'button'; ok.textContent = 'Approve';
      var no = document.createElement('button'); no.type = 'button'; no.className = 'alt'; no.textContent = 'Ask for changes';
      function done(msg) { auto = false; clearT(); acts.remove(); var m = document.createElement('p'); m.className = 'done-msg'; m.textContent = msg; result.appendChild(m); }
      ok.addEventListener('click', function () { done('Approved. In this demo nothing is actually sent.'); });
      no.addEventListener('click', function () { done('Noted. The agents would revise and send it back to you.'); });
      acts.appendChild(ok); acts.appendChild(no); result.appendChild(st); result.appendChild(p); result.appendChild(acts);
    }
    function run(i) {
      clearT(); cur = i; var sc = S[i];
      Array.prototype.forEach.call(chips.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      flow.textContent = ''; log.textContent = ''; result.hidden = true;
      sc.agents.forEach(function (k) {
        var n = document.createElement('div'); n.className = 'node'; n.style.setProperty('--c', A[k][1]);
        var c = document.createElement('i'); c.textContent = A[k][0].charAt(0);
        n.appendChild(c); n.appendChild(document.createTextNode(A[k][0])); flow.appendChild(n);
      });
      var y = document.createElement('div'); y.className = 'node you'; y.style.setProperty('--c', '#101318');
      var yc = document.createElement('i'); yc.textContent = 'You'; yc.style.fontSize = '11px'; y.appendChild(yc); y.appendChild(document.createTextNode('Approve')); flow.appendChild(y);
      if (reduce) {
        sc.steps.forEach(function (st, n) { addLine(st[0], st[1], n); });
        setNodes(sc, 0, true); showResult(sc); return;
      }
      var t = 300;
      sc.steps.forEach(function (st, n) {
        var idx = sc.agents.indexOf(st[0]);
        later(function () { setNodes(sc, idx, false); addLine(st[0], st[1], n); }, t);
        t += st[2];
      });
      later(function () { setNodes(sc, 0, true); addLine('you', 'Waiting for your approval before anything goes out.', sc.steps.length, true); showResult(sc); }, t);
      if (auto) later(function () { if (auto) run((cur + 1) % S.length); }, t + 6500);
    }
    run(0);
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


  /* Visitor alert: approximate city and country (no IP stored or forwarded) sent to a private Discord channel, once per visit.
     Skipped when the browser sends Do Not Track or Global Privacy Control. Disclosed on the Privacy page. */
  (function () {
    var HOOK = 'https://discord.com/api/webhooks/1564245448460337202/FS-PdCPIvOi4lLIgIKN7sWHGkz5XVUkDLJw2Qys8352jEMHTGtFr8_W7D8okOYxHIBQS';
    if (!HOOK || /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) || location.protocol === 'file:') return;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    try { if (sessionStorage.getItem('nl_seen')) return; sessionStorage.setItem('nl_seen', '1'); } catch (e) {}
    fetch('https://ipapi.co/json/').then(function (r) { return r.json(); }).then(function (g) {
      var place = (g.city || 'Unknown city') + (g.region ? ', ' + g.region : '') + ', ' + (g.country_name || 'Unknown country');
      var time = ''; try { time = new Date().toLocaleString('en-GB', { timeZone: g.timezone || 'UTC', dateStyle: 'medium', timeStyle: 'short' }); } catch (e) {}
      var device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
      var src = 'Direct'; try { if (document.referrer) src = new URL(document.referrer).hostname; } catch (e) {}
      var page = location.pathname.replace(/^\//, '') || 'Home';
      return fetch(HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        username: 'Northlight visitors',
        embeds: [{ title: 'New visit to Northlight Agents', color: 0x1B46C9, fields: [
          { name: 'Location', value: place, inline: true }, { name: 'Local time', value: time || 'n/a', inline: true },
          { name: 'Device', value: device, inline: true }, { name: 'Page', value: page, inline: true }, { name: 'Came from', value: src, inline: true }
        ] }]
      }) });
    }).catch(function () {});
  })();

  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
})();
