// Language picker for the Panoply 360 tour.
// Tap a language: its gold border doubles, then the video plays on this page.
// "Languages" returns to the grid with the choice still marked.
// Without JavaScript the buttons fall back to opening YouTube directly.
(function () {
  var buttons = document.querySelectorAll('.lang[data-key]');
  var player = document.getElementById('player');
  var frame = document.getElementById('frame');
  var langLabel = document.getElementById('playerLang');
  var back = document.getElementById('back');
  var storeKey = 'hmane-video-lang:' + location.pathname;
  var SELECT_BEAT = 260; // ms the doubled border shows before the video opens

  function select(btn) {
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.toggle('is-selected', buttons[i] === btn);
  }

  function play(btn) {
    var src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(btn.getAttribute('data-yt')) +
      '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
    var f = document.createElement('iframe');
    f.src = src;
    f.title = btn.getAttribute('data-label') + ' video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', '');
    frame.innerHTML = '';
    frame.appendChild(f);
    langLabel.textContent = btn.getAttribute('data-label');
    document.body.classList.add('is-playing');
    player.hidden = false;
    window.scrollTo(0, 0);
    back.focus({ preventScroll: true });
  }

  function close() {
    frame.innerHTML = ''; // removing the iframe stops playback
    player.hidden = true;
    document.body.classList.remove('is-playing');
    var sel = document.querySelector('.lang.is-selected');
    if (sel) sel.focus({ preventScroll: true });
  }

  try {
    var saved = sessionStorage.getItem(storeKey);
    if (saved !== null) {
      var b = document.querySelector('.lang[data-key="' + saved + '"]');
      if (b) select(b);
    }
  } catch (e) {}

  var pending = null;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (ev) {
      ev.preventDefault();
      var btn = this;
      select(btn);
      try { sessionStorage.setItem(storeKey, btn.getAttribute('data-key')); } catch (e) {}
      clearTimeout(pending);
      pending = setTimeout(function () { play(btn); }, SELECT_BEAT);
    });
  }

  back.addEventListener('click', close);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !player.hidden) close();
  });
})();
