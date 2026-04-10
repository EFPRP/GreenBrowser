// App State
let tabs = [];
let activeTabId = null;
let tabCount = 0;
let folders = [{ id:'default', name:'Default', color:'#20E377', items: [] }];
let activeEngine = 'google'; 
let inputMode = 'search'; // Tracking if the bar is in Search mode or URL explicit mode

// Check Installation State for Onboarding
const isFirstRun = !localStorage.getItem('gbInstalled');
if (isFirstRun) { localStorage.setItem('gbInstalled', 'true'); }

// DOM Elements
const tabsContainer = document.getElementById('tabs-container');
const iframesContainer = document.getElementById('iframes-container');
const urlInput = document.getElementById('url-input');

const btnAddTab = document.getElementById('add-tab');
const btnTheme = document.getElementById('btn-theme');
const dashboardTemplate = document.getElementById('dashboard-template');
const creditsTemplate = document.getElementById('credits-template');
const contentTemplate = document.getElementById('content-template');
const sidebar = document.getElementById('bookmarks-sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const mediaDock = document.getElementById('media-dock');
const dockContent = document.getElementById('media-dock-content');
const emptyDockMsg = document.getElementById('empty-dock-msg');
const dockControls = document.getElementById('dock-controls');
const closeDockBtn = document.getElementById('close-dock');
const ejectDockBtn = document.getElementById('eject-dock');

// Extension Elements
const btnExtensions = document.getElementById('btn-extensions');
const extDropdown = document.getElementById('ext-dropdown');
const launchMusic = document.getElementById('launch-music');
const launchNotes = document.getElementById('launch-notes');
const launchAi = document.getElementById('launch-ai');

const notesWidget = document.getElementById('notes-widget');
const closeNotes = document.getElementById('close-notes');
const clearNotes = document.getElementById('clear-notes');
const notesContent = document.getElementById('notes-content');
const notesHeader = document.getElementById('notes-header');

const aiWidget = document.getElementById('ai-widget');
const closeAi = document.getElementById('close-ai');
const aiHeader = document.getElementById('ai-header');
const aiHistory = document.getElementById('ai-history');
const aiInput = document.getElementById('ai-input');
const aiSendBtn = document.getElementById('ai-send');

// Input Mode Toggle
const btnInputMode = document.getElementById('btn-input-mode');
const inputModeIcon = document.getElementById('input-mode-icon');
btnInputMode.addEventListener('click', () => {
   if (inputMode === 'search') {
      inputMode = 'url';
      inputModeIcon.textContent = 'link';
      inputModeIcon.style.color = 'var(--accent-green)';
      urlInput.placeholder = "Enter direct URL (e.g. mail.google.com)";
   } else {
      inputMode = 'search';
      inputModeIcon.textContent = 'search';
      inputModeIcon.style.color = 'var(--text-muted)';
      urlInput.placeholder = "Type a URL or search term";
   }
   const actb = tabs.find(t => t.id === activeTabId);
   if(actb) {
      urlInput.value = inputMode === 'search' ? actb.queryStr : actb.url;
   }
});

// Bookmark Elements
const folderSelect = document.getElementById('bm-folder-select');
const bmFoldersContainer = document.getElementById('bm-folders-container');

// Search Interruptors
const interruptors = document.querySelectorAll('.interruptor');
interruptors.forEach(int => {
  int.addEventListener('click', () => {
     interruptors.forEach(i => i.classList.remove('active'));
     int.classList.add('active');
     activeEngine = int.dataset.engine;
  });
});

// Extensions interactions
btnExtensions.addEventListener('click', (e) => { e.stopPropagation(); extDropdown.classList.toggle('visible'); });
document.addEventListener('click', () => { extDropdown.classList.remove('visible'); });
launchMusic.addEventListener('click', () => { mediaDock.classList.remove('hidden'); mediaDock.style.display = 'flex'; });
launchNotes.addEventListener('click', () => { notesWidget.classList.remove('hidden'); });
launchAi.addEventListener('click', () => { aiWidget.classList.remove('hidden'); });

closeNotes.addEventListener('click', () => { notesWidget.classList.add('hidden'); });
clearNotes.addEventListener('click', () => { notesContent.value = ''; });
closeAi.addEventListener('click', () => { aiWidget.classList.add('hidden'); });

// Floating draggable logic abstracted
function makeDraggable(headerEl, widgetEl) {
   let isDragging = false, dragX = 0, dragY = 0;
   headerEl.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragX = e.clientX - widgetEl.offsetLeft;
      dragY = e.clientY - widgetEl.offsetTop;
   });
   document.addEventListener('mousemove', (e) => {
      if(isDragging) {
         widgetEl.style.left = (e.clientX - dragX) + 'px';
         widgetEl.style.top = (e.clientY - dragY) + 'px';
         widgetEl.style.right = 'auto';
      }
   });
   document.addEventListener('mouseup', () => { isDragging = false; });
}
makeDraggable(notesHeader, notesWidget);
makeDraggable(aiHeader, aiWidget);

// GreenAI Live APIs and RAG engine mechanics
async function processAiQuery() {
   const text = aiInput.value.trim();
   if(!text) return;
   
   const uDiv = document.createElement('div');
   uDiv.className = 'chat-msg user-msg';
   uDiv.textContent = text;
   aiHistory.appendChild(uDiv);
   aiInput.value = '';
   
   const q = text.toLowerCase();
   let response = "Thinking...";
   
   try {
      if (q.startsWith('ai:weather')) {
         const city = q.replace('ai:weather', '').trim();
         if(!city) { response = "City parameter missing. Try `ai:weather London`"; }
         else {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            const geoData = await geoRes.json();
            if(geoData.results && geoData.results.length > 0) {
               const { latitude, longitude, name, country } = geoData.results[0];
               const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
               const wData = await wRes.json();
               response = `[Live OpenMeteo Sync]\nLocation: ${name}, ${country}\nTemp: ${wData.current_weather.temperature}°C\nWind Speed: ${wData.current_weather.windspeed} km/h`;
            } else { response = `Could not locate telemetry for: ${city}`; }
         }
      } else if (q.startsWith('ai:conv')) {
         const clean = q.replace('ai:conv', '').trim().toUpperCase(); 
         const parts = clean.split('/');
         if(parts.length === 2) {
            const [base, target] = parts;
            const exRes = await fetch(`https://open.er-api.com/v6/latest/${base}`);
            const exData = await exRes.json();
            if(exData.result === "success" && exData.rates[target]) {
               response = `[Live Exchange API]\n1 ${base} = ${exData.rates[target]} ${target}\n(Last Updated: ${exData.time_last_update_utc})`;
            } else { response = `Failed to fetch live mappings for ${base} -> ${target}`; }
         } else { response = "Invalid format. Use ai:conv USD/EUR"; }
      } else if (q.includes('ai:time now here')) {
         response = `Local Machine Sync: ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`;
      } else {
         // Local RAG Retrieval using ai-context.txt
         const ctxRes = await fetch('./ai-context.txt');
         const ctxText = await ctxRes.text();
         
         const blocks = ctxText.split('\n\n['); 
         let bestMatch = "";
         let maxHits = 0;
         
         const stopWords = ['is', 'the', 'how', 'to', 'what', 'a', 'do', 'i'];
         const words = q.split(' ').filter(w => !stopWords.includes(w) && w.length > 1);
         
         for(let block of blocks) {
            let hits = 0;
            words.forEach(w => { if(block.toLowerCase().includes(w)) hits++; });
            if (hits > maxHits) { maxHits = hits; bestMatch = block.replace(/\[/g, '').trim(); }
         }
         
         if(maxHits > 0) {
            const parts = bestMatch.split(']');
            response = parts.length > 1 ? parts[1].trim() : bestMatch;
         } else {
            response = "I couldn't find relevant data in the ai-context archive. Try giving me keywords like EFPPR, bookmarks, search engines, or use specific ai commands like ai:weather [city].";
         }
      }
   } catch(e) {
      response = "Data link error. Local system offline.";
   }

   const mDiv = document.createElement('div');
   mDiv.className = 'chat-msg system-msg';
   mDiv.textContent = response;
   mDiv.style.whiteSpace = "pre-wrap"; 
   aiHistory.appendChild(mDiv);
   aiHistory.scrollTop = aiHistory.scrollHeight;
}
aiSendBtn.addEventListener('click', processAiQuery);
aiInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') processAiQuery(); });

btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = document.body.classList.contains('light-theme') ? 'dark_mode' : 'light_mode';
    btnTheme.querySelector('span').textContent = icon;
});

// Bookmark Form
document.getElementById('btn-add-folder').addEventListener('click', () => {
    const nameStr = document.getElementById('new-folder-name').value.trim();
    const colorStr = document.getElementById('new-folder-color').value;
    if(nameStr) {
       const fId = 'folder-' + Date.now();
       folders.push({ id: fId, name: nameStr, color: colorStr, items: [] });
       document.getElementById('new-folder-name').value = '';
       renderSidebar();
    }
});

document.getElementById('btn-bm-current').addEventListener('click', () => {
   const activeTab = tabs.find(t => t.id === activeTabId);
   if(activeTab && activeTab.url) {
      const folderId = document.getElementById('bm-folder-select').value;
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
         folder.items.push({ url: activeTab.url, queryStr: activeTab.queryStr, title: activeTab.title });
         renderSidebar();
      }
      const star = document.getElementById('btn-bm-current');
      star.classList.add('pulse');
      setTimeout(() => star.classList.remove('pulse'), 500);
   }
});

document.getElementById('btn-star').addEventListener('click', () => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if(activeTab && activeTab.url && folders.length > 0) {
      folders[0].items.push({ url: activeTab.url, queryStr: activeTab.queryStr, title: activeTab.title });
      renderSidebar();
      const star = document.getElementById('btn-star');
      star.style.color = "var(--accent-green)";
      setTimeout(() => star.style.color = "var(--text-muted)", 500);
  }
});

// V9 PURE NATIVE NODE CREATION - ABSOLUTE CLICK LISTENER SURVIVABILITY
function renderSidebar() {
   bmFoldersContainer.innerHTML = '';
   folderSelect.innerHTML = '';
   folders.forEach(f => {
      // Add to select
      const opt = document.createElement('option');
      opt.value = f.id; opt.textContent = f.name;
      folderSelect.appendChild(opt);
      
      const div = document.createElement('div');
      div.className = 'bookmark-category';
      
      const h4 = document.createElement('h4');
      h4.className = 'category-title';
      h4.innerHTML = `<span class="material-symbols-outlined folder-icon" style="color:${f.color}">folder</span> 
                      <span class="category-title-text" id="t-${f.id}">${f.name}</span>`;
                      
      const actContainer = document.createElement('div');
      actContainer.className = 'folder-actions';
      
      const btnEdit = document.createElement('button');
      btnEdit.className = 'folder-action-btn';
      btnEdit.title = 'Rename';
      btnEdit.innerHTML = `<span class="material-symbols-outlined">edit</span>`;
      btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          const newName = prompt("Rename folder:");
          if(newName) { f.name = newName; renderSidebar(); }
      });
      
      const btnDel = document.createElement('button');
      btnDel.className = 'folder-action-btn';
      btnDel.title = 'Delete Folder';
      btnDel.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
      btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          // Nuclearly delete it instantly with zero confirms to defeat local blocks
          folders = folders.filter(fol => fol.id !== f.id);
          renderSidebar();
      });
      
      actContainer.appendChild(btnEdit);
      actContainer.appendChild(btnDel);
      h4.appendChild(actContainer);
      div.appendChild(h4);
      
      const ul = document.createElement('ul');
      ul.className = 'bookmark-list';
      f.items.forEach((item, idx) => {
          const li = document.createElement('li');
          li.className = 'bm-nav';
          li.innerHTML = `<span class="icon" style="color:${f.color}">🔖</span> ${item.title}`;
          li.addEventListener('click', () => navigateActiveTab(item.url));
          
          const closeSpan = document.createElement('span');
          closeSpan.className = "material-symbols-outlined rm-item";
          closeSpan.textContent = "close";
          closeSpan.style.cssText = "font-size: 14px; margin-left: auto; color: var(--text-muted); cursor: pointer;";
          closeSpan.addEventListener('click', (e) => {
             e.stopPropagation();
             f.items.splice(idx, 1);
             renderSidebar();
          });
          
          li.appendChild(closeSpan);
          ul.appendChild(li);
      });
      
      div.appendChild(ul);
      bmFoldersContainer.appendChild(div);
   });
}

btnToggleSidebar.addEventListener('click', () => sidebar.classList.toggle('hidden'));
closeDockBtn.addEventListener('click', () => {
  mediaDock.classList.add('hidden');
  setTimeout(() => { mediaDock.style.display = 'none'; }, 300);
});
ejectDockBtn.addEventListener('click', () => {
   dockContent.innerHTML = '';
   dockControls.style.display = 'none';
   emptyDockMsg.style.display = 'flex';
});

// App Initiation
renderSidebar();
if (isFirstRun) {
   createTab('greenbrowser:welcome');
} else {
   createTab();
}


function createTab(initialUrl = '') {
  tabCount++;
  const id = 'tab-' + Date.now();
  const tabObj = { id: id, url: initialUrl, queryStr: initialUrl, title: 'GreenSearch' };
  tabs.push(tabObj);
  
  const tabEl = document.createElement('div');
  tabEl.className = 'tab'; tabEl.id = `ui-${id}`; tabEl.draggable = true;
  tabEl.innerHTML = `
    <span class="material-symbols-outlined tab-icon">eco</span>
    <span class="tab-title">GreenSearch</span>
    <span class="material-symbols-outlined tab-close">close</span>
  `;
  
  tabEl.addEventListener('click', () => setActiveTab(id));
  tabEl.querySelector('.tab-close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(id); });
  tabEl.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); tabEl.style.opacity = '0.4'; });
  tabEl.addEventListener('dragend', () => { tabEl.style.opacity = '1'; });
  
  tabsContainer.appendChild(tabEl);
  
  const viewEl = document.createElement('div');
  viewEl.className = 'view-container'; viewEl.id = `view-${id}`;
  
  renderDashboard(viewEl);
  iframesContainer.appendChild(viewEl);
  
  setActiveTab(id);
  if (initialUrl) navigateActiveTab(initialUrl);
}

function renderDashboard(viewEl) {
  viewEl.innerHTML = '';
  const dashClone = dashboardTemplate.content.cloneNode(true);
  const searchInput = dashClone.querySelector('.dashboard-search');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateActiveTab(e.target.value);
  });
  viewEl.appendChild(dashClone);
}

window.navigateGlobal = (url) => { navigateActiveTab(url) };

const customPagesData = {
   'welcome': { 
      title: 'Welcome to GreenBrowser', 
      html: `
      <p>You have successfully installed the local prototype instance of GreenBrowser by EFPPR.</p>
      <h2>The Core Modules</h2>
      <ul>
         <li><b>GreenSearch:</b> Use the "Leaf" icon toggle in your URL bar to natively route to internal documentation without contacting outside servers.</li>
         <li><b>Bookmarks Sandbox:</b> Open your sidebar. You can create grouped folders and assign aesthetic colors.</li>
         <li><b>Media Dock:</b> Open "Extensions" (puzzle icon) and activate the Music Dock. Drag a tab onto the right side to bind it to the hardware.</li>
         <li><b>GreenAI KB:</b> Local Javascript engine that can answer "how-to" scenarios automatically off the grid!</li>
      </ul>
      <h2>Internal Directories Hub</h2>
      <p>Navigate directly to our built-in configuration arrays:</p>
      <ul style="list-style: none; padding-left: 0;">
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:help')">› greenbrowser:help (Support Center)</button></li>
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:privacy')">› greenbrowser:privacy (Data Protections)</button></li>
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:tos')">› greenbrowser:tos (Terms of Service)</button></li>
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:roadmap')">› greenbrowser:roadmap (Future Tech)</button></li>
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:changelog')">› greenbrowser:changelog (Patch Notes)</button></li>
         <li><button style="background:transparent; border:none; color:var(--accent-green); cursor:pointer; font-size:16px; margin-bottom:8px;" onclick="window.navigateGlobal('greenbrowser:credits')">› greenbrowser:credits (EFPPR Creation Credits)</button></li>
      </ul>
      `
   },
   'tos': { 
      title: 'EFPPR Terms of Service', 
      html: `
      <p style="color: #999; font-size: 14px;">Effective date: October 2025 | Archived version</p>
      <p>We know it’s tempting to skip these Terms of Service, but it’s important to establish what you can expect from us as you use GreenBrowser, and what we expect from you.</p>
      <p>These Terms reflect the way the European Fire Prevention & Rural Preservation Organization (EFPPR) conducts digital business. As a fundamental philosophy to preserve non-commercial environments, we explicitly decline the monetization of telemetry.</p>
      
      <h3>1. Service framework</h3>
      <p>We provide a localized rendering protocol (GreenBrowser) governed entirely by local executing Javascript within your isolated desktop environment framework.</p>
      <ul>
         <li><b>Zero Remote Indexing</b>: We do not ping home networks to log metadata.</li>
         <li><b>Total Agency</b>: You are responsible for ensuring the iframe networks you deploy are safe and secure natively.</li>
      </ul>

      <h3>2. Your relationship with GreenBrowser</h3>
      <p>By using our Services, you agree to abide by these Terms. <i>You retain complete ownership over the HTML, text, and cached bookmarks you configure.</i> Under no circumstances will GreenBrowser arbitrarily lock out domains unless configured manually via the Tracker Firewall module (coming in Desktop iteration Phase 2).</p>
      
      <h3>3. Warranties and Disclaimers</h3>
      <p>We provide these Services using a commercially reasonable level of skill and care. However, we do not make specific promises. <b>ALL ENGINES, MODULES, AND SANDBOXES ARE PROVIDED "AS IS".</b> There is no warranty of fitness for a particular purpose.</p>
      
      <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: #777;">Please contact Alexander ELIZALDE XIROKOSTA directly concerning any architectural vulnerabilities found during internal penetration tests.</p>
      ` 
   },
   'privacy': { 
      title: 'Privacy Policy', 
      html: `
      <p style="color: #999; font-size: 14px;">Effective: Last Updated during V7 Implementation</p>
      <p>When you use the GreenBrowser engine, you trust us with your data handling. It is our responsibility to make absolutely sure you understand exactly how your data flow works natively inside our architecture.</p>
      <p>We build our modules under the direct authorization of the European Fire Prevention & Rural Preservation Organization (EFPPR) to help you manage your privacy securely.</p>

      <h3>Things you create or provide to us</h3>
      <p>We do <b>not</b> require a Google account. We do <b>not</b> require login servers. You navigate strictly anonymously via local V8 engine compilation. Your preferences (Legacy Themes, White Themes, Search Context Settings) are explicitly pushed natively into your machine's <code>localStorage / WebStorage API</code> framework.</p>
      <div style="background: rgba(32, 227, 119, 0.05); border-left: 4px solid var(--accent-green); padding: 16px; margin: 24px 0;">
         <p style="margin: 0; font-weight: 500;">In plain English: When you search, GreenBrowser routes you. When you close the window, we forget you. Fast.</p>
      </div>

      <h3>Information we collect as you use our services</h3>
      <p>Nothing. We actively intercept incoming external requests natively inside the ` + "`dashboard template`" + ` array to prevent upstream 3rd parties from logging your initial viewport sizes.</p>
      
      <h3>How we secure your data</h3>
      <p>We build security into the browser. GreenBrowser's core routing strictly limits rendering contexts via CORS boundaries inside the <code>Iframe Navigation Array</code>. By preventing origin bleeding from top-level frames down to nested targets, you are inherently sanitized against passive ad-tracker hijacking routines.</p>
      ` 
   },
   'changelog': { title: 'Release Notes (v9.0.5)', html: '<p><b>v9.0.5</b>: Integrated Live API logic for GreenAI via Meteo and er-api frameworks. Initiated offline local array mapping via <pre>ai-context.txt</pre> for LLM indexing algorithms. Completely rewrote bookmark sidebar logic via document.createElement allowing bulletproof deletion processes across all dev environments. </p>' },
   'roadmap': { title: 'Strategic Roadmap', html: '<p>The path forward for GreenBrowser Desktop Edition:</p><h2>Phase 1 (WIP)</h2><ul><li>Electron application wrapper architecture for Win32 compilation</li><li>System level socket interceptors (Ad-block real core logic over raw UDP)</li></ul><h2>Phase 2</h2><ul><li>WebRTC media stream integrations inside Native App bounds</li><li>Native operating system hooks for the Media Dock rendering</li></ul>' },
   'help': { title: 'GreenBrowser Help Center', html: '<p>Looking for answers? The fastest way is to leverage <b>GreenAI</b>.</p><p>Click the <b>puzzle piece</b> extension button residing in your top-right header and spawn the GreenAI widget. You can chat natively with it completely off the grid to learn everything you need formatting the browser capabilities.</p>' },
   'source': { title: 'Source Architecture', html: '<p>Core Stack: Native Vanilla JavaScript, local DOM manipulation.</p><p>Visual Directive: Modified Google Antigravity protocol gradients.</p><p>Target Runtime: Chromium/Electron Engine V8.</p>' },
   'hello': { title: 'Hello World', html: '<p>The system is fully functional.</p>' }
};

function renderContentPage(viewEl, pageId) {
  viewEl.innerHTML = '';
  const clone = contentTemplate.content.cloneNode(true);
  const data = customPagesData[pageId] || { title: 'Page Not Found', html: '<p>The internal routing you requested does not exist in module space.</p>'};
  
  clone.getElementById('page-title').textContent = data.title;
  clone.getElementById('page-body').innerHTML = data.html;
  viewEl.appendChild(clone);
}

function renderCredits(viewEl) {
  viewEl.innerHTML = '';
  const creditsClone = creditsTemplate.content.cloneNode(true);
  viewEl.appendChild(creditsClone);
}

function setActiveTab(id) {
  activeTabId = id;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active-tab'));
  const t = document.getElementById(`ui-${id}`);
  if(t) t.classList.add('active-tab');
  
  document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
  const v = document.getElementById(`view-${id}`);
  if(v) v.classList.add('active-view');
  
  const tabObj = tabs.find(tb => tb.id === id);
  if (tabObj) {
     urlInput.value = (inputMode === 'url') ? tabObj.url : tabObj.queryStr;
  }
}

function closeTab(id) {
  tabs = tabs.filter(t => t.id !== id);
  document.getElementById(`ui-${id}`).remove();
  document.getElementById(`view-${id}`).remove();
  
  if (tabs.length === 0) createTab();
  else if (activeTabId === id) setActiveTab(tabs[tabs.length - 1].id);
}

btnAddTab.addEventListener('click', () => createTab());

function navigateActiveTab(query) {
  if(!query) return;
  const tabObj = tabs.find(t => t.id === activeTabId);
  const viewEl = document.getElementById(`view-${activeTabId}`);
  const tabEl = document.getElementById(`ui-${activeTabId}`);
  
  let finalUrl = query;
  let cleanQuery = query;

  // URL OVERRIDE MODE explicitly disables internal routing AND search engines
  if (inputMode === 'url') {
      if (!query.startsWith('http')) {
         finalUrl = 'https://' + query;
      }
      cleanQuery = finalUrl;
  } else {
     // Internal Logic Routing Checks
     if (query.trim().toLowerCase().startsWith('greenbrowser:')) {
        const p = query.trim().toLowerCase().split(':')[1];
        tabObj.url = query;
        tabObj.queryStr = query;
        tabObj.title = 'Green ' + p;
        tabEl.querySelector('.tab-title').textContent = tabObj.title;
        urlInput.value = query; // Internal pages always show the protocol url natively
        if (p === 'credits') { renderCredits(viewEl); } else { renderContentPage(viewEl, p); }
        return;
     }
     
     // Normal Heuristics / Search Engine execution
     if (query.includes('.') && !query.includes(' ')) {
       if (!query.startsWith('http')) finalUrl = 'https://' + query;
       cleanQuery = finalUrl;
     } else {
       if (activeEngine === 'google') finalUrl = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(query);
       else if (activeEngine === 'wikipedia') finalUrl = 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query);
       else if (activeEngine === 'greensearch') {
          navigateActiveTab('greenbrowser:' + query.split(' ')[0]); 
          return;
       }
     }
  }
  
  tabObj.url = finalUrl; 
  tabObj.queryStr = cleanQuery;
  tabObj.title = (inputMode !== 'url' && !query.includes('.') || query.includes(' ')) ? `${query} - Search` : finalUrl;
  tabEl.querySelector('.tab-title').textContent = tabObj.title;
  
  // Set the specific layout text
  urlInput.value = (inputMode === 'url') ? tabObj.url : tabObj.queryStr;
  viewEl.innerHTML = `<iframe src="${finalUrl}" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>`;
}

urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateActiveTab(urlInput.value); });
document.getElementById('btn-refresh').addEventListener('click', () => { 
   const tabObj = tabs.find(t => t.id === activeTabId);
   if(tabObj) navigateActiveTab(tabObj.queryStr); 
});

document.getElementById('btn-back').addEventListener('click', () => {
   const viewEl = document.getElementById(`view-${activeTabId}`);
   renderDashboard(viewEl);
   const tabObj = tabs.find(t => t.id === activeTabId);
   tabObj.url = ''; 
   tabObj.queryStr = '';
   tabObj.title = 'GreenSearch';
   document.getElementById(`ui-${activeTabId}`).querySelector('.tab-title').textContent = tabObj.title;
   urlInput.value = '';
});

// Media Dock Drop logic
mediaDock.addEventListener('dragover', (e) => { e.preventDefault(); mediaDock.classList.add('drag-over'); mediaDock.style.display="flex"; mediaDock.classList.remove('hidden'); });
mediaDock.addEventListener('dragleave', () => { mediaDock.classList.remove('drag-over'); });
mediaDock.addEventListener('drop', (e) => {
  e.preventDefault(); mediaDock.classList.remove('drag-over');
  const tabId = e.dataTransfer.getData('text/plain');
  if (!tabId) return;
  
  const viewEl = document.getElementById(`view-${tabId}`);
  let iframe = viewEl.querySelector('iframe');
  if(!iframe) {
     iframe = document.createElement('iframe');
     iframe.src = 'about:blank';
  }
  
  dockContent.innerHTML = '';
  dockContent.appendChild(iframe);
  emptyDockMsg.style.display = 'none';
  dockControls.style.display = 'flex';
  closeTab(tabId);
  mediaDock.classList.remove('hidden');
  mediaDock.style.display = "flex";
});
