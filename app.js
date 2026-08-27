const courses = [
  {id:'basica', icon:'⌨', title:'Informática básica', level:'iniciante', lessons:8, time:'1h 40min', description:'Use o computador, organize arquivos e navegue com confiança.'},
  {id:'seguranca', icon:'◉', title:'Segurança digital', level:'iniciante', lessons:6, time:'1h 10min', description:'Proteja suas contas, reconheça golpes e cuide dos seus dados.'},
  {id:'web', icon:'</>', title:'Desenvolvimento web', level:'intermediario', lessons:12, time:'3h 20min', description:'Crie suas primeiras páginas com HTML, CSS e JavaScript.'},
  {id:'curriculo', icon:'▤', title:'Currículo que se destaca', level:'iniciante', lessons:5, time:'55min', description:'Apresente suas experiências e habilidades com clareza.'},
  {id:'portfolio', icon:'◇', title:'Portfólio profissional', level:'intermediario', lessons:7, time:'1h 30min', description:'Organize seus projetos e mostre o que você sabe fazer.'},
  {id:'selecao', icon:'◎', title:'Processos seletivos', level:'iniciante', lessons:6, time:'1h 15min', description:'Prepare-se para candidaturas, entrevistas e dinâmicas.'}
];

const state = JSON.parse(localStorage.getItem('conectatech-state') || '{"completed":[]}');
const clientId = localStorage.getItem('conectatech-client-id') || (crypto.randomUUID?.() || `client-${Date.now()}`);
localStorage.setItem('conectatech-client-id', clientId);
const grid = document.querySelector('#course-grid');

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {'X-Client-Id': clientId, 'Content-Type': 'application/json', ...(options.headers || {})}
  });
  if (!response.ok) throw new Error(`API indisponível (${response.status})`);
  return response.json();
}

function renderCourses(filter = 'todas') {
  const visible = courses.filter(course => filter === 'todas' || course.level === filter);
  grid.innerHTML = visible.map(course => {
    const done = state.completed.includes(course.id);
    return `<article class="course-card">
      <span class="course-icon" aria-hidden="true">${course.icon}</span>
      <h3>${course.title}</h3><p>${course.description}</p>
      <div class="course-meta"><span>${course.level === 'iniciante' ? 'Iniciante' : 'Intermediário'}</span><span>${course.lessons} aulas</span><span>${course.time}</span></div>
      <button class="text-link course-action" data-course="${course.id}" type="button">${done ? 'Revisar trilha' : 'Começar trilha'} →</button>
    </article>`;
  }).join('');
}

function saveState() { localStorage.setItem('conectatech-state', JSON.stringify(state)); }
function updateProgress() {
  const percent = Math.round((state.completed.length / courses.length) * 100);
  document.querySelector('#progress-number').textContent = `${percent}%`;
  document.querySelector('#progress-fill').style.width = `${percent}%`;
  document.querySelector('.progress-bar').setAttribute('aria-valuenow', percent);
  document.querySelector('#progress-message').textContent = percent ? `${state.completed.length} de ${courses.length} trilhas iniciadas. Continue avançando!` : 'Comece uma trilha para acompanhar sua evolução.';
}

function openDialog(title, copy, label = 'Conte para nós (opcional)', category = 'geral') {
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-copy').textContent = copy;
  document.querySelector('label[for="dialog-input"]').textContent = label;
  document.querySelector('#dialog-input').value = '';
  document.querySelector('#dialog').dataset.category = category;
  document.querySelector('#dialog').showModal();
}

renderCourses(); updateProgress();

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); });
  button.classList.add('active'); button.setAttribute('aria-pressed','true'); renderCourses(button.dataset.filter);
}));

grid.addEventListener('click', event => {
  const button = event.target.closest('.course-action'); if (!button) return;
  if (!state.completed.includes(button.dataset.course)) state.completed.push(button.dataset.course);
  saveState(); updateProgress(); renderCourses(document.querySelector('.filter.active').dataset.filter);
  api('/progress', {method: 'POST', body: JSON.stringify({courseId: button.dataset.course})}).catch(() => {});
  openDialog('Trilha disponível!', 'Seu progresso foi salvo neste aparelho. Na versão integrada, este botão abre a primeira aula e baixa o material escolhido.', 'Alguma necessidade de acessibilidade?');
});

document.querySelector('#continue-button').addEventListener('click', () => document.querySelector('.course-action')?.click());
document.querySelectorAll('.resource-action').forEach(button => button.addEventListener('click', () => openDialog(`Seu ${button.dataset.resource}`, 'Este protótipo apresenta o ponto de entrada do recurso. O fluxo completo será conectado ao perfil do usuário.')));
document.querySelector('#feedback-button').addEventListener('click', () => openDialog('Relatar uma barreira', 'Descreva a dificuldade encontrada. O relato será analisado pela equipe de acessibilidade.', 'Qual barreira você encontrou?', 'barreira'));

document.querySelector('#dialog form').addEventListener('submit', event => {
  const message = document.querySelector('#dialog-input').value.trim();
  if (event.submitter?.value !== 'confirm' || !message) return;
  api('/feedback', {method:'POST', body:JSON.stringify({category:document.querySelector('#dialog').dataset.category, message})})
    .then(result => { document.querySelector('#offline-status').textContent = `Mensagem registrada. Protocolo ${result.protocol}.`; document.querySelector('#offline-status').style.display = 'block'; setTimeout(() => document.querySelector('#offline-status').style.removeProperty('display'), 5000); })
    .catch(() => { localStorage.setItem(`conectatech-feedback-${Date.now()}`, JSON.stringify({message, category:document.querySelector('#dialog').dataset.category})); });
});

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => { const open = document.querySelector('#main-nav').classList.toggle('open'); menuButton.setAttribute('aria-expanded', open); });
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => { document.querySelector('#main-nav').classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); }));

document.querySelector('#text-size').addEventListener('click', () => {
  document.body.classList.toggle('large-text');
  localStorage.setItem('conectatech-large-text', document.body.classList.contains('large-text'));
});
const contrast = document.querySelector('#contrast');
contrast.addEventListener('click', () => { const active = document.body.classList.toggle('high-contrast'); contrast.setAttribute('aria-pressed', active); localStorage.setItem('conectatech-contrast', active); });
if (localStorage.getItem('conectatech-large-text') === 'true') document.body.classList.add('large-text');
if (localStorage.getItem('conectatech-contrast') === 'true') { document.body.classList.add('high-contrast'); contrast.setAttribute('aria-pressed','true'); }

function connectionStatus() { document.body.classList.toggle('offline', !navigator.onLine); document.querySelector('#offline-status').textContent = navigator.onLine ? '' : 'Você está offline. O conteúdo salvo continua disponível.'; }
addEventListener('online', connectionStatus); addEventListener('offline', connectionStatus); connectionStatus();

async function mergeRemoteProgress() {
  try {
    const remote = await api('/progress');
    state.completed = [...new Set([...state.completed, ...remote.completed])];
    saveState(); updateProgress(); renderCourses(document.querySelector('.filter.active').dataset.filter);
  } catch (_) { /* O modo estático/offline continua usando armazenamento local. */ }
}
mergeRemoteProgress();

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
