/* No external dependencies. The robot is an original SVG illustration with
   two-link planar inverse kinematics and a small, deterministic state machine.
   This is an interactive illustration, not a robot controller or learned policy. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const config = window.SITE_CONFIG || {};
  let language = 'en';
  try { language = localStorage.getItem('yangli-site-language') === 'zh' ? 'zh' : 'en'; } catch (_) {}
  const strings = {
    idle: ['Move your cursor. I’m paying attention.', '移动鼠标，我会看向你。'],
    idleSpeech: ['Oh, hello there.', '你好，很高兴见到你。'],
    observe: ['01 / PERCEIVE — locating the block.', '01 / 感知 — 确定方块位置。'],
    observeSpeech: ['I see the block.', '我看到方块了。'],
    plan: ['02 / PLAN — choosing a reach and placement.', '02 / 规划 — 选择抓取与放置位置。'],
    planSpeech: ['Think before acting.', '先想，再行动。'],
    reach: ['03 / ACT — reaching toward the target.', '03 / 执行 — 接近目标。'],
    reachSpeech: ['Let me get that.', '让我来拿。'],
    grasp: ['03 / ACT — closing the gripper.', '03 / 执行 — 闭合夹爪。'],
    graspSpeech: ['Got it.', '抓到了。'],
    lift: ['03 / ACT — lifting and moving the block.', '03 / 执行 — 抬起并移动方块。'],
    liftSpeech: ['A little progress.', '稳稳地移过去。'],
    place: ['03 / ACT — placing the block.', '03 / 执行 — 放置方块。'],
    placeSpeech: ['Right here.', '就放在这里。'],
    success: ['Done. Click another block, or reset the scene.', '完成。可以点击另一个方块，或重置场景。'],
    successSpeech: ['One small step.', '又完成一小步。'],
    wave: ['Hello! Nice to meet a fellow curious mind.', '你好！很高兴认识同样好奇的你。'],
    waveSpeech: ['Nice to meet you!', '很高兴认识你！'],
    paused: ['Animation paused. Press play to continue.', '动画已暂停，点击播放继续。'],
    pausedSpeech: ['Taking a little break.', '休息一下。'],
    reduced: ['Reduced motion enabled. Buttons still work.', '已启用减少动态效果，按钮仍可操作。']
  };
  const tr = (key) => (strings[key] || strings.idle)[language === 'zh' ? 1 : 0];

  function safeUrl(value, allowMail = false) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), document.baseURI);
      if (['https:', 'http:'].includes(url.protocol)) return value.trim();
      if (allowMail && url.protocol === 'mailto:') return value.trim();
      if (url.protocol === 'file:' && !/^[a-z]+:/i.test(value) && !value.startsWith('//')) return value.trim();
    } catch (_) {}
    return null;
  }
  function addLink(container, label, href) {
    const url = safeUrl(href, true);
    if (!container || !url) return;
    const link = document.createElement('a');
    link.textContent = label + ' ↗';
    link.href = url;
    if (!url.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    container.append(link);
  }
  function projectLinks(container, key) {
    container.replaceChildren();
    const links = (config.projects || {})[key] || {};
    for (const [type, label] of [['paper', 'Paper'], ['code', 'Code'], ['video', 'Video']]) {
      addLink(container, label, links[type]);
    }
  }
  const github = safeUrl(config.github);
  if (github) document.querySelectorAll('.github-link').forEach(a => { a.href = github; });
  const extra = $('extra-contact');
  if (typeof config.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    addLink(extra, 'Email', 'mailto:' + config.email);
  }
  addLink(extra, 'Scholar', config.scholar);
  addLink(extra, 'CV', config.cv);
  addLink(extra, 'LinkedIn', config.linkedin);
  document.querySelectorAll('[data-links]').forEach(el => projectLinks(el, el.dataset.links));
  $('year').textContent = String(new Date().getFullYear());

  // Content stays in HTML for search engines and no-JavaScript reading.
  let projects = [];
  try { projects = JSON.parse($('project-data').textContent); } catch (err) { console.warn('Research data unavailable.', err); }
  const dialog = $('project-dialog');
  let activeProject = null;
  function fillDialog(project) {
    const i = language === 'zh' ? 1 : 0;
    $('dialog-title').textContent = project.title;
    $('dialog-subtitle').textContent = project.sub;
    $('dialog-category').textContent = project.cat[i];
    $('dialog-heading').textContent = language === 'zh' ? '研究简介' : 'Research overview';
    $('dialog-body').textContent = project.detail[i];
    $('dialog-focus').textContent = project.focus[i];
    projectLinks($('dialog-links'), project.id);
  }
  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      const project = projects.find(p => p.id === button.dataset.project);
      if (!project) return;
      activeProject = project;
      fillDialog(project);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.classList.add('dialog-open');
    });
  });
  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('dialog-open');
  }
  $('close-dialog').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeDialog();
  });
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 12), {passive: true});

  // Robot scene state. Simulation time advances only while visible and unpaused.
  const svg = $('robot-svg');
  const playground = $('robot-playground');
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reducedQuery.matches;
  let paused = false, visible = true, raf = 0, lastFrame = 0, sceneTime = 0;
  let phase = 'idle', mode = 'idle', elapsed = 0, task = null;
  let gaze = {x: 0, y: 0}, targetGaze = {x: 0, y: 0};
  const origins = {left: {x: 302, y: 239}, right: {x: 437, y: 239}};
  const home = {left: {x: 223, y: 329}, right: {x: 515, y: 331}};
  const hands = {left: {...home.left}, right: {...home.right}};
  const objects = {
    coral: {home: {x: 207, y: 397}, goal: {x: 339, y: 430}, x: 207, y: 397, placed: false, side: 'left'},
    sage: {home: {x: 533, y: 399}, goal: {x: 402, y: 430}, x: 533, y: 399, placed: false, side: 'right'}
  };
  const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  const move = (a, b, t, start, duration) => mix(a, b, smooth((t - start) / duration));
  let speechTimer;
  function renderMessages() {
    const current = paused ? 'paused' : phase;
    $('scene-status').textContent = reducedMotion && current === 'idle' ? tr('reduced') : tr(current);
    $('robot-speech').textContent = tr(current + 'Speech');
    const dot = document.createElement('span'); dot.className = 'speech-dot'; dot.setAttribute('aria-hidden', 'true'); $('robot-speech').append(dot);
    $('motion-toggle').setAttribute('aria-label', paused ? (language === 'zh' ? '继续动画' : 'Resume animation') : (language === 'zh' ? '暂停动画' : 'Pause animation'));
    $('motion-toggle').title = paused ? (language === 'zh' ? '继续动画' : 'Resume animation') : (language === 'zh' ? '暂停动画' : 'Pause animation');
    $('motion-symbol').setAttribute('d', paused ? 'M6 4l9 6-9 6Z' : 'M7 5v10M13 5v10');
    $('pick-button').disabled = mode !== 'idle' || paused;
    $('wave-button').disabled = mode !== 'idle' || paused;
  }
  function setPhase(next) {
    if (phase === next) return;
    phase = next;
    renderMessages();
    $('robot-speech').classList.add('excited');
    window.clearTimeout(speechTimer);
    speechTimer = window.setTimeout(() => $('robot-speech').classList.remove('excited'), 380);
  }
  function languageUpdate() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
      // These bilingual strings are author-controlled, local HTML, never user input.
      el.innerHTML = el.dataset[language];
    });
    $('lang-en').classList.toggle('active', language === 'en');
    $('lang-zh').classList.toggle('active', language === 'zh');
    $('language-toggle').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换为中文');
    if (activeProject) fillDialog(activeProject);
    renderMessages();
    try { localStorage.setItem('yangli-site-language', language); } catch (_) {}
  }
  $('language-toggle').addEventListener('click', () => { language = language === 'en' ? 'zh' : 'en'; languageUpdate(); });

  /** Solve a planar two-link arm, with a bounded reachable target.
   * @param {'left'|'right'} side @param {{x:number,y:number}} hand
   * @param {number} opening 0=closed, 1=open @param {number} wrist degrees
   * @param {number=} bend Override elbow branch when waving. */
  function drawArm(side, hand, opening = 1, wrist = 0, bend) {
    const shoulder = origins[side], L1 = 104, L2 = 108;
    const dx = hand.x - shoulder.x, dy = hand.y - shoulder.y;
    const raw = Math.hypot(dx, dy) || 1;
    const distance = clamp(raw, Math.abs(L1-L2) + .01, L1 + L2 - .01);
    const ux = dx / raw, uy = dy / raw;
    const a = (L1*L1 - L2*L2 + distance*distance) / (2*distance);
    const h = Math.sqrt(Math.max(0, L1*L1 - a*a));
    const sign = bend == null ? (side === 'left' ? 1 : -1) : bend;
    const elbow = {x: shoulder.x + a*ux - sign*h*uy, y: shoulder.y + a*uy + sign*h*ux};
    const end = {x: shoulder.x + ux*distance, y: shoulder.y + uy*distance};
    const upper = `M${shoulder.x} ${shoulder.y}L${elbow.x.toFixed(2)} ${elbow.y.toFixed(2)}`;
    const lower = `M${elbow.x.toFixed(2)} ${elbow.y.toFixed(2)}L${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
    $(side+'-upper').setAttribute('d', upper); $(side+'-upper-light').setAttribute('d', upper);
    $(side+'-lower').setAttribute('d', lower); $(side+'-lower-light').setAttribute('d', lower);
    $(side+'-elbow').setAttribute('transform', `translate(${elbow.x.toFixed(2)} ${elbow.y.toFixed(2)})`);
    const gripper = $(side+'-gripper');
    gripper.setAttribute('transform', `translate(${end.x.toFixed(2)} ${end.y.toFixed(2)}) rotate(${wrist.toFixed(2)})`);
    const spread = 8 + 8*opening;
    gripper.querySelector('.finger-l').setAttribute('transform', `translate(${-spread} 0)`);
    gripper.querySelector('.finger-r').setAttribute('transform', `translate(${spread} 0)`);
  }
  function renderObject(id) {
    const o = objects[id];
    $('object-'+id).setAttribute('transform', `translate(${o.x.toFixed(2)} ${o.y.toFixed(2)})`);
    const shadow = $('shadow-'+id);
    const baseY = o.placed ? o.goal.y + 22 : o.home.y + 22;
    shadow.setAttribute('cx', o.x.toFixed(2)); shadow.setAttribute('cy', baseY.toFixed(2));
    const height = Math.max(0, baseY - o.y - 22);
    shadow.setAttribute('opacity', String(clamp(1 - height/130, .15, 1)));
    shadow.setAttribute('rx', String(31 + height*.05));
  }
  function renderPose(dt = 0) {
    const settle = reducedMotion ? 1 : (1-Math.exp(-dt*9));
    let gx = targetGaze.x, gy = targetGaze.y;
    if (task && mode === 'pick') { gx = clamp((objects[task.id].x - 367)/150, -1, 1); gy = .55; }
    if (mode === 'wave') { gx = 0; gy = -.05; }
    gaze.x += (gx - gaze.x)*settle; gaze.y += (gy - gaze.y)*settle;
    const sway = reducedMotion ? 0 : Math.sin(sceneTime*.8)*.35;
    $('robot-head').setAttribute('transform', `rotate(${(gaze.x*3.2 + sway).toFixed(3)} 367 208) translate(0 ${(Math.sin(sceneTime*1.3)*.75).toFixed(2)})`);
    $('robot-eyes').setAttribute('transform', `translate(${(gaze.x*8).toFixed(2)} ${(gaze.y*4).toFixed(2)})`);
    const blinkTime = sceneTime % 4.4;
    const blink = !reducedMotion && blinkTime > 3.85 && blinkTime < 4.02 ? Math.max(.08, Math.abs(blinkTime-3.935)/.085) : 1;
    $('eye-blink').setAttribute('transform', `translate(0 ${(140*(1-blink)).toFixed(2)}) scale(1 ${blink.toFixed(3)})`);
    for (const side of ['left', 'right']) {
      let opening = 1, wrist = 0, bend;
      if (mode === 'idle') hands[side] = {x: home[side].x, y: home[side].y + (reducedMotion ? 0 : Math.sin(sceneTime*1.5)*1.2)};
      if (mode === 'pick' && task && task.side === side) {
        if (elapsed >= 2.65 && elapsed < 5.65) opening = 1 - smooth((elapsed - 2.65)/.35);
        else if (elapsed >= 5.65) opening = smooth((elapsed - 5.65)/.25);
      }
      if (mode === 'wave' && side === 'right') {
        const strength = smooth(elapsed/.9) * (1-smooth((elapsed-3.2)/.9));
        wrist = (-146 + Math.sin(elapsed*10)*16)*strength;
        if (elapsed >= .6 && elapsed < 3.6) bend = 1;
      }
      drawArm(side, hands[side], opening, wrist, bend);
    }
    renderObject('coral'); renderObject('sage');
  }
  function finish() {
    mode = 'idle'; task = null; elapsed = 0;
    document.querySelectorAll('.scene-object').forEach(el => { el.classList.remove('busy','held'); el.removeAttribute('aria-disabled'); });
    $('path-annotation').setAttribute('opacity', '0');
    setPhase('success'); renderMessages();
  }
  function pick(id = 'coral') {
    if (mode !== 'idle' || paused || !objects[id]) return;
    const o = objects[id];
    task = {id, side:o.side, source:{x:o.x,y:o.y}, dest:{...(o.placed ? o.home : o.goal)}, returning:o.placed, start:{...hands[o.side]}};
    mode = 'pick'; elapsed = 0;
    $('object-invitation').style.opacity = '0';
    $('drop-target').setAttribute('transform', `translate(${task.dest.x - 355} ${task.dest.y - 430})`);
    document.querySelectorAll('.scene-object').forEach(el => { el.classList.add('busy'); el.setAttribute('aria-disabled','true'); });
    if (reducedMotion) {
      Object.assign(o, task.dest); o.placed = !task.returning;
      finish(); renderPose(1); return;
    }
    setPhase('observe'); renderMessages(); startLoop();
  }
  function updatePick(dt) {
    elapsed += dt;
    const t = elapsed, o = objects[task.id], side = task.side;
    const start = task.start;
    const above = {x: task.source.x, y:task.source.y-67};
    const pickup = {x:task.source.x, y:task.source.y-29};
    const lift = {x:task.source.x, y:task.source.y-100};
    const transit = {x:task.dest.x, y:task.dest.y-100};
    const place = {x:task.dest.x,y:task.dest.y-29};
    if (t < .42) { setPhase('observe'); hands[side] = {...start}; }
    else if (t < .9) { setPhase('plan'); hands[side] = {...start}; }
    else if (t < 2.05) { setPhase('reach'); hands[side] = move(start,above,t,.9,1.15); }
    else if (t < 2.65) { hands[side] = move(above,pickup,t,2.05,.6); }
    else if (t < 3) { setPhase('grasp'); hands[side] = {...pickup}; }
    else if (t < 3.85) { setPhase('lift'); hands[side] = move(pickup,lift,t,3,.85); }
    else if (t < 4.8) { hands[side] = move(lift,transit,t,3.85,.95); }
    else if (t < 5.65) { setPhase('place'); hands[side] = move(transit,place,t,4.8,.85); }
    else if (t < 5.95) { hands[side] = {...place}; }
    else if (t < 6.8) { hands[side] = move(place,home[side],t,5.95,.85); }
    else { Object.assign(o, task.dest); o.placed = !task.returning; finish(); return; }
    if (t >= 3 && t < 5.65) {
      o.x = hands[side].x; o.y = hands[side].y+29;
      $('object-'+task.id).classList.add('held');
    } else if (t >= 5.65) {
      Object.assign(o,task.dest); o.placed = !task.returning;
      $('object-'+task.id).classList.remove('held');
    }
  }
  function wave() {
    if (mode !== 'idle' || paused) return;
    if (reducedMotion) { setPhase('wave'); renderPose(1); return; }
    mode = 'wave'; elapsed = 0; setPhase('wave'); renderMessages(); startLoop();
  }
  function updateWave(dt) {
    elapsed += dt;
    const t = elapsed, straight = {x:648.99, y:239}, greeting = {x:555,y:165};
    if (t < .6) hands.right = move(home.right, straight,t,0,.6);
    else if (t < 1.2) hands.right = move(straight,greeting,t,.6,.6);
    else if (t < 3) hands.right = {x:555+Math.sin((t-1.2)*8)*7,y:165+Math.sin((t-1.2)*8)*3};
    else if (t < 3.6) hands.right = move(greeting,straight,t,3,.6);
    else if (t < 4.2) hands.right = move(straight,home.right,t,3.6,.6);
    else { mode = 'idle'; setPhase('idle'); renderMessages(); }
  }
  function reset() {
    mode = 'idle'; task = null; elapsed = 0; phase = 'idle';
    for (const o of Object.values(objects)) { Object.assign(o,o.home); o.placed = false; }
    hands.left = {...home.left}; hands.right = {...home.right}; gaze = {x:0,y:0}; targetGaze = {x:0,y:0};
    document.querySelectorAll('.scene-object').forEach(el => { el.classList.remove('busy','held'); el.removeAttribute('aria-disabled'); });
    $('object-invitation').style.opacity = '1';
    $('drop-target').removeAttribute('transform');
    $('path-annotation').setAttribute('opacity','0');
    renderMessages(); renderPose(1); startLoop();
  }
  function frame(timestamp) {
    raf = 0;
    if (paused || !visible || document.hidden || reducedMotion) {lastFrame = 0; return;}
    const dt = lastFrame ? Math.min((timestamp-lastFrame)/1000,.05) : 1/60;
    lastFrame = timestamp; sceneTime += dt;
    if (mode === 'pick') updatePick(dt);
    else if (mode === 'wave') updateWave(dt);
    renderPose(dt);
    raf = requestAnimationFrame(frame);
  }
  function startLoop() {
    if (!raf && !paused && visible && !document.hidden && !reducedMotion) {
      lastFrame = 0; raf = requestAnimationFrame(frame);
    }
  }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
  function setPaused(value) { paused = Boolean(value); if (paused) stopLoop(); else startLoop(); renderMessages(); }
  $('motion-toggle').addEventListener('click', () => setPaused(!paused));
  $('pick-button').addEventListener('click', () => pick(objects.coral.placed && !objects.sage.placed ? 'sage' : 'coral'));
  $('wave-button').addEventListener('click', wave);
  $('reset-button').addEventListener('click', reset);
  $('robot-head').style.cursor = 'pointer';
  $('robot-head').addEventListener('click', wave);
  document.querySelectorAll('[data-object]').forEach(el => {
    el.addEventListener('click', () => pick(el.dataset.object));
    el.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); pick(el.dataset.object);} });
  });
  $('home').addEventListener('pointermove', event => {
    if (reducedMotion || paused || event.pointerType === 'touch') return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    targetGaze = {x:clamp((point.x-367)/220,-1,1),y:clamp((point.y-140)/240,-.8,.8)};
  },{passive:true});
  $('home').addEventListener('pointerleave', () => {targetGaze = {x:0,y:0};}, {passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {visible = entries[0].isIntersecting; if (visible) startLoop(); else stopLoop();}, {threshold:0}).observe(playground);
    const navLinks = [...document.querySelectorAll('nav a')];
    new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(a => a.classList.toggle('active',a.hash === '#'+entry.target.id)); });
    }, {rootMargin:'-15% 0px -60% 0px',threshold:0}).observe($('research'));
    for (const id of ['about','contact']) new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(a => a.classList.toggle('active',a.hash === '#'+entry.target.id)); });
    }, {rootMargin:'-15% 0px -45% 0px',threshold:0}).observe($(id));
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stopLoop() : startLoop());
  reducedQuery.addEventListener('change', () => {reducedMotion = reducedQuery.matches; stopLoop(); reset(); startLoop();});
  // Small public API makes the scene easy to test or extend without exposing its DOM internals.
  window.RobotPlayground = Object.freeze({pick, wave, reset, pause: setPaused,
    getState: () => ({mode,phase,elapsed,paused,reducedMotion,objects:JSON.parse(JSON.stringify(objects)),gaze:{...gaze}})});
  languageUpdate(); renderPose(1); startLoop();
})();
