import {TRAINERS_CATEGORIES} from './trainers-data.mjs';
import {bootPlayEmbeds} from './play-embed.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '').trim();
  if (!raw) {
    return null;
  }
  const [categoryId, trainerId] = raw.split('/').map((p) => p.trim()).filter(Boolean);
  if (!categoryId) {
    return null;
  }
  const category = TRAINERS_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return null;
  }
  const trainer =
    trainerId && category.trainers.some((t) => t.id === trainerId)
      ? trainerId
      : category.trainers[0]?.id;
  return {categoryId, trainerId: trainer};
}

function mountTrainersHub(host) {
  const hash = parseHash();
  let categoryId = hash?.categoryId ?? 'sql';
  let trainerId = hash?.trainerId ?? TRAINERS_CATEGORIES[0].trainers[0].id;

  host.className = 'itu-trainers-hub itu-trainers-hub--mounted';
  host.innerHTML = `
    <div class="itu-trainers-hub__card">
      <h3 class="itu-trainers-hub__title">Тренажёры Вселенной IT</h3>
      <p class="itu-trainers-hub__lead">SQL, терминалы, Git, Docker и другие темы. Выберите категорию и тренажёр.</p>
      <div class="itu-trainers-hub__categories" role="tablist"></div>
      <div class="itu-trainers-hub__trainers"></div>
      <div class="itu-trainers-hub__panel"></div>
      <p class="itu-trainers-hub__article"></p>
      <p class="itu-trainers-hub__hint">
        Экзамены — <a href="/lab/Экзамены/intro">Лаборатория → Экзамены</a>.
        Внешние площадки — <a href="/lab/Тренажеры/2">обзор онлайн-тренажёров</a>.
      </p>
    </div>`;

  const categoriesEl = host.querySelector('.itu-trainers-hub__categories');
  const trainersEl = host.querySelector('.itu-trainers-hub__trainers');
  const panelEl = host.querySelector('.itu-trainers-hub__panel');
  const articleEl = host.querySelector('.itu-trainers-hub__article');

  function getCategory() {
    return TRAINERS_CATEGORIES.find((c) => c.id === categoryId) ?? TRAINERS_CATEGORIES[0];
  }

  function getTrainer() {
    const category = getCategory();
    return category.trainers.find((t) => t.id === trainerId) ?? category.trainers[0];
  }

  function renderEmbed(trainer) {
    panelEl.innerHTML = '';
    if (!trainer?.embed) {
      return;
    }
    const embed = trainer.embed;
    const div = document.createElement('div');
    div.className = 'itu-play-embed';
    div.dataset.example = embed.example ?? '';
    div.dataset.src = embed.src ?? '';
    div.dataset.title = embed.title ?? '';
    div.dataset.minHeight = String(embed.minHeight ?? 420);
    div.dataset.playProps = JSON.stringify(embed.playProps ?? {});
    panelEl.append(div);
    bootPlayEmbeds();
  }

  function syncHash() {
    window.history.replaceState(null, '', `#${categoryId}/${trainerId}`);
  }

  function renderCategories() {
    categoriesEl.innerHTML = '';
    for (const cat of TRAINERS_CATEGORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'itu-trainers-hub__cat-btn' + (cat.id === categoryId ? ' is-active' : '');
      btn.textContent = cat.label;
      btn.addEventListener('click', () => {
        categoryId = cat.id;
        trainerId = cat.trainers[0]?.id ?? '';
        syncHash();
        renderAll();
      });
      categoriesEl.append(btn);
    }
  }

  function renderTrainers() {
    trainersEl.innerHTML = '';
    const category = getCategory();
    for (const t of category.trainers) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'itu-trainers-hub__trainer-btn' + (t.id === trainerId ? ' is-active' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', () => {
        trainerId = t.id;
        syncHash();
        renderAll();
      });
      trainersEl.append(btn);
    }
  }

  function renderAll() {
    renderCategories();
    renderTrainers();
    const trainer = getTrainer();
    renderEmbed(trainer);
    if (trainer?.article) {
      articleEl.innerHTML = `<a href="${trainer.article}" target="_blank" rel="noopener noreferrer">Подробнее в статье →</a>`;
    } else {
      articleEl.innerHTML = '';
    }
  }

  window.addEventListener('hashchange', () => {
    const next = parseHash();
    if (!next) {
      return;
    }
    categoryId = next.categoryId;
    trainerId = next.trainerId;
    renderAll();
  });

  renderAll();
}

function bootTrainersHubs() {
  for (const host of document.querySelectorAll('.itu-trainers-hub:not(.itu-trainers-hub--mounted)')) {
    mountTrainersHub(host);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootTrainersHubs);
} else {
  bootTrainersHubs();
}

export {bootTrainersHubs};
