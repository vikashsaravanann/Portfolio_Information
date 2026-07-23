document.addEventListener('DOMContentLoaded', () => {
    
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Lazy-load images to improve performance (keep first 2 eager for LCP)
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach((img, index) => {
        img.loading = index < 2 ? 'eager' : 'lazy';
    });

    // Hamburger Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
            });
        });
    }



    // Project Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.deep-dive-card[data-category]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            projectCards.forEach(card => {
                const categories = card.dataset.category.split(' ');
                if (filter === 'all' || categories.includes(filter)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });



    // Intersection Observer for Fade-up and Fade-left Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        let delay = 0;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Apply a staggered delay
                entry.target.style.transitionDelay = `${delay}s`;
                entry.target.classList.add('visible');
                delay += 0.15;
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .fade-left');
    animatedElements.forEach(el => observer.observe(el));

    // Intersection Observer for Skill Progress Bars
    const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.getAttribute('data-progress');
                progressBar.style.width = `${targetWidth}%`;
                observer.unobserve(progressBar);
            }
        });
    }, observerOptions);

    const progressBars = document.querySelectorAll('.skill-progress');
    progressBars.forEach(bar => progressObserver.observe(bar));

    // ==============================
    // MULTI-CHANNEL CONTACT FORM
    // EmailJS (real email) + WhatsApp + SMS
    // ==============================

    // Toast notification helper
    function showContactToast(message, isError) {
        let toast = document.querySelector('.contact-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'contact-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
            toast.style.boxShadow = '0 8px 30px rgba(220, 38, 38, 0.4)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #059669, #10b981)';
            toast.style.boxShadow = '0 8px 30px rgba(5, 150, 105, 0.4)';
        }
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4500);
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('contactSubmitBtn');
            const btnContent = submitBtn.querySelector('.btn-content');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            submitBtn.disabled = true;
            btnContent.style.display = 'none';
            btnLoader.style.display = 'inline-flex';

            const name = document.getElementById('cf-name').value.trim();
            const email = document.getElementById('cf-email').value.trim();
            const phone = document.getElementById('cf-phone') ? document.getElementById('cf-phone').value.trim() : '';
            const subject = document.getElementById('cf-subject') ? document.getElementById('cf-subject').value : 'General Inquiry';
            const message = document.getElementById('cf-message').value.trim();

            const messageBody = `Hi Vikash,\n\nNew inquiry from your portfolio website.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${subject}\n\nMessage:\n${message}`;

            try {
                const PRODUCTION_API_URL = 'https://startupwithvikash.vercel.app';
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
                    showContactToast('Message successfully sent to Vikash!', false);
                    contactForm.reset();
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
            } catch (err) {
                console.warn('API delivery failed:', err);
                showContactToast('Delivery failed. Opening your mail app...', true);
                setTimeout(() => {
                    window.location.href = `mailto:vikash07052008@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;
                }, 800);
            }

            btnLoader.style.display = 'none';
            btnContent.style.display = 'inline-flex';
            submitBtn.disabled = false;
        });
    }

    // Typewriter effect for Hero section
    const typewriterElement = document.querySelector('.typewriter');
    const words = ["Prompt Engineer", "Web Developer", "AI Engineer"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeEffect() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end of word
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before typing next word
        }

        setTimeout(typeEffect, typeSpeed);
    }

    // Start typewriter effect
    setTimeout(typeEffect, 1000);

    // Smooth scrolling for anchor links (fallback for browsers without CSS smooth scroll)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==============================
    // GITHUB LIVE STATS FETCHER
    // ==============================
    const GITHUB_USERNAME = 'vikashsaravanann';

    // Language color map
    const langColors = {
        'JavaScript': '#f1e05a', 'Python': '#3572A5', 'HTML': '#e34c26',
        'CSS': '#563d7c', 'TypeScript': '#3178c6', 'Jupyter Notebook': '#DA5B0B',
        'Java': '#b07219', 'C++': '#f34b7d', 'C': '#555555', 'Shell': '#89e051'
    };

    // Animate counter
    function animateCount(el, target) {
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current;
        }, 30);
    }

    async function fetchGitHubStats() {
        try {
            // Fetch user profile
            const userRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
            const user = await userRes.json();

            // Fetch all repos
            const reposRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
            const repos = await reposRes.json();

            if (!Array.isArray(repos)) return;

            // Calculate totals
            const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
            const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

            // Animate stats
            animateCount(document.getElementById('gh-repos'), user.public_repos || repos.length);
            animateCount(document.getElementById('gh-stars'), totalStars);
            animateCount(document.getElementById('gh-followers'), user.followers || 0);
            animateCount(document.getElementById('gh-forks'), totalForks);

            // Render top repos (sorted by stars, then updated)
            const topRepos = repos
                .filter(r => !r.fork)
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 6);

            const grid = document.getElementById('ghReposGrid');
            if (grid) {
                grid.innerHTML = topRepos.map(r => `
                    <a href="${r.html_url}" target="_blank" class="gh-repo-card">
                        <h5><i class="fas fa-book" style="margin-right:6px; font-size:0.85rem;"></i>${r.name}</h5>
                        <p>${r.description || 'No description provided.'}</p>
                        <div class="gh-repo-meta">
                            ${r.language ? `<span><span class="gh-lang-dot" style="background:${langColors[r.language] || '#888'}"></span> ${r.language}</span>` : ''}
                            <span><i class="fas fa-star"></i> ${r.stargazers_count}</span>
                            <span><i class="fas fa-code-branch"></i> ${r.forks_count}</span>
                        </div>
                    </a>
                `).join('');
            }
        } catch (err) {
            console.warn('GitHub API fetch failed:', err);
        }
    }

    fetchGitHubStats();

    // ==============================
    // PWA SERVICE WORKER REGISTRATION
    // ==============================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.warn('SW registration failed:', err));
    }

    // ==============================
    // AUTO-UPDATING COPYRIGHT YEAR
    // ==============================
    const copyrightEl = document.getElementById('copyrightYear');
    if (copyrightEl) copyrightEl.textContent = new Date().getFullYear();

    // ==============================
    // QR CODE CONTACT CARD (vCard)
    // ==============================
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer && typeof QRCode !== 'undefined') {
        const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:Vikash Saravanan
TITLE:AI Engineer & Data Scientist
TEL;TYPE=CELL:+919342877474
EMAIL:vikash07052008@gmail.com
URL:https://vikashsaravanann.github.io/Portfolio_Information/
ADR;TYPE=HOME:;;Karur;Tamil Nadu;;639102;India
NOTE:B.Tech AI & Data Science Student | Hackathon Finalist | 15+ Certifications
END:VCARD`;

        new QRCode(qrContainer, {
            text: vCardData,
            width: 180,
            height: 180,
            colorDark: '#0a0a0f',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // ==============================
    // VISITOR GUEST BOOK (localStorage)
    // ==============================
    const gbForm = document.getElementById('guestBookForm');
    const gbEntries = document.getElementById('guestBookEntries');
    const GB_KEY = 'vikash_portfolio_guestbook';

    function loadGuestBook() {
        if (!gbEntries) return;
        const entries = JSON.parse(localStorage.getItem(GB_KEY) || '[]');
        if (entries.length === 0) {
            gbEntries.innerHTML = '<p style="text-align:center; color: rgba(255,255,255,0.3); font-size: 0.85rem; padding: 20px 0;">No entries yet — be the first to sign! ✍️</p>';
            return;
        }
        gbEntries.innerHTML = entries.slice(-10).reverse().map(e => `
            <div style="padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; animation: fadeInUp 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #fff; font-weight: 700;">${e.name.charAt(0).toUpperCase()}</div>
                        <strong style="color: #0ea5e9; font-size: 0.85rem;">${e.name}</strong>
                    </div>
                    <span style="color: rgba(255,255,255,0.25); font-size: 0.7rem; white-space: nowrap;">${e.date}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${e.category ? `<span style="font-size: 0.72rem; padding: 2px 8px; background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.15); border-radius: 6px; color: rgba(255,255,255,0.5); white-space: nowrap;">${e.category}</span>` : ''}
                    <span style="color: rgba(255,255,255,0.65); font-size: 0.85rem; line-height: 1.5;">${e.message}</span>
                </div>
            </div>
        `).join('');
    }

    if (gbForm) {
        gbForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('gbName').value.trim();
            const message = document.getElementById('gbMessage').value.trim();
            const categoryEl = document.getElementById('gbCategory');
            const category = categoryEl ? categoryEl.value : '';
            if (!name || !message) return;

            const entries = JSON.parse(localStorage.getItem(GB_KEY) || '[]');
            entries.push({
                name: name.substring(0, 30),
                message: message.substring(0, 150),
                category: category,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            });
            localStorage.setItem(GB_KEY, JSON.stringify(entries));
            gbForm.reset();
            loadGuestBook();
        });
        loadGuestBook();
    }

    // ==============================
    // PERFORMANCE: Add lazy loading to all remaining images
    // ==============================
    document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
    });
});

// ==============================
// RESUME PDF GENERATOR (jsPDF)
// Placed outside DOMContentLoaded so it's globally accessible
// ==============================
function generateResumePDF() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        alert('PDF library is still loading. Please try again in a moment.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Colors
    const accent = [14, 165, 233];     // #0ea5e9
    const dark = [10, 10, 15];         // #0a0a0f
    const textPrimary = [30, 30, 30];
    const textSecondary = [100, 100, 100];

    // Header bar
    doc.setFillColor(...dark);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(...accent);
    doc.rect(0, 45, pageWidth, 2, 'F');

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('VIKASH SARAVANAN', margin, 22);

    // Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(14, 165, 233);
    doc.text('AI Engineer | Prompt Engineer | Web Developer', margin, 30);

    // Contact line
    doc.setFontSize(8.5);
    doc.setTextColor(180, 180, 180);
    doc.text('vikash07052008@gmail.com  |  +91 9342877474  |  Karur, Tamil Nadu  |  linkedin.com/in/vikash-saravanan-j7528', margin, 38);

    y = 55;

    // Section helper
    function addSection(title) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(...accent);
        doc.rect(margin, y, contentWidth, 0.5, 'F');
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...accent);
        doc.text(title.toUpperCase(), margin, y);
        y += 7;
    }

    function addBullet(text) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...textPrimary);
        const lines = doc.splitTextToSize('• ' + text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5;
    }

    // Professional Summary
    addSection('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...textSecondary);
    const summary = 'Ambitious B.Tech AI & Data Science student and dedicated AI Engineer, Prompt Engineer, and Web Developer with hands-on expertise in machine learning, full-stack architectures, and enterprise-grade autonomous agents. Meta PyTorch Hackathon Finalist with 15+ professional certifications. Experienced in crafting precise LLM prompts, building production-ready scalable web platforms, and engineering complex intelligent systems.';
    const summaryLines = doc.splitTextToSize(summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 4;

    // Education
    addSection('Education');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textPrimary);
    doc.text('B.Tech in Artificial Intelligence & Data Science', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textSecondary);
    doc.text('Rathinam Technical Campus, Coimbatore, Tamil Nadu | 2024 - 2028', margin, y);
    y += 4;
    doc.text('Relevant Coursework: Machine Learning, Data Structures, Computer Vision, NLP, Statistics', margin, y);
    y += 8;

    // Technical Skills
    addSection('Technical Skills');
    const skills = [
        'Languages: Python, JavaScript, TypeScript, SQL, HTML/CSS, Java',
        'AI/ML: PyTorch, TensorFlow, Scikit-learn, Computer Vision, NLP, LLMs, Generative AI',
        'Frameworks: React, Next.js, Node.js, Express.js, Flask',
        'Automation: n8n Workflow Automation, Web Scraping, Autonomous AI Agents',
        'Data: Pandas, NumPy, Matplotlib, Power BI, Data Annotation, ETL Pipelines',
        'DevOps & Tools: Git, Docker, GitHub Pages, Firebase, VS Code, Jupyter',
        'Databases: MongoDB, PostgreSQL, MySQL, Firebase Realtime DB'
    ];
    skills.forEach(s => addBullet(s));
    y += 3;

    // Projects
    addSection('Key Projects');
    const projects = [
        'HearWise — AI-powered hearing screening & gamified ocean platform for children with 12+ interactive modules (React, GitHub Pages)',
        'Portfolio AI Chatbot — Intelligent assistant with Text-to-Speech, Speech-to-Text, persistent memory, and Siri-style voice (JavaScript, Grok AI)',
        'Logic Intelligence Technologies — Full agency website with multi-step quote system & CRM integration (Next.js)',
        'IPL Data Analysis — Comprehensive cricket analytics project with data visualization (Python, Pandas, Jupyter)',
        'GameHub — Terminal-based arcade with classic games: Snake, Tic-Tac-Toe, Rock-Paper-Scissors (Python)',
        'OpenEnv Debugger — Support Ticket Triage environment for Meta x Scaler Hackathon (Python)'
    ];
    projects.forEach(p => addBullet(p));
    y += 3;

    // Achievements
    addSection('Achievements');
    const achievements = [
        'Meta PyTorch Hackathon Finalist (OpenEnv) — Selected from thousands of participants globally',
        '15+ Professional Certifications spanning AI, Prompt Engineering, Web Development, and Ethical Hacking',
        '3+ Live Production Architectures deployed and maintained on cloud platforms',
        '5,000+ Lines of production-quality code written across multiple technology stacks'
    ];
    achievements.forEach(a => addBullet(a));
    y += 3;

    // Certifications
    addSection('Certifications (Select)');
    const certs = [
        'Certified Ethical Hacker (CEH) — LinkedIn Learning',
        'Data Analysis — Microsoft & LinkedIn',
        'Applied Machine Learning: Ensemble Learning — LinkedIn Learning',
        'Generative AI vs. Traditional AI — LinkedIn Learning',
        'Data Analysis with Python — freeCodeCamp',
        'Networking Basics & Troubleshooting — Cisco Academy',
        'Design Thinking — IIT Bombay (via MyCaptain)',
        'Full-Stack Development — Rathinam Technical Campus',
        'The Cybersecurity Threat Landscape — LinkedIn Learning'
    ];
    certs.forEach(c => addBullet(c));

    // Contact & Links
    if (y > 260) { doc.addPage(); y = 20; }
    addSection('Contact & Links');
    addBullet('Portfolio: vikashsaravanann.github.io/Portfolio_Information');
    addBullet('LinkedIn: linkedin.com/in/vikash-saravanan-j7528');
    addBullet('GitHub: github.com/vikashsaravanann');
    addBullet('Instagram: @startupwithvikash');

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    const footerY = doc.internal.pageSize.height - 10;
    doc.text('Generated from vikashsaravanann.github.io/Portfolio_Information', margin, footerY);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 40, footerY);

    doc.save('Vikash_Saravanan_Resume.pdf');
}
