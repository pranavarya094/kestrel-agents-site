/* Northlight Agents — detailed visitor/interaction tracker (shared across site pages). */
(function () {
  'use strict';
  const SITE_ID = 'kestrel-agents-site';
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1564245448460337202/FS-PdCPIvOi4lLIgIKN7sWHGkz5XVUkDLJw2Qys8352jEMHTGtFr8_W7D8okOYxHIBQS';
  const DISCORD_ENABLED = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\//.test(DISCORD_WEBHOOK_URL);
  if (!DISCORD_ENABLED || location.protocol === 'file:' ||
      /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
      navigator.globalPrivacyControl === true) return;

  const started = Date.now(), MAX_EVENTS = 400, MAX_SENT_PER_TAB = 150;
  const events = [], waiting = [], scrollMarks = new Set();
  let visitorGeo = {}, geoReady = false, sending = false, sent = 0;
  let lastScroll = 0, lastError = 0, deepestScroll = 0;
  const allowed = new Set([
    'page_open','page_hidden','section_view','navigation','scroll_milestone','menu_toggle','theme_change',
    'cta_click','contact_link','simulator_scenario_select','simulator_approve','simulator_request_changes',
    'contact_form_submit','contact_form_success','contact_form_failure',
    'office_agent_select','office_pause','office_resume','office_speed_change','office_standup','office_task_submit',
    'clipflow_view_open','clipflow_upload_select','clipflow_settings_change',
    'script_error','media_error'
  ]);
  function field(value) {
    return String(value === null || value === undefined || value === '' ? 'Unknown' : value).slice(0,1024);
  }
  function referrer() {
    try {
      const u = new URL(document.referrer);
      return u.origin + u.pathname;
    } catch (_) { return 'Direct / none'; }
  }
  function preparePayload(event) {
    const geo = visitorGeo;
    const locationText = geo.city
      ? [geo.city,geo.region,geo.country_name].filter(Boolean).join(', ')
      : 'Unknown';
    const fields = [
      {name:'Location',value:field(locationText),inline:true},
      {name:'IP',value:field(geo.ip),inline:true},
      {name:'ISP',value:field(geo.org),inline:true},
      {name:'Page',value:field(location.pathname + location.hash),inline:true},
      {name:'Referrer',value:field(referrer()),inline:true},
      {name:'Language',value:field(navigator.language),inline:true},
      {name:'Screen',value:field(screen.width+'x'+screen.height),inline:true},
      {name:'Device / Browser',value:field(navigator.userAgent),inline:false}
    ];
    if (event.type !== 'page_open') {
      fields.push({name:'Event',value:field(event.type.replace(/_/g,' ')),inline:true});
      fields.push({name:'Time on page',value:Math.round(event.elapsed_ms/1000)+' seconds',inline:true});
      const details = Object.entries(event)
        .filter(([key]) => !['site_id','type','elapsed_ms'].includes(key))
        .map(([key,value]) => key.replace(/_/g,' ')+': '+value).join(' | ');
      if (details) fields.push({name:'Action detail',value:field(details),inline:false});
    }
    return {username:'Northlight Visitor Alerts',allowed_mentions:{parse:[]},embeds:[{
      title:event.type === 'page_open' ? 'New visit — Northlight Agents' : 'Northlight — '+event.type.replace(/_/g,' '),
      color:0x1B46C9,fields,timestamp:new Date().toISOString()
    }]};
  }
  function pump() {
    if (!geoReady || sending || !waiting.length || sent>=MAX_SENT_PER_TAB) return;
    sending = true;
    const event = waiting.shift();
    sent++;
    fetch(DISCORD_WEBHOOK_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(preparePayload(event)),
      keepalive:true
    }).then(response => {
      if (!response.ok) console.warn('Northlight Discord notification failed:',response.status);
    }).catch(error => {
      console.warn('Northlight Discord notification could not be delivered:',error);
    }).finally(() => {
      setTimeout(() => { sending = false; pump(); },650);
    });
  }
  function finishGeo(data) {
    if (geoReady) return;
    geoReady = true;
    visitorGeo = data && typeof data === 'object' && !data.error ? data : {};
    pump();
  }
  function record(type,details) {
    if (!allowed.has(type)) return;
    const event = {site_id:SITE_ID,type,elapsed_ms:Date.now()-started};
    if (details && typeof details === 'object') {
      for (const [key,value] of Object.entries(details)) {
        if (['section','mode','media','result','milestone'].includes(key) &&
            (typeof value === 'string' || typeof value === 'number')) {
          event[key] = String(value).slice(0,64);
        }
      }
    }
    events.push(event);
    if (events.length>MAX_EVENTS) events.shift();
    if (sent+waiting.length<MAX_SENT_PER_TAB) {
      waiting.push(event);
      pump();
    }
  }
  window.NorthlightTrack = record;
  window.NorthlightDiagnostics = Object.freeze({
    summary() {
      return {site_id:SITE_ID,total_events:events.length,
        event_counts:events.reduce((acc,ev)=>(acc[ev.type]=(acc[ev.type]||0)+1,acc),{})};
    },
    export() {
      const payload={site_id:SITE_ID,scope:'current browser tab only',generated_at:new Date().toISOString(),events};
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;link.download='northlight-local-events.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  fetch('https://ipapi.co/json/')
    .then(r => {if(!r.ok)throw new Error('Location lookup unavailable');return r.json();})
    .then(finishGeo).catch(()=>finishGeo({}));
  setTimeout(()=>finishGeo({}),4000);
  record('page_open');

  document.addEventListener('click',event => {
    const target=event.target instanceof Element ? event.target : null;
    if (!target) return;
    const link=target.closest('a[href]');
    if (link) {
      const href=link.getAttribute('href')||'';
      if (/^(mailto:|tel:)/.test(href)) record('contact_link',{section:href.split(':')[0]});
      else if (href.startsWith('#')) record('section_view',{section:href.slice(1)});
      else if (!/^https?:\/\//i.test(href)) record('navigation',{section:href.split('?')[0].split('#')[0]});
      if (link.matches('.btn')) record('cta_click',{section:(link.textContent||'').trim()});
    }
    if (target.closest('.menu')) record('menu_toggle');
    if (target.closest('.theme-toggle')) {
      record('theme_change',{mode:document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'});
    }
    const scenario=target.closest('#sim .chips button');
    if (scenario) record('simulator_scenario_select',{section:(scenario.textContent||'').trim()});
    const decision=target.closest('#result .acts button');
    if (decision) record(decision.classList.contains('alt')?'simulator_request_changes':'simulator_approve');
    const officePlay=target.closest('#playBtn');
    if (officePlay) record((officePlay.textContent||'').trim().toLowerCase()==='pause'?'office_pause':'office_resume');
    if (target.closest('#standupBtn')) record('office_standup');
    const speed=target.closest('[data-speed]');
    if (speed) record('office_speed_change',{mode:speed.dataset.speed});
    if (target.closest('#team button, #detail button[data-id]')) record('office_agent_select');
    const clipView=target.closest('#navList [data-view]');
    if (clipView) record('clipflow_view_open',{section:clipView.dataset.view});
  },true);
  document.addEventListener('submit',event => {
    const form=event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id==='contact-form') record('contact_form_submit');
    else if (form.id==='d-form') record('office_task_submit');
  },true);
  document.addEventListener('change',event => {
    const input=event.target;
    if (!(input instanceof Element)) return;
    if (input.matches('#fileInput')) record('clipflow_upload_select');
    if (input.matches('#clipCountSlider,#gradeSlider,#clipSort')) {
      record('clipflow_settings_change',{section:input.id});
    }
  },true);
  window.addEventListener('hashchange',() => {
    record('section_view',{section:(location.hash||'').slice(1)});
  });
  window.addEventListener('scroll',() => {
    if (Date.now()-lastScroll<1000) return;
    lastScroll=Date.now();
    const maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    deepestScroll=Math.max(deepestScroll,Math.round(window.scrollY/maxScroll*100));
    [25,50,75,100].forEach(milestone => {
      if (deepestScroll>=milestone && !scrollMarks.has(milestone)) {
        scrollMarks.add(milestone);
        record('scroll_milestone',{milestone});
      }
    });
  },{passive:true});
  document.addEventListener('visibilitychange',() => {
    if (document.visibilityState==='hidden') record('page_hidden');
  });
  window.addEventListener('error',() => {
    if (Date.now()-lastError>3000) {
      lastError=Date.now();
      record('script_error');
    }
  });
  document.addEventListener('error',event => {
    if (event.target instanceof HTMLMediaElement) record('media_error');
  },true);
})();
