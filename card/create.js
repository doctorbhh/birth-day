

(function () {
  'use strict';

  const form = document.getElementById('create-card-form');
  const stateForm = document.getElementById('state-form');
  const stateEnvelope = document.getElementById('state-envelope');
  const stateLink = document.getElementById('state-link');

  const miniCard = document.getElementById('mini-card');
  const miniCardName = document.getElementById('mini-card-name');
  const envelopeFlap = document.getElementById('envelope-flap');
  const envelopeSeal = document.getElementById('envelope-seal');
  const envelopeScene = document.querySelector('.envelope-scene');
  const envelopeStatus = document.getElementById('envelope-status');

  const linkInput = document.getElementById('link-input');
  const copyBtn = document.getElementById('copy-btn');
  const copyIcon = document.getElementById('copy-icon');
  const copyFeedback = document.getElementById('copy-feedback');
  const previewBtn = document.getElementById('preview-btn');
  const newCardBtn = document.getElementById('new-card-btn');

  const messageField = document.getElementById('message');
  const charCounter = document.getElementById('char-counter');


  if (messageField && charCounter) {
    messageField.addEventListener('input', function () {
      const len = this.value.length;
      charCounter.textContent = `${len} / 150`;
      if (len > 150) {
        charCounter.style.color = 'var(--error)';
      } else {
        charCounter.style.color = 'var(--outline)';
      }
    });
    messageField.setAttribute('maxlength', '150');
  }


  async function encodeCardData(data) {
    if (window.supabaseClient) {
      const shortId = Math.random().toString(36).substring(2, 8);
      const { error } = await window.supabaseClient
        .from('cards')
        .insert([{
          id: shortId,
          name: data.name || '',
          age: data.age || '',
          sender: data.sender || '',
          message: data.message || '',
          audio: data.audio || '',
          audio_start: data.audioStart || '',
          long_msg: data.longMsg || false,
          long_msg_txt: data.longMsgTxt || ''
        }]);
      
      if (!error) return shortId;
      console.error('Supabase error:', error);
    }
    
    const parts = [
      data.name || '',
      data.age || '',
      data.sender || '',
      data.message || '',
      data.audio || '',
      data.audioStart || '',
      data.longMsg ? '1' : '0',
      data.longMsgTxt || ''
    ];
    while (parts.length > 0 && (parts[parts.length - 1] === '' || parts[parts.length - 1] === '0')) {
      parts.pop();
    }
    const compact = parts.join('|');
    return LZString.compressToEncodedURIComponent(compact);
  }

  async function buildLink(data) {
    const encoded = await encodeCardData(data);
    const base = window.location.href.replace(/\/[^/]*$/, '/');
    return `${base}card.html#${encoded}`;
  }

  function showState(state) {
    stateForm.classList.add('hidden');
    stateEnvelope.classList.add('hidden');
    stateLink.classList.add('hidden');
    state.classList.remove('hidden');
  }

  function runEnvelopeAnimation(data, generatedLink) {
    showState(stateEnvelope);

    miniCardName.textContent = `🎂 ${data.name}`;

    miniCard.classList.remove('slide-in', 'inside');
    envelopeFlap.classList.remove('closed');
    envelopeSeal.classList.remove('show');
    envelopeScene.classList.remove('fly-away');
    envelopeStatus.textContent = 'Preparing your card…';

    const timeline = [
      {
        delay: 600, action: () => {
          miniCard.classList.add('slide-in');
          envelopeStatus.textContent = 'Sliding card into envelope…';
        }
      },
      {
        delay: 1400, action: () => {
          miniCard.classList.add('inside');
        }
      },
      {
        delay: 1800, action: () => {
          envelopeFlap.classList.add('closed');
          envelopeStatus.textContent = 'Sealing with love…';
        }
      },
      {
        delay: 2500, action: () => {
          envelopeSeal.classList.add('show');
        }
      },
      {
        delay: 3200, action: () => {
          envelopeScene.classList.add('fly-away');
          envelopeStatus.textContent = 'Sending magic your way!';
        }
      },
      {
        delay: 4800, action: () => {
          showLinkState(generatedLink);
        }
      },
    ];

    timeline.forEach(step => {
      setTimeout(step.action, step.delay);
    });
  }

  function showLinkState(link) {
    showState(stateLink);
    linkInput.value = link;
    previewBtn.href = link;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('recipient-name').value.trim();
    const age = document.getElementById('age').value.trim();
    const sender = document.getElementById('sender-name').value.trim();
    const message = document.getElementById('message').value.trim();
    const audio = document.getElementById('audio-url').value.trim();
    const audioStart = document.getElementById('audio-start').value.trim();
    const longMsg = document.getElementById('long-msg').checked;
    const longMsgTxt = document.getElementById('long-message').value.trim();

    if (!name || !sender || !message) return;

    const data = { name, age: age || '', sender, message, audio: audio || '', audioStart: audioStart || '', longMsg, longMsgTxt };
    const link = await buildLink(data);

    runEnvelopeAnimation(data, link);
  });

  copyBtn.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(linkInput.value);
      copyIcon.textContent = 'check';
      copyFeedback.classList.remove('hidden');

      setTimeout(() => {
        copyIcon.textContent = 'content_copy';
        copyFeedback.classList.add('hidden');
      }, 2500);
    } catch (err) {
      linkInput.select();
      document.execCommand('copy');
      copyIcon.textContent = 'check';
      setTimeout(() => { copyIcon.textContent = 'content_copy'; }, 2000);
    }
  });

  newCardBtn.addEventListener('click', function () {
    showState(stateForm);
    form.reset();
    charCounter.textContent = '0 / 500';
  });

})();
