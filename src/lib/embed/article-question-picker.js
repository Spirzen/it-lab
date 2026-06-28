import {
  extractArticleQuestions,
  findArticleRoot,
  pickRandom,
  pickRandomDifferent,
} from './article-extract.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mountArticleQuestionPicker(host) {
  const title = host.dataset.title ?? 'Случайный вопрос';
  const subtitle =
    host.dataset.subtitle ??
    'Вопрос из блоков «Вопрос» в тексте лабораторной работы.';
  const emptyMessage = host.dataset.emptyMessage ?? 'Вопросы не найдены в этой статье.';
  const errorHint =
    host.dataset.errorHint ??
    'Компонент ищет заголовки «#### Вопрос» и берёт ближайший текстовый блок сразу после них.';

  host.classList.add('itu-article-question-picker--mounted');
  host.innerHTML = `
    <div class="itu-article-question-picker__card">
      <h3 class="itu-article-question-picker__title">${escapeHtml(title)}</h3>
      <p class="itu-article-question-picker__subtitle">${escapeHtml(subtitle)}</p>
      <div class="itu-article-question-picker__body" aria-live="polite"></div>
    </div>
  `;

  const bodyEl = host.querySelector('.itu-article-question-picker__body');
  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  let questions = [];
  let current = '';
  let currentIndex = 0;
  let fading = false;
  let copied = false;

  function renderEmptyError(message) {
    bodyEl.innerHTML = `
      <div class="itu-article-question-picker__alert itu-article-question-picker__alert--error">
        ${escapeHtml(message)}
      </div>
      <details class="itu-article-question-picker__hint">
        <summary>Как устроена разметка</summary>
        <p>${escapeHtml(errorHint)}</p>
      </details>
    `;
  }

  function renderQuestion() {
    const canRegenerate = questions.length > 1;
    bodyEl.innerHTML = `
      ${
        questions.length > 0
          ? `<span class="itu-article-question-picker__badge">Вопрос ${currentIndex + 1} из ${questions.length}</span>`
          : ''
      }
      <div class="itu-article-question-picker__question${fading ? ' is-fading' : ''}">
        ${escapeHtml(current)}
      </div>
      ${
        canRegenerate
          ? `<div class="itu-article-question-picker__actions">
              <button type="button" class="itu-article-question-picker__btn itu-article-question-picker__btn--primary" data-action="regenerate">
                Другой вопрос
              </button>
              <button type="button" class="itu-article-question-picker__btn" data-action="copy">
                ${copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>`
          : ''
      }
      <p class="itu-article-question-picker__footnote">
        ${
          isMobile
            ? `* ${questions.length} вопросов из статьи`
            : `* Случайный выбор из ${questions.length} вопросов на странице · клавиша R — ещё вопрос`
        }
      </p>
    `;

    bodyEl.querySelector('[data-action="regenerate"]')?.addEventListener('click', regenerate);
    bodyEl.querySelector('[data-action="copy"]')?.addEventListener('click', copyQuestion);
  }

  function regenerate() {
    if (questions.length <= 1) {
      return;
    }
    fading = true;
    renderQuestion();
    window.setTimeout(() => {
      const next = pickRandomDifferent(questions, current);
      current = next ?? current;
      currentIndex = questions.indexOf(current);
      fading = false;
      copied = false;
      renderQuestion();
    }, 180);
  }

  async function copyQuestion() {
    if (!current) {
      return;
    }
    try {
      await navigator.clipboard.writeText(current);
      copied = true;
      renderQuestion();
    } catch {
      /* ignore */
    }
  }

  function onKeyDown(event) {
    if (event.key !== 'r' && event.key !== 'R') {
      return;
    }
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) {
      return;
    }
    regenerate();
  }

  window.setTimeout(() => {
    const article = findArticleRoot(host);
    questions = extractArticleQuestions(article);
    if (questions.length === 0) {
      renderEmptyError(emptyMessage);
      return;
    }
    current = pickRandom(questions) ?? '';
    currentIndex = questions.indexOf(current);
    renderQuestion();
    window.addEventListener('keydown', onKeyDown);
  }, 280);
}

function bootArticleQuestionPickers() {
  for (const host of document.querySelectorAll(
    '.itu-article-question-picker:not(.itu-article-question-picker--mounted)',
  )) {
    mountArticleQuestionPicker(host);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootArticleQuestionPickers);
} else {
  bootArticleQuestionPickers();
}

document.addEventListener('astro:page-load', bootArticleQuestionPickers);

export {bootArticleQuestionPickers};
