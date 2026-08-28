let courses = [
  {id:'basica', icon:'⌨', title:'Informática básica', level:'iniciante', lessons:8, time:'1h 40min', description:'Use o computador, organize arquivos e navegue com confiança.'},
  {id:'seguranca', icon:'◉', title:'Segurança digital', level:'iniciante', lessons:6, time:'1h 10min', description:'Proteja suas contas, reconheça golpes e cuide dos seus dados.'},
  {id:'web', icon:'</>', title:'Desenvolvimento web', level:'intermediario', lessons:12, time:'3h 20min', description:'Crie suas primeiras páginas com HTML, CSS e JavaScript.'},
  {id:'curriculo', icon:'▤', title:'Currículo que se destaca', level:'iniciante', lessons:5, time:'55min', description:'Apresente suas experiências e habilidades com clareza.'},
  {id:'portfolio', icon:'◇', title:'Portfólio profissional', level:'intermediario', lessons:7, time:'1h 30min', description:'Organize seus projetos e mostre o que você sabe fazer.'},
  {id:'selecao', icon:'●', title:'Processos seletivos', level:'iniciante', lessons:6, time:'1h 15min', description:'Prepare-se para candidaturas, entrevistas e dinâmicas.'}
];

const defaultState = {completed:[], diagnostic:null, feedback:[]};
const state = {...defaultState, ...JSON.parse(localStorage.getItem('conectatech-state') || '{}')};
const grid = document.querySelector('#course-grid');
const opportunityList = document.querySelector('#opportunity-list');
const supabaseStatus = document.querySelector('#supabase-status');
const authStatus = document.querySelector('#auth-status');
const signOutButton = document.querySelector('#signout-button');
const headerAuthStatus = document.querySelector('#header-auth-status');
const loginLink = document.querySelector('#login-link');
const progressLink = document.querySelector('#progress-link');
const headerSignOut = document.querySelector('#header-signout');
const accountBadge = document.querySelector('#account-badge');
const dashboardSection = document.querySelector('#painel');
const connectedStat = document.querySelector('#connected-stat');
const tracksStat = document.querySelector('#tracks-stat');
const completionStat = document.querySelector('#completion-stat');
const profileProgress = document.querySelector('#profile-progress');
const profileTracks = document.querySelector('#profile-tracks');
const profileDb = document.querySelector('#profile-db');
const authSubmit = document.querySelector('#auth-submit');
const nameField = document.querySelector('#name-field');
let currentCourseId = 'seguranca';
let authMode = 'signin';
let syncedCompletedCount = 0;

function renderCourses(filter = 'todas') {
  const visible = courses.filter(course => filter === 'todas' || course.level === filter);
  grid.innerHTML = visible.map(course => {
    const done = state.completed.includes(course.id);
    return `<article class="course-card">
      <span class="course-icon" aria-hidden="true">${course.icon}</span>
      <h3>${course.title}</h3><p>${course.description}</p>
      <div class="course-meta"><span>${course.level === 'iniciante' ? 'Iniciante' : 'Intermediário'}</span><span>${course.lessons} aulas</span><span>${course.time}</span></div>
      <button class="text-link course-action" data-course="${course.id}" type="button">${done ? 'Revisar aula' : 'Abrir primeira aula'} →</button>
    </article>`;
  }).join('');
}

function renderOpportunities(opportunities) {
  if (!opportunityList || !opportunities?.length) return;
  opportunityList.innerHTML = opportunities.map(opportunity => `
    <article>
      <span class="tag">${opportunity.type}</span>
      <div>
        <h3>${opportunity.title}</h3>
        <p>${[opportunity.organization, opportunity.location, opportunity.deadline ? `Prazo: ${opportunity.deadline}` : 'Inscrições abertas'].filter(Boolean).join(' • ')}</p>
      </div>
      <a href="${opportunity.url || '#oportunidades'}" aria-label="Ver detalhes de ${opportunity.title}">Ver detalhes →</a>
    </article>
  `).join('');
}

function saveState() {
  localStorage.setItem('conectatech-state', JSON.stringify(state));
}

function updateProgress() {
  const percent = Math.round((state.completed.length / courses.length) * 100);
  document.querySelector('#progress-number').textContent = `${percent}%`;
  document.querySelector('#progress-fill').style.width = `${percent}%`;
  document.querySelector('.progress-bar').setAttribute('aria-valuenow', percent);
  document.querySelector('#progress-message').textContent = percent ? `${state.completed.length} de ${courses.length} trilhas com aula iniciada ou concluída. Continue avançando!` : 'Comece uma trilha para acompanhar sua evolução.';
  updateLiveStats(document.body.classList.contains('is-authenticated'));
}

function openDialog(title, copy, label = 'Conte para nós (opcional)') {
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-copy').textContent = copy;
  document.querySelector('label[for="dialog-input"]').textContent = label;
  document.querySelector('#dialog-input').value = '';
  document.querySelector('#dialog').showModal();
}

function recommendCourse(goal) {
  const recommendations = {
    'primeiro-emprego':['processos-seletivos', 'selecao'],
    autonomia:['informatica-basica', 'basica'],
    web:['desenvolvimento-web', 'web'],
    curriculo:['curriculo-profissional', 'curriculo']
  };
  const candidates = recommendations[goal] || [];
  return courses.find(course => candidates.includes(course.id)) || courses[0];
}

function scrollToSection(selector) {
  document.querySelector(selector)?.scrollIntoView({behavior:'smooth', block:'start'});
}

async function completeCourse(courseId) {
  if (!state.completed.includes(courseId)) state.completed.push(courseId);
  syncedCompletedCount = Math.max(syncedCompletedCount, state.completed.length);
  saveState();
  updateProgress();
  renderCourses(document.querySelector('.filter.active').dataset.filter);
  const track = courses.find(course => course.id === courseId);
  if (!window.conectaDb?.isConfigured) return {remote: false};
  return window.conectaDb.saveProgress(track);
}

async function initializeRemoteData() {
  if (!window.conectaDb?.isConfigured) {
    if (supabaseStatus) supabaseStatus.textContent = 'Supabase não configurado. O protótipo está usando dados locais.';
    return;
  }
  try {
    const [remoteTracks, remoteOpportunities] = await Promise.all([
      window.conectaDb.listTracks(),
      window.conectaDb.listOpportunities()
    ]);
    if (remoteTracks?.length) courses = remoteTracks;
    renderOpportunities(remoteOpportunities);
    if (supabaseStatus) supabaseStatus.textContent = 'Supabase conectado. Trilhas e oportunidades podem vir do banco.';
  } catch (error) {
    console.warn('ConectaTech: usando dados locais porque o Supabase não respondeu.', error);
    if (supabaseStatus) supabaseStatus.textContent = 'Supabase configurado, mas não respondeu. Usando dados locais.';
  }
}

async function initializeApp() {
  setAuthenticatedUi(null);
  setAuthMode('signin');
  await initializeRemoteData();
  await updateAuthStatus();
  renderCourses();
  updateProgress();
}

async function updateAuthStatus() {
  if (!authStatus) return;
  if (!window.conectaDb?.isConfigured) {
    authStatus.textContent = 'Login indisponível até configurar o Supabase.';
    if (signOutButton) signOutButton.hidden = true;
    setAuthenticatedUi(null);
    return;
  }
  const user = await window.conectaDb.getUser();
  if (user) {
    authStatus.textContent = `Conectado como ${user.email}.`;
    if (signOutButton) signOutButton.hidden = false;
    await refreshRemoteProgressCount();
    setAuthenticatedUi(user);
  } else {
    authStatus.textContent = 'Nenhum usuário conectado.';
    if (signOutButton) signOutButton.hidden = true;
    syncedCompletedCount = 0;
    setAuthenticatedUi(null);
  }
}

async function refreshRemoteProgressCount() {
  if (!window.conectaDb?.isConfigured) return;
  try {
    syncedCompletedCount = Math.max(state.completed.length, await window.conectaDb.countCompletedLessons());
  } catch (error) {
    syncedCompletedCount = state.completed.length;
    console.warn('ConectaTech: não foi possível ler progresso remoto.', error);
  }
}

function setAuthenticatedUi(user) {
  const signedIn = Boolean(user);
  document.body.classList.toggle('is-authenticated', signedIn);
  if (headerAuthStatus) headerAuthStatus.textContent = signedIn ? `Logado: ${user.email}` : 'Visitante';
  if (accountBadge) accountBadge.textContent = signedIn ? 'Logado' : 'Visitante';
  if (loginLink) loginLink.hidden = signedIn;
  if (progressLink) progressLink.hidden = !signedIn;
  if (headerSignOut) headerSignOut.hidden = !signedIn;
  if (dashboardSection) dashboardSection.hidden = !signedIn;
  updateLiveStats(signedIn);
}

function updateLiveStats(signedIn) {
  const completedCount = signedIn ? Math.max(state.completed.length, syncedCompletedCount) : 0;
  const percent = signedIn ? Math.round((completedCount / courses.length) * 100) : 0;
  if (connectedStat) connectedStat.textContent = signedIn ? '1' : '0';
  if (tracksStat) tracksStat.textContent = String(courses.length);
  if (completionStat) completionStat.textContent = `${percent}%`;
  if (profileProgress) profileProgress.textContent = `${percent}%`;
  if (profileTracks) profileTracks.textContent = signedIn ? `${completedCount}/${courses.length}` : `0/${courses.length}`;
  if (profileDb) profileDb.textContent = window.conectaDb?.isConfigured ? 'Online' : 'Local';
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-mode').forEach(button => {
    const active = button.dataset.authMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  if (authSubmit) {
    authSubmit.dataset.authAction = mode;
    authSubmit.textContent = mode === 'signup' ? 'Criar conta' : 'Entrar';
  }
  if (nameField) nameField.hidden = mode !== 'signup';
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); });
  button.classList.add('active');
  button.setAttribute('aria-pressed','true');
  renderCourses(button.dataset.filter);
}));

document.querySelectorAll('.auth-mode').forEach(button => button.addEventListener('click', () => {
  setAuthMode(button.dataset.authMode);
}));

document.querySelector('#auth-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const action = event.submitter?.dataset.authAction || authMode;
  const formData = new FormData(event.currentTarget);
  const email = formData.get('email');
  const password = formData.get('password');
  const name = formData.get('name');

  if (!window.conectaDb?.isConfigured) {
    authStatus.textContent = 'Preencha supabase-config.js antes de usar login.';
    return;
  }

  authStatus.textContent = action === 'signup' ? 'Criando conta...' : 'Entrando...';
  const {error} = action === 'signup'
    ? await window.conectaDb.signUp(email, password, name)
    : await window.conectaDb.signIn(email, password);

  if (error) {
    authStatus.textContent = `Não foi possível ${action === 'signup' ? 'criar a conta' : 'entrar'}: ${error.message}`;
    return;
  }

  authStatus.textContent = action === 'signup'
    ? 'Conta criada. Se o Supabase pedir confirmação por e-mail, confirme antes de entrar.'
    : 'Login realizado.';
  await updateAuthStatus();
});

signOutButton?.addEventListener('click', async () => {
  authStatus.textContent = 'Saindo...';
  const {error} = await window.conectaDb.signOut();
  authStatus.textContent = error ? `Não foi possível sair: ${error.message}` : 'Você saiu da conta.';
  await updateAuthStatus();
});

headerSignOut?.addEventListener('click', async () => {
  authStatus.textContent = 'Saindo...';
  const {error} = await window.conectaDb.signOut();
  authStatus.textContent = error ? `Não foi possível sair: ${error.message}` : 'Você saiu da conta.';
  await updateAuthStatus();
  scrollToSection('#conta');
});

window.conectaDb?.onAuthStateChange?.(() => {
  updateAuthStatus();
});

document.querySelector('#diagnostic-form').addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const support = formData.getAll('support');
  const recommended = recommendCourse(formData.get('goal'));
  const payload = {
    goal: formData.get('goal'),
    device: formData.get('device'),
    connection: formData.get('connection'),
    support
  };
  state.diagnostic = {
    ...payload,
    recommended: recommended.id,
    savedAt: new Date().toISOString()
  };
  saveState();
  document.querySelector('#diagnostic-result').textContent = `Diagnóstico salvo. Recomendação inicial: ${recommended.title}.`;
  if (window.conectaDb?.isConfigured) {
    window.conectaDb.saveDiagnostic(payload, recommended.remoteId)
      .then(result => {
        if (result.remote) document.querySelector('#diagnostic-result').textContent += ' Também foi enviado ao banco.';
        if (result.reason === 'login_required') document.querySelector('#diagnostic-result').textContent += ' Faça login futuramente para sincronizar com sua conta.';
      })
      .catch(() => {
        document.querySelector('#diagnostic-result').textContent += ' Não foi possível enviar ao banco agora.';
      });
  }
});

grid.addEventListener('click', event => {
  const button = event.target.closest('.course-action');
  if (!button) return;
  const selected = courses.find(course => course.id === button.dataset.course);
  currentCourseId = selected.id;
  document.querySelector('#lesson-title').textContent = `${selected.title}: aula inicial`;
  scrollToSection('#aula');
  document.querySelector('#lesson-result').textContent = 'Aula aberta. Leia o conteúdo e responda ao exercício para registrar progresso.';
});

document.querySelector('#lesson-form').addEventListener('submit', event => {
  event.preventDefault();
  const answer = new FormData(event.currentTarget).get('answer');
  if (!answer) {
    document.querySelector('#lesson-result').textContent = 'Escolha uma alternativa antes de concluir.';
    return;
  }
  if (answer !== 'two-factor') {
    document.querySelector('#lesson-result').textContent = 'Quase lá: a opção mais segura é ativar a verificação em duas etapas.';
    return;
  }
  completeCourse(currentCourseId)
    .then(result => {
      if (result?.remote) document.querySelector('#lesson-result').textContent += ' Também foi sincronizado com o banco.';
      if (result?.reason === 'login_required') document.querySelector('#lesson-result').textContent += ' Entre na sua conta para sincronizar com o banco.';
    })
    .catch(() => {
      document.querySelector('#lesson-result').textContent += ' Não foi possível sincronizar com o banco agora.';
    });
  document.querySelector('#lesson-result').textContent = 'Resposta correta. Aula concluída e progresso salvo neste aparelho.';
  scrollToSection(dashboardSection?.hidden ? '#conta' : '#painel');
});

document.querySelector('#continue-button').addEventListener('click', () => {
  const target = state.diagnostic?.recommended || 'seguranca';
  document.querySelector(`.course-action[data-course="${target}"]`)?.click();
});

document.querySelectorAll('.resource-action').forEach(button => button.addEventListener('click', () => openDialog(`Seu ${button.dataset.resource}`, 'Este protótipo apresenta o ponto de entrada do recurso. O fluxo completo será conectado ao perfil do usuário.')));

document.querySelector('#feedback-form').addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    rating: formData.get('rating'),
    comment: formData.get('comment')
  };
  state.feedback.push({
    ...payload,
    sentAt: new Date().toISOString()
  });
  saveState();
  document.querySelector('#feedback-result').textContent = 'Feedback registrado neste aparelho. Obrigado por ajudar a melhorar a ConectaTech.';
  if (window.conectaDb?.isConfigured) {
    window.conectaDb.saveFeedback(payload)
      .then(result => {
        if (result.remote) document.querySelector('#feedback-result').textContent = 'Feedback registrado neste aparelho e enviado ao banco.';
      })
      .catch(() => {
        document.querySelector('#feedback-result').textContent += ' O envio ao banco será tentado novamente em uma versão com fila offline.';
      });
  }
  event.currentTarget.reset();
});

document.querySelector('#feedback-button').addEventListener('click', () => openDialog('Relatar uma barreira', 'Descreva a dificuldade encontrada. O relato será analisado pela equipe de acessibilidade.', 'Qual barreira você encontrou?'));

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const open = document.querySelector('#main-nav').classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
});

document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#main-nav').classList.remove('open');
  menuButton.setAttribute('aria-expanded','false');
}));

document.querySelector('#text-size').addEventListener('click', () => {
  document.body.classList.toggle('large-text');
  localStorage.setItem('conectatech-large-text', document.body.classList.contains('large-text'));
});

const contrast = document.querySelector('#contrast');
contrast.addEventListener('click', () => {
  const active = document.body.classList.toggle('high-contrast');
  contrast.setAttribute('aria-pressed', active);
  localStorage.setItem('conectatech-contrast', active);
});

if (localStorage.getItem('conectatech-large-text') === 'true') document.body.classList.add('large-text');
if (localStorage.getItem('conectatech-contrast') === 'true') {
  document.body.classList.add('high-contrast');
  contrast.setAttribute('aria-pressed','true');
}

function connectionStatus() {
  document.body.classList.toggle('offline', !navigator.onLine);
  document.querySelector('#offline-status').textContent = navigator.onLine ? '' : 'Você está offline. O conteúdo salvo continua disponível.';
}

addEventListener('online', connectionStatus);
addEventListener('offline', connectionStatus);
connectionStatus();

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

initializeApp();
