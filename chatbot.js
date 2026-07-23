/**
 * VIKASH PORTFOLIO — AI CHATBOT (ULTIMATE UPGRADE EDITION)
 * ✅ Conversation Memory & Session Persistence (localStorage)
 * ✅ Text-To-Speech Voice Synthesis (Web Speech API) with Siri Waveform Sync
 * ✅ Voice Input / Speech-to-Text Dictation (Web Speech Recognition API)
 * ✅ Clear Chat Memory Reset Action
 * ✅ Proactive Welcome Greeting (Auto-open after 8s) & Time-Based Greetings
 * ✅ Rich Interactive Contact Form Bubble & Cards
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════ */
  const GROQ_MODEL = 'llama-3.3-70b-versatile';
  const API_URL = '/api/chat';
  const PRODUCTION_API_URL = 'https://startupwithvikash.vercel.app';
  const LOCAL_API_URL = 'http://localhost:3000/api/chat';

  const SYSTEM_PROMPT = `You are Vikash's intelligent AI portfolio assistant. Your primary goal is to provide accurate, helpful, and professional information about Vikash Saravanan.

PERSONALITY:
- Be friendly, concise, and professional.
- Use emojis sparingly but effectively.
- Keep replies under 4 sentences unless listing items.
- If asked something unrelated to Vikash, politely steer the conversation back: "I'm focused on helping you learn about Vikash! Try asking about his skills, projects, or how to contact him. 😊"

VIKASH SARAVANAN — FULL PROFILE:
• Degree: B.Tech in AI & Data Science (2024–2028)
• College: Rathinam Technical Campus, Coimbatore
• Native: Karur, Tamil Nadu, India
• Email: vikash07052008@gmail.com | Phone: +91 9342877474
• LinkedIn: linkedin.com/in/vikash-saravanan-j7528
• GitHub: github.com/vikashsaravanann
• Instagram: @startupwithvikash

TECHNICAL SKILLS:
• Languages: Python, JavaScript, TypeScript, SQL, HTML/CSS
• AI/ML: PyTorch, TensorFlow, Computer Vision, NLP, LLMs, Generative AI
• Automation: n8n, web scraping, autonomous agents
• Data: Pandas, NumPy, Matplotlib, Power BI

PROJECTS (16 total):
Always mention the GitHub link when talking about a project.
1. Portfolio_Information: Personal portfolio with AI assistant. GitHub: github.com/vikashsaravanann/Portfolio_Information
2. HearWise Child Health: Mobile-first clinical hearing screening. GitHub: github.com/vikashsaravanann/hearwise-child-health
3. OpenEnv-Debugger: AI agent simulation (Meta Hackathon). GitHub: github.com/vikashsaravanann/OpenEnv-Debugger
4. AI Traffic Management System: Arduino LED control via YOLOv8. GitHub: github.com/vikashsaravanann/AI-Traffic-Management-system
5. Dropout Alert System: Edge AI predictive system. GitHub: github.com/vikashsaravanann/dropout-alert-system
6. IPL Data Analysis: Comprehensive EDA of IPL cricket data. GitHub: github.com/vikashsaravanann/IPL-Data-Analysis-Project
7. GameHub: Console-based Python arcade. GitHub: github.com/vikashsaravanann/gamehub
8. FCC Mean-Variance Calculator: Python statistical metrics. GitHub: github.com/vikashsaravanann/fcc-mean-variance-calculator
9. FCC Demographic Data Analyzer: 1994 US census dataset analysis. GitHub: github.com/vikashsaravanann/fcc-demographic-data-analyzer
10. FCC Medical Data Visualizer: Medical exam datasets using heatmaps. GitHub: github.com/vikashsaravanann/fcc-medical-data-visualizer
11. FCC Page View Time Series: Visualization of forum page views. GitHub: github.com/vikashsaravanann/fcc-page-view-time-series-visualizer
12. FCC Sea Level Predictor: Modeling predicting sea level rise. GitHub: github.com/vikashsaravanann/fcc-sea-level-predictor
13. Logic-Intelligence: Agency workflow layouts. GitHub: github.com/vikashsaravanann/Logic-Intelligence
14. BroadcastAI-Portfolio: AI broadcasting concept. GitHub: github.com/vikashsaravanann/BroadcastAI-Portfolio
15. Web-Development: Responsive single-page structures. GitHub: github.com/vikashsaravanann/Web-Development
16. portfolio.vikashsaravanan: Archived asset repository. GitHub: github.com/vikashsaravanann/portfolio.vikashsaravanan

ACHIEVEMENTS:
• Hackathon Finalist — Meta PyTorch (OpenEnv)
• 15+ Professional Certifications
• 5000+ Lines of Code written

AVAILABILITY:
• Open for Internships (Remote or Coimbatore)
• Interested in AI Engineering, Data Analysis, and Automation.`;

  /* ═══════════════════════════════════════════
     STATE MANAGEMENT & LOCAL STORAGE
     ═══════════════════════════════════════════ */
  let conversationHistory = [];
  const CHAT_VERSION = '1.3.3'; // Updated version

  try {
    const storedVer = localStorage.getItem('vikash_chat_version');
    if (storedVer !== CHAT_VERSION) {
      localStorage.removeItem('vikash_chat_history');
      localStorage.setItem('vikash_chat_version', CHAT_VERSION);
    } else {
      const stored = localStorage.getItem('vikash_chat_history');
      if (stored) {
        conversationHistory = JSON.parse(stored);
      }
    }
  } catch (e) {
    console.error('Failed to parse chat history', e);
  }

  /* ═══════════════════════════════════════════
     DOM ELEMENTS
     ═══════════════════════════════════════════ */
  const toggle     = document.getElementById('ai-chat-toggle');
  const panel      = document.getElementById('ai-chat-panel');
  const closeBtn   = document.getElementById('ai-chat-close');
  const resetBtn   = document.getElementById('ai-chat-reset');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl    = document.getElementById('chatInput');
  const sendBtn    = document.getElementById('chatSend');
  const chipsEl    = document.getElementById('chatChips');
  const micBtn     = document.getElementById('chatMic');
  const waveformEl = document.getElementById('chatWaveform');

  if (!toggle || !panel) return;

  // Speech recognition global variable
  let recognition = null;
  // Speech synthesis global variable
  let currentUtterance = null;

  /* ═══════════════════════════════════════════
     SPEECH TO TEXT (MICROPHONE DICTATION)
     ═══════════════════════════════════════════ */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      micBtn.classList.add('listening');
      inputEl.placeholder = 'Listening... Speak now';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputEl.value = transcript;
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Error: ', event.error);
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything about Vikash...';
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything about Vikash...';
    };

    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (micBtn.classList.contains('listening')) {
        try { recognition.stop(); } catch(err) {}
      } else {
        // Stop any text-to-speech playing
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        try { recognition.start(); } catch(err) {}
      }
    });
  } else {
    // Hide mic button if SpeechRecognition is not supported in browser
    if (micBtn) micBtn.style.display = 'none';
  }

  /* ═══════════════════════════════════════════
     INITIALIZE GREETINGS & MEMORY
     ═══════════════════════════════════════════ */
  function getDynamicGreeting() {
    const hour = new Date().getHours();
    let timeGreeting = "Hey there! 👋";
    if (hour >= 5 && hour < 12) timeGreeting = "Good morning! 🌅";
    else if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon! ☀️";
    else if (hour >= 17 && hour < 22) timeGreeting = "Good evening! 🌃";
    else timeGreeting = "Burning the midnight oil? 🌌";

    return `${timeGreeting} I'm Vikash's AI assistant. Ask me anything about his projects, skills, or certifications. I can read my answers out loud too!`;
  }

  function initChat() {
    messagesEl.innerHTML = '';
    if (conversationHistory.length > 0) {
      if (chipsEl) chipsEl.style.display = 'none';
      conversationHistory.forEach(msg => {
        addMessage(msg.content, msg.role, false);
      });
    } else {
      if (chipsEl) chipsEl.style.display = 'flex';
      const greeting = getDynamicGreeting();
      const msgWrap = addMessage(greeting, 'bot', false);
      const soundBtn = msgWrap.querySelector('.chat-sound-btn');
      if (soundBtn) {
        // We wait for a small delay to ensure voices are loaded
        setTimeout(() => speakMessage(greeting, soundBtn), 1000);
      }
    }
  }

  initChat();

  /* ═══════════════════════════════════════════
     CLEAR CHAT (RESET SYSTEM)
     ═══════════════════════════════════════════ */
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Clear entire conversation history?')) {
        // Cancel voice
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(err) {}
        }
        if (waveformEl) waveformEl.classList.remove('active');
        
        if (recognition) {
            try { recognition.stop(); } catch(err) {}
        }

        // Clear local storage and state
        try {
            localStorage.removeItem('vikash_chat_history');
        } catch(err) {
            console.warn('LocalStorage error', err);
        }
        conversationHistory = [];
        initChat();
      }
    });
  }

  /* ═══════════════════════════════════════════
     PROACTIVE AUTO-OPEN TIMER (8 seconds)
     ═══════════════════════════════════════════ */
  const autoOpenKey = 'vikash_chat_auto_opened';
  if (!sessionStorage.getItem(autoOpenKey) && conversationHistory.length === 0) {
    setTimeout(() => {
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        sessionStorage.setItem(autoOpenKey, 'true');
        setTimeout(() => inputEl.focus(), 300);
      }
    }, 8000);
  }

  /* ═══════════════════════════════════════════
     TOGGLE PANEL
     ═══════════════════════════════════════════ */
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      setTimeout(() => inputEl.focus(), 300);
    } else {
      if (window.speechSynthesis) {
          try { window.speechSynthesis.cancel(); } catch(err) {}
      }
      if (waveformEl) waveformEl.classList.remove('active');
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.remove('open');
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch(err) {}
    }
    if (waveformEl) waveformEl.classList.remove('active');
    if (recognition) {
        try { recognition.stop(); } catch(err) {}
    }
  });

  /* ═══════════════════════════════════════════
     QUICK ACTION CHIPS
     ═══════════════════════════════════════════ */
  if (chipsEl) {
    chipsEl.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = chip.getAttribute('data-msg');
        if (msg) triggerSend(msg);
      });
    });
  }

  /* ═══════════════════════════════════════════
     SEND MESSAGE LOGIC
     ═══════════════════════════════════════════ */
  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    triggerSend(inputEl.value);
  });
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSend(inputEl.value); });

  function triggerSend(text) {
    text = text.trim();
    if (!text) return;
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;
    if (micBtn) micBtn.disabled = true; // Disable mic while bot is responding

    // Add user message to UI and history
    addMessage(text, 'user', false);
    conversationHistory.push({ role: 'user', content: text });
    saveHistory();

    // Hide chips container once chat starts
    if (chipsEl) chipsEl.style.display = 'none';

    // Show typing dots
    const typingEl = addTyping();

    callBridge().then(reply => {
      typingEl.remove();
      // Print message with smooth typing animation
      addMessage(reply, 'bot', true);
      conversationHistory.push({ role: 'assistant', content: reply });
      saveHistory();
    }).catch((err) => {
      console.error('Chat error:', err);
      typingEl.remove();
      addMessage("Sorry, I'm having trouble connecting to Groq AI. 📧 vikash07052008@gmail.com", 'bot', false);
    }).finally(() => {

      inputEl.disabled = false;
      sendBtn.disabled = false;
      if (micBtn) micBtn.disabled = false; // Re-enable mic when bot is done
      inputEl.focus();
    });
  }

  function saveHistory() {
    try {
      localStorage.setItem('vikash_chat_history', JSON.stringify(conversationHistory));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }

  /* ═══════════════════════════════════════════
     TEXT TO SPEECH (VOICE RESPONSES & SIRI SYNC)
     ═══════════════════════════════════════════ */

  // Pre-load and cache the best available female voice
  let cachedFemaleVoice = null;

  // Siri-style female voice priority list (highest priority first)
  const PREFERRED_VOICES = [
    'samantha',          // macOS Siri
    'siri',              // Mobile Siri
    'google us english', // Chrome High-res
    'google uk english female',
    'microsoft zira',    // Windows 10/11
    'microsoft hazel',   // Windows UK
    'victoria',          // macOS Natural
    'alice',             // Italy/Intl
    'heather',
    'female',
  ];

  function selectBestFemaleVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    for (const preferred of PREFERRED_VOICES) {
      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes(preferred);
      });
      if (match) return match;
    }

    // Best effort: look for any voice with "female" in the name
    const anyFemale = voices.find(v => v.name.toLowerCase().includes('female'));
    if (anyFemale) return anyFemale;

    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  // Load voices as soon as they become available
  function loadVoices() {
    cachedFemaleVoice = selectBestFemaleVoice();
    if (cachedFemaleVoice) {
      console.log('🎙️ AI Voice selected:', cachedFemaleVoice.name, `(${cachedFemaleVoice.lang})`);
    }
  }

  // Voices load asynchronously — listen for the event
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speakMessage(text, buttonElement) {
    if (!window.speechSynthesis) return;

    // If currently speaking the SAME text, stop it
    if (window.speechSynthesis.speaking && currentUtterance && currentUtterance.text === text) {
      window.speechSynthesis.cancel();
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active');
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();
    document.querySelectorAll('.chat-sound-btn').forEach(btn => {
      btn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      btn.classList.remove('speaking');
    });

    // Clean emojis & formatting links out of speech text for better pronunciation
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
                          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Set the cached Siri-style female voice
    if (!cachedFemaleVoice) loadVoices(); // retry if not loaded yet
    if (cachedFemaleVoice) {
      utterance.voice = cachedFemaleVoice;
    }

    // Tune for clear, natural female Siri-style delivery
    utterance.pitch = 1.15;   // Slightly higher pitch for feminine clarity
    utterance.rate = 0.95;    // Slightly slower for professional clarity
    utterance.volume = 1.0;

    utterance.onstart = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-mute"></i> Mute';
      buttonElement.classList.add('speaking');
      if (waveformEl) waveformEl.classList.add('active'); // Activate glowing audio waveform
    };

    utterance.onend = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active'); // Disable waveform
    };

    utterance.onerror = () => {
      buttonElement.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
      buttonElement.classList.remove('speaking');
      if (waveformEl) waveformEl.classList.remove('active');
    };

    window.speechSynthesis.speak(utterance);
  }

  /* ═══════════════════════════════════════════
     RICH UI CARD & FORM GENERATOR
     ═══════════════════════════════════════════ */
  function getRichCardElement(text) {
    const lower = text.toLowerCase();
    const container = document.createElement('div');

    if (lower.includes('hearwise')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `
        <h4>🚀 HearWise Platform</h4>
        <p>AI-powered hearing screening & interactive gamified ocean platform designed for children.</p>
        <a href="index.html#hearwise" class="chat-rich-btn"><i class="fas fa-external-link-alt"></i> View Project details</a>
      `;
      return container;
    }
    if (lower.includes('certifications') || lower.includes('certification') || lower.includes('certs')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `
        <h4>🏆 Certificates Gallery</h4>
        <p>Explore Vikash's 15+ verified certifications in AI, Data Science & Networks.</p>
        <a href="certifications.html" class="chat-rich-btn"><i class="fas fa-award"></i> Open Gallery</a>
      `;
      return container;
    }
    if (lower.includes('contact') || lower.includes('email') || lower.includes('hire') || lower.includes('phone')) {
      container.className = 'chat-rich-card';
      container.innerHTML = `
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.25rem;">📩 Quick Contact</h4>
        <p style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.95rem; color: rgba(255, 255, 255, 0.9); line-height: 1.5; margin-bottom: 16px;">
          Hi, I am Vikash! If you have an opportunity or want to collaborate, fill out this form to contact me directly via WhatsApp, SMS, and Email.
        </p>
        <form class="chat-contact-form">
          <input type="text" class="chat-form-input chat-form-name" placeholder="Full Name" required>
          <input type="email" class="chat-form-input chat-form-email" placeholder="Email Address" required>
          <input type="text" class="chat-form-input chat-form-subject" placeholder="Subject (e.g. Internship)" required>
          <textarea class="chat-form-textarea chat-form-msg" placeholder="Describe your inquiry..." required></textarea>
          <button type="submit" class="chat-form-submit"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Send Message</button>
        </form>
      `;

      // Bind the form action logic
      const form = container.querySelector('.chat-contact-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.chat-form-submit');
        const name = form.querySelector('.chat-form-name').value;
        const email = form.querySelector('.chat-form-email').value;
        const subject = form.querySelector('.chat-form-subject').value;
        const msg = form.querySelector('.chat-form-msg').value;

        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const messageBody = `Hi Vikash,\n\nNew inquiry via AI Chatbot.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${msg}`;

        try {
            let url = '/api/contact';
            if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                url = 'http://localhost:3000/api/contact';
            } else if (window.location.hostname.includes('github.io') || 
                       (window.location.hostname && window.location.hostname !== new URL(PRODUCTION_API_URL).hostname)) {
                url = PRODUCTION_API_URL + '/api/contact';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message: messageBody })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                form.reset();
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Sent!';
                addMessage("Your message has been successfully delivered to Vikash! 🚀✅", 'bot', false);
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (err) {
            console.warn('API delivery failed:', err);
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
            addMessage("Delivery failed. I've opened your mail app to complete the email manually. 📧", 'bot', false);
            setTimeout(() => {
                window.location.href = `mailto:vikash07052008@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;
            }, 800);
        }

        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px;"></i>Send Message';
            submitBtn.disabled = false;
        }, 4000);
      });

      return container;
    }
    return null;
  }

  /* ═══════════════════════════════════════════
     DOM CREATION HELPERS
     ═══════════════════════════════════════════ */
  /* ═══════════════════════════════════════════
     MARKDOWN TO HTML PARSER
     Converts **bold**, [link](url), and \n to styled HTML
     ═══════════════════════════════════════════ */
  function parseMarkdown(text) {
    return text
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links: [label](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1 <i class="fas fa-external-link-alt" style="font-size:0.65rem;"></i></a>')
      // Newlines
      .replace(/\n/g, '<br>');
  }

  function addMessage(content, role, animate = false) {
    // Map OpenAI/Groq 'assistant' role to 'bot' styling class and TTS features
    const uiRole = role === 'assistant' ? 'bot' : role;
    const wrap = document.createElement('div');
    wrap.className = `chat-msg ${uiRole}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    wrapper.appendChild(bubble);
    wrap.appendChild(wrapper);
    messagesEl.appendChild(wrap);

    if (uiRole === 'bot') {
      // Add sound text-to-speech button under bubble
      const soundBtn = document.createElement('button');
      soundBtn.className = 'chat-sound-btn';
      soundBtn.setAttribute('title', 'Read aloud');
      soundBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speak</span>';
      soundBtn.addEventListener('click', () => speakMessage(content, soundBtn));
      wrapper.appendChild(soundBtn);
    }

    if (animate) {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        // Stream raw text first, then parse markdown at the end to avoid broken mid-tag renders
        bubble.textContent = content.slice(0, i);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        if (i >= content.length) {
          clearInterval(interval);
          // Now render with Markdown once streaming is complete
          bubble.innerHTML = parseMarkdown(content);
          // Check and append rich interactive cards / form if applicable
          const card = getRichCardElement(content);
          if (card) {
            wrapper.appendChild(card);
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        }
      }, 15);
    } else {
      bubble.innerHTML = parseMarkdown(content);
      // Append rich cards immediately for loaded history
      const card = getRichCardElement(content);
      if (card) {
        wrapper.appendChild(card);
      }
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = '<div class="msg-wrapper"><div class="msg-bubble"><span class="typing-dots-chat"><span></span><span></span><span></span></span></div></div>';
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  /* ═══════════════════════════════════════════
     API BRIDGE CALL WITH MULTI-TURN MEMORY
     ═══════════════════════════════════════════ */
  async function callBridge() {
    const relevantHistory = conversationHistory.slice(-10);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...relevantHistory
    ];

    const body = { model: GROQ_MODEL, messages };


    let url = API_URL;
    let isLocal = false;

    // Check protocol and hostname to choose the appropriate API endpoint
    if (window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      url = LOCAL_API_URL;
      isLocal = true;
    } else if (window.location.hostname.includes('github.io') ||
               (window.location.hostname && window.location.hostname !== new URL(PRODUCTION_API_URL).hostname)) {
      // Route to production API bridge for GitHub Pages and custom domains
      url = PRODUCTION_API_URL + API_URL;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // If local API call fails, fall back to the production API bridge
        if (isLocal) {
          console.warn('Local API unavailable, falling back to production API bridge...');
          return await callProductionBridge(body);
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      return extractContent(data);
    } catch (err) {
      // Catch network/connection errors (e.g. local server not running)
      if (isLocal) {
        console.warn('Local API connection failed, falling back to production API bridge...', err);
        try {
          return await callProductionBridge(body);
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  async function callProductionBridge(body) {
    const res = await fetch(PRODUCTION_API_URL + API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Production API bridge error');
    }
    const data = await res.json();
    return extractContent(data);
  }

  function extractContent(data) {
    // Robust extraction for OpenAI/Groq response format
    const content = data.choices?.[0]?.message?.content || 
                    data.message?.content ||
                    data.choices?.[0]?.text ||
                    data.response ||
                    data.message;
    
    return content || "I'm not sure how to answer that right now. Please try again or contact Vikash directly!";
  }

})();
