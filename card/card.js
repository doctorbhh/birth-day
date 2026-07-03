

(function () {
  'use strict';

  const candleRow = document.getElementById('candle-row');
  const cakeContainer = document.getElementById('cake-container');
  const blowPrompt = document.getElementById('blow-prompt');
  const micBtn = document.getElementById('mic-btn');
  const cardPlaceholder = document.getElementById('card-placeholder');
  const cardMessage = document.getElementById('card-message');
  const greetingName = document.getElementById('greeting-name');
  const greetingText = document.getElementById('greeting-text');
  const greetingSender = document.getElementById('greeting-sender');
  const heartfeltBtn = document.getElementById('heartfelt-btn');
  const ageBadge = document.getElementById('age-badge');
  const ageNumber = document.getElementById('age-number');
  const wishOverlay = document.getElementById('wish-overlay');
  const wishCloseBtn = document.getElementById('wish-close-btn');
  const audioPlayer = document.getElementById('audio-player');
  const audioElement = document.getElementById('audio-element');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');
  const greetingCard = document.getElementById('greeting-card');
  const coverPage = document.getElementById('cover-page');

  let isBlown = false;
  let cardData = null;
  let isPlaying = false;

  function parsePipeFormat(str) {
    const parts = str.split('|');
    return {
      name: parts[0] || '',
      age: parts[1] || '',
      sender: parts[2] || '',
      message: parts[3] || '',
      audio: parts[4] || '',
      audioStart: parts[5] || '',
      longMsg: parts[6] === '1',
      longMsgTxt: parts[7] || ''
    };
  }

  async function decodeCardData() {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;

    try {
      if (hash.length === 6 && window.supabaseClient) {
        const { data, error } = await window.supabaseClient
          .from('cards')
          .select('*')
          .eq('id', hash)
          .single();
        
        if (!error && data) {
          return {
            name: data.name,
            age: data.age,
            sender: data.sender,
            message: data.message,
            audio: data.audio,
            audioStart: data.audio_start,
            longMsg: data.long_msg,
            longMsgTxt: data.long_msg_txt
          };
        }
      }

      const decompressed = LZString.decompressFromEncodedURIComponent(hash);
      if (decompressed) {
        if (decompressed.startsWith('{')) {
          return JSON.parse(decompressed);
        }
        return parsePipeFormat(decompressed);
      }

      let b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to decode card data:', e);
      return null;
    }
  }

  function generateCandles(age) {
    candleRow.innerHTML = '';

    const digits = String(age || 5).split('').map(Number);

    digits.forEach((digit, i) => {
      const candle = document.createElement('div');
      candle.className = 'number-candle';
      candle.style.animationDelay = `${1.2 + i * 0.2}s`;

      const flame = document.createElement('div');
      flame.className = 'candle-flame';
      const flameInner = document.createElement('div');
      flameInner.className = 'candle-flame-inner';
      flameInner.style.animationDelay = `${Math.random() * 0.2}s`;
      flame.appendChild(flameInner);

      const img = document.createElement('img');
      img.src = `img/${digit}.png`;
      img.alt = `Candle ${digit}`;
      img.draggable = false;

      candle.appendChild(flame);
      candle.appendChild(img);
      candleRow.appendChild(candle);
    });
  }

  function parseTimestamp(ts) {
    if (!ts) return 0;
    const parts = ts.split(':');
    if (parts.length === 2) {
      return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    }
    return parseInt(ts) || 0;
  }

  function blowCandles() {
    if (isBlown) return;
    isBlown = true;
    
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }

    const candles = document.querySelectorAll('.number-candle');

    if (cardData && cardData.audio) {
      playAudio();
    }

    candles.forEach((candle, i) => {
      const delay = 100 + i * 200;
      setTimeout(() => {
        const flame = candle.querySelector('.candle-flame');
        if (flame) {
          flame.classList.add('blown');
        }

        const smoke = document.createElement('div');
        smoke.className = 'smoke-puff';
        candle.appendChild(smoke);

        setTimeout(() => smoke.remove(), 1200);
      }, delay);
    });

    blowPrompt.style.opacity = '0';
    setTimeout(() => { blowPrompt.style.display = 'none'; }, 500);

    setTimeout(() => {
      triggerCelebration();
    }, 1000);
  }

  function triggerCelebration() {
    fireConfetti();

    setTimeout(() => {
      wishOverlay.classList.remove('hidden');
    }, 400);
  }

  function fireConfetti() {
    if (typeof confetti !== 'function') return;

    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ['#8127cf', '#6BA3DB', '#cca731', '#ff7c66', '#f0dbff', '#eac24a'];

    (function frame() {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors: colors,
        gravity: 0.8,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  function revealMessage() {
    if (!cardData) return;

    greetingName.textContent = `Happy Birthday, ${cardData.name}!`;
    greetingText.textContent = cardData.message;
    greetingSender.textContent = `— With love, ${cardData.sender}`;

    cardPlaceholder.classList.add('hidden');
    cardMessage.classList.remove('hidden');

    if (cardData.age) {
      ageNumber.textContent = cardData.age;
      ageBadge.classList.remove('hidden');
    }

    if (cardData.longMsg) {
      heartfeltBtn.classList.remove('hidden');
    }
  }

  function playAudio() {
    if (!audioElement.src) return;

    const startSec = parseTimestamp(cardData ? cardData.audioStart : '');
    if (startSec > 0 && Math.abs(audioElement.currentTime - startSec) > 1) {
      audioElement.currentTime = startSec;
    }

    audioElement.play().then(() => {
      isPlaying = true;
      audioIcon.textContent = 'pause';
      audioLabel.classList.add('playing');
    }).catch(err => {
      console.warn('Audio autoplay blocked:', err);
    });
  }

  function toggleAudio() {
    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
      audioIcon.textContent = 'play_arrow';
      audioLabel.classList.remove('playing');
    } else {
      playAudio();
    }
  }

  audioToggle.addEventListener('click', toggleAudio);

  if (coverPage && greetingCard) {
    coverPage.addEventListener('click', function () {
      greetingCard.classList.add('is-open');
      if (typeof updateScale === 'function') updateScale();
    });
  }
  
  const navCake = document.getElementById('nav-cake');
  const navMessage = document.getElementById('nav-message');
  
  navMessage.addEventListener('click', () => {
    greetingCard.classList.add('view-left-page');
    navMessage.classList.add('active');
    navCake.classList.remove('active');
  });

  navCake.addEventListener('click', () => {
    greetingCard.classList.remove('view-left-page');
    navCake.classList.add('active');
    navMessage.classList.remove('active');
  });

  wishCloseBtn.addEventListener('click', function () {
    wishOverlay.classList.add('hidden');
    revealMessage();
    
    if (window.innerWidth <= 960) {
      document.getElementById('mobile-nav').classList.remove('hidden');
      navMessage.click();
    }

    releaseBalloons();

    document.querySelectorAll('.party-dot').forEach(el => {
      el.style.transition = 'opacity 1s ease';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    });
  });

  if (heartfeltBtn) {
    heartfeltBtn.addEventListener('click', function () {
      const hash = window.location.hash;
      let targetUrl = `heartfelt.html${hash}`;

      if (audioElement && !audioElement.paused) {
        const currentTime = audioElement.currentTime;
        targetUrl += (hash.includes('?') ? '&' : '?') + `t=${currentTime}`;
      }

      window.location.href = targetUrl;
    });
  }

  function releaseBalloons() {
    const colors = ['#8127cf', '#6BA3DB', '#cca731', '#ff7c66', '#f0dbff', '#eac24a', '#FF3366', '#33CC99'];
    const container = document.body;

    for (let i = 0; i < 25; i++) {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';

      const color = colors[Math.floor(Math.random() * colors.length)];
      balloon.style.backgroundColor = color;
      balloon.style.setProperty('--balloon-color', color);

      const left = Math.random() * 100;
      const duration = 4 + Math.random() * 5;
      const delay = Math.random() * 1.5;
      const scale = 0.6 + Math.random() * 0.6;

      balloon.style.left = `${left}vw`;
      balloon.style.animationDuration = `${duration}s`;
      balloon.style.animationDelay = `${delay}s`;
      balloon.style.setProperty('--scale', scale);

      container.appendChild(balloon);

      balloon.addEventListener('click', function (e) {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 20,
            spread: 40,
            origin: {
              x: e.clientX / window.innerWidth,
              y: e.clientY / window.innerHeight
            },
            colors: [color]
          });
        }
        balloon.remove();
      });

      setTimeout(() => {
        if (balloon.parentNode) {
          balloon.remove();
        }
      }, (duration + delay) * 1000);
    }
  }

  let audioContext, analyser, micStream;

  micBtn.addEventListener('click', async function () {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream = stream;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;

      micBtn.textContent = '🎙 Listening…';
      micBtn.classList.add('active');

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      let loudFrames = 0;
      const FRAMES_NEEDED = 4;
      const RMS_THRESHOLD = 0.06;

      function detectBlow() {
        if (isBlown) {
          if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
          }
          return;
        }

        analyser.getFloatTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        if (rms > RMS_THRESHOLD) {
          loudFrames++;
          if (loudFrames >= FRAMES_NEEDED) {
            blowCandles();
            return;
          }
        } else {
          loudFrames = 0;
        }

        requestAnimationFrame(detectBlow);
      }

      detectBlow();
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Microphone access denied. You can still click the cake to blow out the candles!');
    }
  });


  function updateScale() {
    const scaler = document.querySelector('.card-scaler');
    if (!scaler) return;
    
    const greetingCard = document.getElementById('greeting-card');
    const isOpen = greetingCard && greetingCard.classList.contains('is-open');
    
    // Always fit just one 450px page on mobile. Only use 900px on desktop when open.
    const isMobile = window.innerWidth <= 960;
    const effectiveWidth = isMobile ? 450 : (isOpen ? 900 : 450);
    const padding = window.innerWidth <= 480 ? 24 : 48;
    
    if (isMobile) {
      const scaleW = (window.innerWidth - padding) / effectiveWidth;
      const scaleH = (window.innerHeight - 120) / 600; 
      const scale = Math.min(scaleW, scaleH);
      
      scaler.style.transition = 'transform 1s cubic-bezier(0.645, 0.045, 0.355, 1), margin-bottom 1s cubic-bezier(0.645, 0.045, 0.355, 1)';
      scaler.style.transform = `scale(${scale})`;
      scaler.style.marginBottom = `${-600 * (1 - scale)}px`;
    } else {
      scaler.style.transition = 'none';
      scaler.style.transform = 'none';
      scaler.style.marginBottom = '0';
    }
  }

  window.addEventListener('resize', updateScale);

  async function init() {
    updateScale();
    cardData = await decodeCardData();

    if (!cardData) {
      cardData = {
        name: 'Friend',
        age: '5',
        sender: 'JoyfulWishes',
        message: 'Wishing you a day filled with joy, laughter, and all your favorite things.\n\nMay this year bring you closer to your dreams!',
      };
    }

    document.title = `🎂 Happy Birthday ${cardData.name}! — JoyfulWishes`;

    const age = parseInt(cardData.age) || 5;
    generateCandles(age);

    if (cardData.audio) {
      audioElement.src = cardData.audio;
      audioElement.preload = 'auto';
      audioElement.load();
      audioPlayer.classList.remove('hidden');
    }
  }

  init();

})();
