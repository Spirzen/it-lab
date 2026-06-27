/** Каталог встроенных тренажёров (данные из LabTrainersHub KB). */
export const TRAINERS_CATEGORIES = [
  {
    id: 'sql',
    label: 'SQL',
    trainers: [
      {id: 'sql-trainer', label: 'SQL-тренажёр', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-07-sql/111', embed: {example: 'lab/sql-trainer', title: 'SQL-тренажёр', minHeight: 480}},
      {id: 'sql-insert', label: 'INSERT', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-07-sql/5', embed: {example: 'data-markup/sql-insert-trainer', title: 'SQL INSERT — тренажёр', minHeight: 480}},
      {id: 'sql-update', label: 'UPDATE', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-07-sql/5', embed: {example: 'data-markup/sql-update-trainer', title: 'SQL UPDATE — тренажёр', minHeight: 480}},
      {id: 'sql-delete', label: 'DELETE', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-07-sql/5', embed: {example: 'data-markup/sql-delete-trainer', title: 'SQL DELETE — тренажёр', minHeight: 480}},
      {id: 'sql-join', label: 'JOIN', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-07-sql/55', embed: {example: 'about/sql-join-trainer', title: 'SQL JOIN-тренажёр', minHeight: 420}},
    ],
  },
  {
    id: 'shell',
    label: 'Терминал',
    trainers: [
      {id: 'bash', label: 'Bash', article: 'https://spirzen.ru/encyclopedia/5-languages/5-25-bash/intro', embed: {example: 'about/bash-shell-play', title: 'Bash-тренажёр', minHeight: 400, playProps: {lesson: 'basics'}}},
      {id: 'powershell', label: 'PowerShell', article: 'https://spirzen.ru/encyclopedia/5-languages/5-26-powershell/intro', embed: {example: 'languages/power-shell-shell-play', title: 'PowerShell Shell', minHeight: 480, playProps: {lesson: 'intro'}}},
      {id: 'mongo', label: 'MongoDB', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-06-nosql/411', embed: {example: 'data-markup/mongo-shell-play', title: 'MongoDB Shell', minHeight: 480}},
      {id: 'memcached', label: 'Memcached', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-06-nosql/8111', embed: {example: 'data-markup/memcached-shell-play', title: 'Memcached Shell', minHeight: 480}},
    ],
  },
  {
    id: 'devops',
    label: 'Git и DevOps',
    trainers: [
      {id: 'git', label: 'Git: ветки', article: 'https://spirzen.ru/encyclopedia/4-code-dev/4-13-osnovy-raboty-s-git/113', embed: {example: 'code-dev/git-branch-merge-play', title: 'Git — ветки и merge', minHeight: 480}},
      {id: 'docker-compose', label: 'Docker Compose', article: 'https://spirzen.ru/encyclopedia/8-infra-security/8-06-konteynerizatsiya-i-orkestratsiya/1111', embed: {example: 'about/docker-compose-play', title: 'Docker Compose', minHeight: 420}},
      {id: 'docker-hardening', label: 'Docker: безопасность', article: 'https://spirzen.ru/encyclopedia/8-infra-security/8-07-informatsionnaya-bezopasnost/125', embed: {example: 'infra-security/docker-hardening-play', title: 'Hardening Docker', minHeight: 480}},
      {id: 'gitlab-ci', label: 'GitLab CI', article: 'https://spirzen.ru/encyclopedia/8-infra-security/8-04-devops-ci-cd/2113', embed: {example: 'infra-security/git-lab-ci-pipeline-play', title: 'GitLab CI pipeline', minHeight: 520}},
      {id: 'file-ops', label: 'Файлы и папки', article: 'https://tools.spirzen.ru/tools/automation/2', embed: {example: 'tools-automation/file-ops-lab-play', title: 'Файлы и папки', minHeight: 400}},
    ],
  },
  {
    id: 'web',
    label: 'Веб и данные',
    trainers: [
      {id: 'html', label: 'HTML Playground', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-09-html/1', embed: {example: 'about/html-playground', title: 'HTML Playground', minHeight: 420}},
      {id: 'web-editor', label: 'WebEditor', article: 'https://spirzen.ru/encyclopedia/3-data-markup/3-09-html/intro', embed: {src: 'https://html.spirzen.ru/', title: 'WebEditor — HTML/CSS/JS', minHeight: 560}},
      {id: 'regex', label: 'Регулярные выражения', article: 'https://spirzen.ru/encyclopedia/4-code-dev/4-01-algoritmy/111', embed: {example: 'lab/regex-playground-demo', title: 'Regex Playground', minHeight: 420}},
      {id: 'search', label: 'Поисковые запросы', article: 'https://spirzen.ru/encyclopedia/1-basics/1-21-poisk-informatsii/3', embed: {example: 'basics/search-query-lab', title: 'Поисковые запросы', minHeight: 420}},
      {id: 'soap', label: 'SOAP', article: 'https://spirzen.ru/encyclopedia/2-system-network/2-09-osnovy-integratsionnogo-vzaimodeystviya/126', embed: {example: 'system-network/soap-trainer', title: 'Тренажёр SOAP', minHeight: 480}},
    ],
  },
  {
    id: 'practice',
    label: 'Практика',
    trainers: [
      {id: 'programming-tasks', label: 'Задачи разработчика', article: 'https://spirzen.ru/encyclopedia/4-code-dev/4-02-chto-takoe-kod-i-kak-on-rabotaet/613', embed: {example: 'code-dev/programming-tasks-play', title: 'Задачи по программированию', minHeight: 480}},
      {id: 'english', label: 'IT-английский', article: 'https://spirzen.ru/encyclopedia/1-basics/1-30-angliyskiy-yazyk/2', embed: {example: 'about/english-vocabulary-trainer', title: 'IT-английский', minHeight: 480}},
      {id: 'netiquette', label: 'Нетикет', article: 'https://spirzen.ru/encyclopedia/9-spinoff/9-10-internet-kultura/113', embed: {example: 'spinoff/netiquette-play', title: 'Нетикет', minHeight: 480}},
    ],
  },
];
