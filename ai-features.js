// ai-features.js

// ============================================
// AI FEATURES CONFIGURATION (uses backend proxy)
// ============================================
const GROK_MODEL = "llama-3.3-70b-versatile";
const AI_API_URL = (() => {
    const loc = window.location;
    if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/chat';
    }
    return 'https://startupwithvikash.vercel.app/api/chat';
})();
const CALENDLY_URL = "https://calendly.com/vikash07052008";
// ============================================

const VIKASH_SYSTEM_PROMPT = `You are the AI Portfolio Assistant for Vikash Saravanan.
You represent his portfolio and answer visitor questions professionally and helpfully.

About Vikash:
- B.Tech AI & Data Science student, Class of 2029, Rathinam Technical Campus, Coimbatore, Tamil Nadu, India
- Founder & CEO of HearWise Technologies — health-tech SaaS platform for hearing screening in school children using pure tone audiometry via Web Audio API
- Founder & CEO of Logic Intelligence Technologies Pvt. Ltd. — web development company
- Meta PyTorch OpenEnv Hackathon Finalist
- Skills: React, TypeScript, Vite, Tailwind CSS, Supabase, Framer Motion, Next.js, Python, Node.js, HTML, CSS, JavaScript
- GitHub: https://github.com/vikashsaravanann
- LinkedIn: https://linkedin.com/in/vikash-saravanan-j7528
- Instagram: @startupwithVikash
- Email: vikash07052008@gmail.com
- Open to: Frontend Developer, Full-Stack, and Web Development roles

Keep answers concise, friendly, and professional. If asked something unknown about Vikash, suggest contacting him at vikash07052008@gmail.com.`;

async function callGrokAPI(messages, maxTokens = 500) {
    const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: GROK_MODEL,
            messages: messages,
            max_tokens: maxTokens,
            stream: false
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API Error");
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

const safeAiRun = (name, fn) => { try { fn(); } catch(e) { console.error(`AI Feature [${name}] Error:`, e); } };

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // F2: AI Resume Analyser
    // ==========================================
    safeAiRun('ResumeAnalyzer', () => {
        const html = `
            <div class="ai-modal" id="ai-analyze-modal">
                <div class="ai-modal-content" id="ai-analyze-content">
                    <button class="ai-modal-close" onclick="document.getElementById('ai-analyze-modal').classList.remove('active')">&times;</button>
                    <h2 style="color:#0ea5e9; text-align:center;">Recruiter Fit Checker</h2>
                    <p style="text-align:center; font-size:14px; color:#cbd5e1; margin-bottom:20px;">Paste the job description below to see how well Vikash matches the role.</p>
                    <textarea class="ai-input" id="ai-jd-input" rows="5" placeholder="Paste Job Description here..."></textarea>
                    <button class="ai-btn" id="ai-run-analyze-btn">Analyse Fit</button>
                    
                    <div class="ai-analyzer-result" id="ai-analyzer-result">
                        <div class="ai-match-circle" id="ai-match-circle">0%</div>
                        <h4 style="color:#fff;">Matching Skills</h4>
                        <div class="ai-tags-wrap" id="ai-match-skills"></div>
                        <h4 style="color:#fff;">Gaps</h4>
                        <div class="ai-tags-wrap" id="ai-gap-skills"></div>
                        <h4 style="color:#fff;">Recommendation</h4>
                        <div class="ai-rec-box" id="ai-rec-text"></div>
                        <button class="ai-btn" id="ai-download-analyze-btn" style="background:#7c3aed;">Download Analysis PDF</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const btn = document.getElementById('ai-analyze-btn');
        const modal = document.getElementById('ai-analyze-modal');
        const runBtn = document.getElementById('ai-run-analyze-btn');
        const input = document.getElementById('ai-jd-input');
        const resultDiv = document.getElementById('ai-analyzer-result');
        
        btn.addEventListener('click', () => modal.classList.add('active'));

        runBtn.addEventListener('click', async () => {
            const jd = input.value.trim();
            if(!jd) return;
            
            runBtn.disabled = true;
            runBtn.innerText = "Analysing...";
            resultDiv.classList.remove('active');
            document.getElementById('ai-match-circle').innerText = "";
            document.getElementById('ai-match-circle').classList.add('loading');

            const promptMsg = `You are a professional recruiter assistant. Analyse how well Vikash Saravanan J fits this job description: \n\n${jd}\n\nHis profile:\n- B.Tech AI & Data Science student (2029), Rathinam Technical Campus\n- Founder & CEO of HearWise Technologies and Logic Intelligence Technologies Pvt. Ltd.\n- Meta PyTorch OpenEnv Hackathon Finalist\n- Skills: React, TypeScript, Next.js, Tailwind CSS, Supabase, Python, Node.js, Framer Motion, Vite\n\nRespond ONLY in this exact JSON format (no markdown, no extra text):\n{\n  "match_percentage": 85,\n  "matching_skills": ["React", "TypeScript", "Node.js"],\n  "gaps": ["Docker", "AWS"],\n  "recommendation": "Strong candidate for this role. Vikash brings solid frontend and full-stack skills...",\n  "verdict": "Recommended"\n}`;

            try {
                let resStr = await callGrokAPI([{ role: "user", content: promptMsg }], 800);
                
                // Clean markdown if AI includes it
                if(resStr.startsWith('```json')) resStr = resStr.replace(/```json/g, '').replace(/```/g, '');
                const result = JSON.parse(resStr.trim());

                document.getElementById('ai-match-circle').classList.remove('loading');
                document.getElementById('ai-match-circle').innerText = `${result.match_percentage}%`;
                
                document.getElementById('ai-match-skills').innerHTML = result.matching_skills.map(s => `<span class="ai-tag green">${s}</span>`).join('');
                document.getElementById('ai-gap-skills').innerHTML = result.gaps.map(s => `<span class="ai-tag yellow">${s}</span>`).join('');
                document.getElementById('ai-rec-text').innerText = result.recommendation;

                resultDiv.classList.add('active');

            } catch(e) {
                document.getElementById('ai-match-circle').classList.remove('loading');
                if(e.message === "API_NOT_CONFIGURED") {
                    alert("Please add your API Key in the ai-features.js config block first.");
                } else {
                    alert("Analysis failed. Please try again.");
                }
            } finally {
                runBtn.disabled = false;
                runBtn.innerText = "Analyse Fit";
            }
        });

        document.getElementById('ai-download-analyze-btn').addEventListener('click', () => {
            // Print just the result modal content
            const content = document.getElementById('ai-analyze-content').innerHTML;
            const originalBody = document.body.innerHTML;
            document.body.innerHTML = `<div style="padding:40px; background:#fff; color:#000;">${content}</div>`;
            window.print();
            document.body.innerHTML = originalBody;
            location.reload(); // Quick restore of state
        });
    });

    // ==========================================
    // F5: AI Cover Letter Generator
    // ==========================================
    safeAiRun('CoverLetter', () => {
        const html = `
            <div class="ai-modal" id="ai-cl-modal">
                <div class="ai-modal-content">
                    <button class="ai-modal-close" onclick="document.getElementById('ai-cl-modal').classList.remove('active')">&times;</button>
                    <h2 style="color:#7c3aed; text-align:center;">AI Cover Letter Generator</h2>
                    
                    <input type="text" class="ai-input" id="ai-cl-company" placeholder="Company Name" />
                    <input type="text" class="ai-input" id="ai-cl-role" placeholder="Job Role" />
                    <textarea class="ai-input" id="ai-cl-reqs" rows="3" placeholder="Specific requirements or keywords (optional)"></textarea>
                    
                    <button class="ai-btn" id="ai-run-cl-btn" style="background:#7c3aed;">Generate with AI</button>
                    
                    <div class="ai-cl-preview" id="ai-cl-preview"></div>
                    
                    <div class="ai-action-btns" id="ai-cl-actions" style="display:none;">
                        <button class="ai-btn" id="ai-cl-copy-btn">Copy</button>
                        <button class="ai-btn" id="ai-cl-download-btn" style="background:#10b981;">Download .txt</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const btn = document.getElementById('ai-cl-btn');
        const modal = document.getElementById('ai-cl-modal');
        const runBtn = document.getElementById('ai-run-cl-btn');
        const preview = document.getElementById('ai-cl-preview');
        const actions = document.getElementById('ai-cl-actions');
        
        let generatedText = "";

        btn.addEventListener('click', () => modal.classList.add('active'));

        runBtn.addEventListener('click', async () => {
            const company = document.getElementById('ai-cl-company').value.trim();
            const role = document.getElementById('ai-cl-role').value.trim();
            const reqs = document.getElementById('ai-cl-reqs').value.trim();
            
            if(!company || !role) return alert("Company and Role are required.");
            
            runBtn.disabled = true;
            runBtn.innerText = "Generating...";
            preview.classList.remove('active');
            actions.style.display = 'none';

            const promptMsg = `Write a professional cover letter from Vikash Saravanan J applying for ${role} at ${company}. His background: B.Tech AI & Data Science (2029), Founder & CEO of HearWise Technologies and Logic Intelligence Technologies Pvt. Ltd., Meta PyTorch Hackathon Finalist, skills in React/TypeScript/Next.js/Python/Supabase. Make it compelling, confident, and under 300 words. ${reqs ? 'Include these specific requirements: ' + reqs : ''}`;

            try {
                generatedText = await callGrokAPI([{ role: "user", content: promptMsg }], 800);
                preview.innerText = generatedText;
                preview.classList.add('active');
                actions.style.display = 'flex';
                runBtn.innerText = "Regenerate";
            } catch(e) {
                if(e.message === "API_NOT_CONFIGURED") alert("Please add your API Key in the ai-features.js config block first.");
                else alert("Failed to generate. Try again.");
                runBtn.innerText = "Generate with AI";
            } finally {
                runBtn.disabled = false;
            }
        });

        document.getElementById('ai-cl-copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(generatedText);
            const btn = document.getElementById('ai-cl-copy-btn');
            btn.innerText = "Copied!";
            setTimeout(() => btn.innerText = "Copy", 2000);
        });

        document.getElementById('ai-cl-download-btn').addEventListener('click', () => {
            const element = document.createElement('a');
            const file = new Blob([generatedText], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `CoverLetter_${document.getElementById('ai-cl-company').value}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    });

    // ==========================================
    // F22: Calendly Integration
    // ==========================================
    safeAiRun('Calendly', () => {
        const html = `
            <div class="ai-modal" id="ai-calendly-modal">
                <div class="ai-modal-content" style="padding:0; overflow:hidden;">
                    <button class="ai-modal-close" style="z-index:10; background:#0f172a; border-radius:50%; width:30px; height:30px; top:10px; right:10px; padding:0;" onclick="document.getElementById('ai-calendly-modal').classList.remove('active')">&times;</button>
                    <div id="ai-calendly-body" style="width:100%; height:600px; background:#fff; display:flex; align-items:center; justify-content:center;"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const openCalendly = () => {
            const body = document.getElementById('ai-calendly-body');
            document.getElementById('ai-calendly-modal').classList.add('active');
            
            if(CALENDLY_URL && CALENDLY_URL.trim() !== "") {
                body.innerHTML = `<iframe src="${CALENDLY_URL}?embed_domain=${window.location.hostname}&embed_type=Inline" class="ai-calendly-wrap"></iframe>`;
            } else {
                body.innerHTML = `
                    <div style="text-align:center; padding:20px; color:#000;">
                        <h3>Calendly not set up yet.</h3>
                        <p>Contact via email instead.</p>
                        <a href="mailto:vikash07052008@gmail.com" class="ai-btn" style="display:inline-block; margin-top:15px; text-decoration:none;">Email Vikash</a>
                    </div>
                `;
            }
        };

        // Attach to book call button in the hire me modal
        const bookBtn = document.getElementById('adv-book-call-btn');
        if(bookBtn) {
            bookBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Hide hire me modal
                document.getElementById('adv-hire-modal').classList.remove('active');
                openCalendly();
            });
        }
    });

});
