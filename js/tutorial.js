(function () {
  var STORAGE_KEY = 'quant-tutorial-dismissed';
  var currentStep = 0;
  var totalSteps = 7;

  function $(id) { return document.getElementById(id); }

  function isOpen() {
    return $('tutorial-overlay').classList.contains('open');
  }

  function open() {
    goTo(0);
    $('tutorial-overlay').classList.add('open');
  }

  function close() {
    $('tutorial-overlay').classList.remove('open');
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function goTo(step) {
    currentStep = step;
    var steps = document.querySelectorAll('.tutorial-step');
    steps.forEach(function (s, i) {
      s.classList.toggle('active', i === step);
    });
    renderDots();
    updateButtons();
  }

  function renderDots() {
    var dots = $('tutorial-dots');
    dots.innerHTML = '';
    for (var i = 0; i < totalSteps; i++) {
      var dot = document.createElement('div');
      dot.className = 'tutorial-dot' + (i === currentStep ? ' active' : '');
      dot.addEventListener('click', (function (idx) {
        return function () { goTo(idx); };
      })(i));
      dots.appendChild(dot);
    }
  }

  function updateButtons() {
    var prev = $('tutorial-prev');
    var next = $('tutorial-next');
    var nextSpan = next.querySelector('span');

    prev.style.visibility = currentStep === 0 ? 'hidden' : 'visible';

    if (currentStep === totalSteps - 1) {
      next.classList.add('primary');
      nextSpan.textContent = (typeof I18n !== 'undefined') ? I18n.t('tutorialDone') : 'Got it!';
      next.querySelector('span').setAttribute('data-i18n', 'tutorialDone');
    } else {
      next.classList.remove('primary');
      if (nextSpan) {
        nextSpan.textContent = (typeof I18n !== 'undefined') ? I18n.t('tutorialNext') : 'Next';
        nextSpan.setAttribute('data-i18n', 'tutorialNext');
      }
    }
  }

  function init() {
    $('btn-help').addEventListener('click', open);
    $('tutorial-close').addEventListener('click', close);
    $('tutorial-overlay').addEventListener('click', function (e) {
      if (e.target === $('tutorial-overlay')) close();
    });

    $('tutorial-prev').addEventListener('click', function () {
      if (currentStep > 0) goTo(currentStep - 1);
    });

    $('tutorial-next').addEventListener('click', function () {
      if (currentStep < totalSteps - 1) {
        goTo(currentStep + 1);
      } else {
        close();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && currentStep < totalSteps - 1) goTo(currentStep + 1);
      if (e.key === 'ArrowLeft' && currentStep > 0) goTo(currentStep - 1);
    });

    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(open, 600);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
