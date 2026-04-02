(function () {
  function tick() {
    var el = document.getElementById("clock");
    if (!el) return;
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    el.textContent =
      String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  tick();
  setInterval(tick, 30_000);
})();

(function () {
  var sayBackdrop = document.getElementById("say-dialog-backdrop");
  var prefsBackdrop = document.getElementById("prefs-dialog-backdrop");
  var secretBackdrop = document.getElementById("secret-dialog-backdrop");

  function syncModalScrollLock() {
    var locked =
      (sayBackdrop && !sayBackdrop.hidden) ||
      (prefsBackdrop && !prefsBackdrop.hidden) ||
      (secretBackdrop && !secretBackdrop.hidden);
    document.body.style.overflow = locked ? "hidden" : "";
  }

  var input = document.getElementById("say-dialog-input");
  var iconWrap = document.querySelector(".desktop-page__icon-wrap");
  var prefsWrap = document.querySelector(".desktop-page__prefs-wrap");
  var secretWrap = document.querySelector(".desktop-page__secret-wrap");
  var sayCloseBtn = sayBackdrop
    ? sayBackdrop.querySelector(".wb-dialog__close")
    : null;
  var prefsCloseBtn = prefsBackdrop
    ? prefsBackdrop.querySelector(".wb-dialog__close")
    : null;
  var secretCloseBtn = secretBackdrop
    ? secretBackdrop.querySelector(".wb-dialog__close")
    : null;

  function openSayDialog() {
    if (!sayBackdrop) return;
    sayBackdrop.hidden = false;
    sayBackdrop.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    if (input) {
      input.focus();
    }
  }

  function closeSayDialog() {
    if (!sayBackdrop) return;
    sayBackdrop.hidden = true;
    sayBackdrop.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
  }

  function openPrefsDialog() {
    if (!prefsBackdrop) return;
    prefsBackdrop.hidden = false;
    prefsBackdrop.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    if (prefsCloseBtn) {
      prefsCloseBtn.focus();
    }
  }

  function closePrefsDialog() {
    if (!prefsBackdrop) return;
    prefsBackdrop.hidden = true;
    prefsBackdrop.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
    if (prefsWrap) {
      prefsWrap.focus();
    }
  }

  function openSecretDialog() {
    if (!secretBackdrop) return;
    secretBackdrop.hidden = false;
    secretBackdrop.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    if (secretCloseBtn) {
      secretCloseBtn.focus();
    }
  }

  function closeSecretDialog() {
    if (!secretBackdrop) return;
    secretBackdrop.hidden = true;
    secretBackdrop.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
    if (secretWrap) {
      secretWrap.focus();
    }
  }

  if (iconWrap) {
    iconWrap.addEventListener("click", function (e) {
      e.preventDefault();
      openSayDialog();
    });
  }

  if (prefsWrap) {
    prefsWrap.addEventListener("click", function (e) {
      e.preventDefault();
      openPrefsDialog();
    });
    prefsWrap.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openPrefsDialog();
    });
  }

  if (secretWrap) {
    secretWrap.addEventListener("click", function (e) {
      e.preventDefault();
      openSecretDialog();
    });
    secretWrap.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openSecretDialog();
    });
  }

  if (sayCloseBtn) {
    sayCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeSayDialog();
    });
  }

  if (prefsCloseBtn) {
    prefsCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePrefsDialog();
    });
  }

  if (secretCloseBtn) {
    secretCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeSecretDialog();
    });
  }

  if (sayBackdrop) {
    sayBackdrop.addEventListener("click", function (e) {
      if (e.target === sayBackdrop) {
        closeSayDialog();
      }
    });
  }

  if (prefsBackdrop) {
    prefsBackdrop.addEventListener("click", function (e) {
      if (e.target === prefsBackdrop) {
        closePrefsDialog();
      }
    });
  }

  if (secretBackdrop) {
    secretBackdrop.addEventListener("click", function (e) {
      if (e.target === secretBackdrop) {
        closeSecretDialog();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (secretBackdrop && !secretBackdrop.hidden) {
      e.preventDefault();
      closeSecretDialog();
      return;
    }
    if (prefsBackdrop && !prefsBackdrop.hidden) {
      e.preventDefault();
      closePrefsDialog();
      return;
    }
    if (sayBackdrop && !sayBackdrop.hidden) {
      e.preventDefault();
      closeSayDialog();
    }
  });

  /* SAM = 1982-era robot voice (C64); closest practical web match to “home computer” TTS — not Amiga narrator.device */
  var samInstance = null;
  var activeSpeak = null;

  function getSam() {
    if (typeof SamJs === "undefined") return null;
    if (!samInstance) {
      samInstance = new SamJs({
        speed: 88,
        pitch: 56,
        throat: 175,
        mouth: 178,
      });
    }
    return samInstance;
  }

  function speakRetro(text) {
    var sam = getSam();
    if (sam) {
      if (activeSpeak && typeof activeSpeak.abort === "function") {
        try {
          activeSpeak.abort("replaced");
        } catch (err) {
          /* ignore */
        }
      }
      activeSpeak = sam.speak(text);
      return activeSpeak.finally(function () {
        activeSpeak = null;
      });
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
      return new Promise(function (resolve) {
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 0.82;
        u.pitch = 0.55;
        u.onend = resolve;
        u.onerror = resolve;
        speechSynthesis.speak(u);
      });
    }
    return Promise.resolve();
  }

  var speakGeneration = 0;

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (!sayBackdrop || sayBackdrop.hidden) return;
      var t = input.value.trim();
      if (!t) return;
      var gen = ++speakGeneration;
      speakRetro(t).finally(function () {
        if (gen !== speakGeneration) return;
        input.value = "";
        input.focus();
      });
    });
  }
})();
