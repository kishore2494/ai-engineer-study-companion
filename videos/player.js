/* Explainer videos: reads videos/manifest.json ({id: {d: seconds, v: version}}) and adds a dropdown
   player to every topic that has a video. New videos appear automatically when the manifest updates. */
(function () {
  var BASE = 'videos/';
  var PLAY = '<svg viewBox="0 0 10 10"><path d="M1 0.5 L9.5 5 L1 9.5 Z"/></svg>';
  var CHEV = '<svg class="vchev" viewBox="0 0 12 12"><path d="M2.5 4.5 L6 8 L9.5 4.5"/></svg>';
  function fmt(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function speedPref() { try { return parseFloat(localStorage.getItem('sc-vspeed')) || 1; } catch (e) { return 1; } }
  function ccPref() { try { return localStorage.getItem('sc-vcc') === '1'; } catch (e) { return false; } }

  function buildPanel(id, meta, head) {
    var q = '?v=' + (meta.v || 1);
    var panel = document.createElement('div');
    panel.className = 'vpanel';
    panel.innerHTML =
      '<div class="vinner"><div class="vframe">' +
      '<video controls playsinline preload="metadata" poster="' + BASE + id + '.jpg' + q + '">' +
      '<source src="' + BASE + id + '.mp4' + q + '" type="video/mp4">' +
      '<track kind="captions" srclang="en" label="English" src="' + BASE + id + '.vtt' + q + '">' +
      '</video>' +
      '<div class="vbar"><span class="vlabel">Narrated explainer · ' + fmt(meta.d) + '</span>' +
      '<button type="button" data-cc>CC</button>' +
      '<button type="button" data-s="1">1×</button><button type="button" data-s="1.25">1.25×</button>' +
      '<button type="button" data-s="1.5">1.5×</button><button type="button" data-s="1.75">1.75×</button>' +
      '</div></div></div>';
    head.insertAdjacentElement('afterend', panel);
    var video = panel.querySelector('video');
    var ccBtn = panel.querySelector('[data-cc]');
    function setSpeed(s) {
      video.playbackRate = s;
      panel.querySelectorAll('[data-s]').forEach(function (b) { b.classList.toggle('on', parseFloat(b.dataset.s) === s); });
      try { localStorage.setItem('sc-vspeed', String(s)); } catch (e) {}
    }
    function setCC(on) {
      if (video.textTracks[0]) video.textTracks[0].mode = on ? 'showing' : 'hidden';
      ccBtn.classList.toggle('on', on);
      try { localStorage.setItem('sc-vcc', on ? '1' : '0'); } catch (e) {}
    }
    panel.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { setSpeed(parseFloat(b.dataset.s)); }); });
    ccBtn.addEventListener('click', function () { setCC(!ccBtn.classList.contains('on')); });
    video.addEventListener('loadedmetadata', function () { setCC(ccPref()); });
    video.addEventListener('play', function () { if (video.playbackRate !== speedPref()) setSpeed(speedPref()); });
    setSpeed(speedPref());
    setCC(ccPref());
    return panel;
  }

  function init(M) {
    var ids = Object.keys(M || {});
    if (!ids.length) return;
    document.querySelectorAll('section.topic').forEach(function (sec) {
      var meta = M[sec.id];
      var head = sec.querySelector('.topic-head');
      if (!meta || !head || head.querySelector('.vbtn')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vbtn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Watch the narrated explainer video for this topic');
      btn.innerHTML = '<span class="vplay">' + PLAY + '</span><span>Watch video</span><span class="vdur">' + fmt(meta.d) + '</span>' + CHEV;
      head.appendChild(btn);
      var panel = null;
      btn.addEventListener('click', function () {
        if (!panel) panel = buildPanel(sec.id, meta, head);
        var open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        var v = panel.querySelector('video');
        if (open) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
      });
    });
    ids.forEach(function (id) {
      var a = document.querySelector('.toc-row a[href="#' + id + '"]');
      if (a && !a.querySelector('.vdot')) a.insertAdjacentHTML('beforeend', '<span class="vdot" title="Video available">▶</span>');
    });
    // only one video plays at a time
    document.addEventListener('play', function (e) {
      document.querySelectorAll('.vpanel video').forEach(function (v) { if (v !== e.target) v.pause(); });
    }, true);
  }

  fetch(BASE + 'manifest.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(init)
    .catch(function () {});
})();
