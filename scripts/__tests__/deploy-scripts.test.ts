// @vitest-environment node
/**
 * Скрипты деплоя: имя БД из Postgres и проверка конфига nginx.
 *
 * 1. sync_db_name_from_running_db берёт имя базы из pg_database и писал его в .env
 *    через sed без проверки, а deploy.sh потом исполняет .env как shell
 *    (`set -a; . "$ENV_FILE"`). Суперпользователь БД мог назвать базу `a$(команда)`,
 *    `a;команда` или `x\nP=$(команда)` и получить выполнение команд на сервере при
 *    деплое. Тесты запускают функции ИЗ САМИХ скриптов (не копии) с заглушкой docker.
 * 2. deploy.sh делал `up -d`, а затем безусловно `restart nginx`: опечатка в
 *    default.conf оставляла сайт без nginx. Теперь перед применением конфига идёт
 *    nginx -t, и при ошибке перезапуска нет. docker в CI нет, поэтому на PATH стоят
 *    заглушки docker / docker-compose / git, а тест смотрит журнал вызовов.
 * 3. Проверка касается и того, что уже лежит в .env: DB_NAME с подстановкой, записанный
 *    прежней версией скрипта, не должен исполняться на каждом следующем деплое.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../..')
const LIB = path.join(REPO_ROOT, 'scripts/lib/validate-db-name.sh')
const DEPLOY = path.join(REPO_ROOT, 'scripts/deploy.sh')
const PROD_UP = path.join(REPO_ROOT, 'scripts/prod-up.sh')

const tmpDirs: string[] = []
function tmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savage-deploy-test-'))
  tmpDirs.push(dir)
  return dir
}
afterAll(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true })
})

function bash(script: string, env: Record<string, string> = {}, args: string[] = []) {
  return spawnSync('bash', ['-c', script, 'bash', ...args], {
    encoding: 'utf-8',
    env: { PATH: process.env.PATH ?? '', HOME: os.tmpdir(), ...env },
  })
}

describe('is_valid_db_name', () => {
  const valid = ['savage_movie', 'savage_movie_v2', '_db', 'A1', 'SavageMovie2', 'a'.repeat(63)]

  const invalid: Array<[string, string]> = [
    ['', 'пустое имя'],
    ['a'.repeat(64), 'длиннее 63 байт'],
    ['1abc', 'начинается с цифры'],
    ['sav-age', 'дефис'],
    ['sav.age', 'точка'],
    ['sav age', 'пробел'],
    ['a$(touch /tmp/x)', 'подстановка команды'],
    ['a`touch /tmp/x`', 'обратные кавычки'],
    ['a;touch /tmp/x', 'точка с запятой'],
    ['a|b', 'пайп (разделитель sed)'],
    ['a&b', 'амперсанд (подстановка в sed)'],
    ["a'b", 'одинарная кавычка'],
    ['a"b', 'двойная кавычка'],
    ['a\\b', 'обратный слэш'],
    ['x\\nP=$(touch /tmp/x)', 'литеральный \\n: GNU sed делает из него перевод строки'],
    ['a\nb', 'настоящий перевод строки'],
    ['abc\n', 'перевод строки в конце'],
    ['a\tb', 'табуляция'],
    ['база', 'кириллица'],
    ['caf\u00e9', 'не-ASCII буква'],
  ]

  const check = (name: string, env: Record<string, string> = {}) =>
    bash('. "$1"; is_valid_db_name "$2"', env, [LIB, name]).status

  it.each(valid)('пропускает %s', name => {
    expect(check(name)).toBe(0)
  })

  it.each(invalid)('отклоняет %j (%s)', name => {
    expect(check(name)).toBe(1)
  })

  it('не зависит от локали: в UTF-8 кириллица и é тоже отклоняются', () => {
    for (const locale of ['C.UTF-8', 'en_US.UTF-8', 'ru_RU.UTF-8']) {
      expect(check('база', { LC_ALL: locale }), locale).toBe(1)
      expect(check('caf\u00e9', { LC_ALL: locale }), locale).toBe(1)
      expect(check('savage_movie', { LC_ALL: locale }), locale).toBe(0)
    }
  })

  it('warn_invalid_db_name не выводит управляющие символы как есть', () => {
    const result = bash('. "$1"; warn_invalid_db_name "$2"', {}, [LIB, 'a\u001b[31m\nb'])

    expect(result.stdout).not.toContain('\u001b')
    expect(result.stdout).toContain('в .env не записываю')
  })
})

/**
 * Прогон реальной sync_db_name_from_running_db из скрипта: функции вырезаются из файла
 * как есть, docker заменён заглушкой, которая «возвращает» заданное имя базы.
 * Дальше — ровно то, что делает deploy.sh: исполняет .env как shell.
 */
function runSync(script: string, dbName: string, initialEnv: string) {
  const work = tmp()
  const marker = path.join(work, 'PWNED')
  const envFile = path.join(work, '.env')
  const bin = path.join(work, 'bin')
  fs.mkdirSync(bin)
  fs.writeFileSync(envFile, initialEnv)
  fs.writeFileSync(path.join(work, 'dbnames'), `${dbName.replaceAll('{MARKER}', marker)}\n`)
  fs.writeFileSync(
    path.join(bin, 'docker'),
    `#!/bin/bash
case "$1" in
  ps) echo savage_movie_db ;;
  exec) cat "${work}/dbnames" ;;
esac
`,
    { mode: 0o755 }
  )

  const result = bash(
    `
set -uo pipefail
. "$LIB"
eval "$(awk '/^(read_env_var|write_env_var|sync_db_name_from_running_db)\\(\\) \\{/ {p=1} p {print} p && /^}/ {p=0}' "$SCRIPT")"
sync_db_name_from_running_db
( set -a; . "$ENV_FILE" 2>/dev/null; set +a )
`,
    { PATH: `${bin}:${process.env.PATH}`, ENV_FILE: envFile, LIB, SCRIPT: script }
  )

  return {
    ...result,
    exploited: fs.existsSync(marker),
    env: fs.readFileSync(envFile, 'utf-8'),
  }
}

const PAYLOADS: Array<[string, string]> = [
  ['x\\nP=$(touch {MARKER})', 'подстановка через литеральный \\n'],
  ['a$(touch {MARKER})', 'подстановка команды'],
  ['a;touch {MARKER}', 'точка с запятой'],
  ['a`touch {MARKER}`', 'обратные кавычки'],
]

describe.each([
  ['deploy.sh', DEPLOY],
  ['prod-up.sh', PROD_UP],
])('%s: имя БД из Postgres', (_name, script) => {
  describe.each([
    ['DB_NAME не задан', 'JWT_SECRET=dummy\n'],
    ['DB_NAME не совпадает с живой базой', 'DB_NAME=savage_movie\nJWT_SECRET=dummy\n'],
  ])('%s', (_case, initialEnv) => {
    it.each(PAYLOADS)('вредоносное имя %j (%s) не попадает в .env и не исполняется', payload => {
      const result = runSync(script, payload, initialEnv)

      expect(result.exploited, result.stdout).toBe(false)
      expect(result.env).toBe(initialEnv)
      expect(result.stdout).toContain('в .env не записываю')
    })

    it('обычное имя записывается как раньше', () => {
      const result = runSync(script, 'savage_movie_v2', initialEnv)

      expect(result.exploited).toBe(false)
      expect(result.env).toContain('DB_NAME=savage_movie_v2\n')
      expect(result.env).toContain('JWT_SECRET=dummy')
      expect(result.stdout).not.toContain('в .env не записываю')
    })
  })

  it('совпавшее с .env имя не трогает файл', () => {
    const initial = 'DB_NAME=savage_movie\nJWT_SECRET=dummy\n'
    const result = runSync(script, 'savage_movie', initial)

    expect(result.env).toBe(initial)
  })

  it('подключает валидатор из scripts/lib и пишет DB_NAME только после проверки', () => {
    const source = fs.readFileSync(script, 'utf-8')
    const writes = source.match(/write_env_var "DB_NAME"/g) ?? []
    const checks = source.match(/if ! is_valid_db_name "\$detected_db"; then/g) ?? []

    expect(source).toContain('scripts/lib/validate-db-name.sh')
    expect(writes.length).toBeGreaterThan(0)
    expect(checks.length).toBe(writes.length)
    // проверка стоит непосредственно перед каждой записью
    expect(source).toMatch(
      /is_valid_db_name "\$detected_db"; then\s+warn_invalid_db_name "\$detected_db"\s+return 0\s+fi\s+write_env_var "DB_NAME"/
    )
  })
})

describe('контроль самого теста', () => {
  it('без проверки та же цепочка исполняет команду из имени БД (так было до исправления)', () => {
    // Копия прежней логики: запись через sed без валидации и source .env.
    const work = tmp()
    const marker = path.join(work, 'PWNED')
    const envFile = path.join(work, '.env')
    fs.writeFileSync(envFile, 'DB_NAME=savage_movie\n')

    bash(
      `
write_env_var() { sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; }
write_env_var DB_NAME "a;touch $MARKER"
( set -a; . "$ENV_FILE" 2>/dev/null; set +a )
`,
      { ENV_FILE: envFile, MARKER: marker }
    )

    expect(fs.existsSync(marker)).toBe(true)
  })
})

/**
 * deploy.sh целиком, с заглушками. ROOT_DIR выводится из расположения скрипта,
 * поэтому скрипт и lib копируются во временный каталог: git reset, docker и compose
 * ничего реального не трогают, а журнал вызовов показывает, был ли restart.
 */
interface Reply {
  rc: number
  out: string
}

interface DeployOptions {
  /** Состояние контейнера savage_movie_nginx: running | exited | restarting | missing */
  state: string
  /** Ответы последовательных вызовов `docker exec ... nginx -t` (последний повторяется) */
  exec?: Reply[]
  /** То же для одноразового `docker-compose run ... nginx -t` */
  run?: Reply[]
  /** Содержимое .env; {MARKER} заменяется путём файла, который создаст исполненная подстановка */
  env?: string
  /** Базы, которые «вернёт» psql в работающем контейнере БД; без этого контейнера БД нет */
  dbNames?: string
}

const NGINX_OK = [
  'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok',
  'nginx: configuration file /etc/nginx/nginx.conf test is successful',
].join('\n')
const NGINX_BROKEN = [
  'nginx: [emerg] unknown directive "limit_reqq" in /etc/nginx/conf.d/default.conf:140',
  'nginx: configuration file /etc/nginx/nginx.conf test failed',
].join('\n')
const NGINX_NO_UPSTREAM = [
  'nginx: [emerg] host not found in upstream "frontend" in /etc/nginx/conf.d/default.conf:112',
  'nginx: configuration file /etc/nginx/nginx.conf test failed',
].join('\n')
const NGINX_NO_BACKEND = NGINX_NO_UPSTREAM.replace('"frontend"', '"backend"')
const NGINX_TYPO_UPSTREAM = NGINX_NO_UPSTREAM.replace('"frontend"', '"fronted"')
const NGINX_NO_UPSTREAM_AND_BROKEN = [
  'nginx: [emerg] host not found in upstream "frontend" in /etc/nginx/conf.d/default.conf:112',
  'nginx: [emerg] unknown directive "limit_reqq" in /etc/nginx/conf.d/default.conf:140',
  'nginx: configuration file /etc/nginx/nginx.conf test failed',
].join('\n')
const DOCKER_ERROR = 'Error response from daemon: Container is restarting, wait until running'
const NO_VERDICT = 'Error: no such service: nginx'

/** Журнал вызовов: одноразовый контейнер из свежего образа и docker exec в работающем */
const FRESH = 'run --rm -T --no-deps --entrypoint nginx nginx -t'
const EXEC = 'docker exec savage_movie_nginx nginx -t'

function runDeploy(options: DeployOptions) {
  const root = tmp()
  const bin = path.join(root, 'stubs')
  const state = path.join(root, 'state')
  const log = path.join(root, 'calls.log')
  fs.mkdirSync(path.join(root, 'scripts/lib'), { recursive: true })
  fs.mkdirSync(bin)
  fs.mkdirSync(state)
  fs.copyFileSync(DEPLOY, path.join(root, 'scripts/deploy.sh'))
  fs.copyFileSync(LIB, path.join(root, 'scripts/lib/validate-db-name.sh'))
  const marker = path.join(root, 'PWNED')
  const envFile = path.join(root, '.env')
  fs.writeFileSync(
    envFile,
    (options.env ?? 'DB_NAME=savage_movie\nJWT_SECRET=dummy\n').replaceAll('{MARKER}', marker)
  )
  fs.writeFileSync(
    path.join(root, 'dbnames'),
    options.dbNames ? `${options.dbNames.replaceAll('{MARKER}', marker)}\n` : ''
  )
  fs.writeFileSync(path.join(root, 'docker-compose.yml'), 'services: {}\n')
  fs.writeFileSync(log, '')

  // Ответы заглушки по номеру вызова: первый вызов (pre) и второй (post) отвечают
  // по-разному, последний ответ повторяется
  const responder = (name: string, replies: Reply[] = [{ rc: 0, out: NGINX_OK }]) => {
    const branches = replies.map((reply, index) => {
      const pattern = index === replies.length - 1 ? '*' : String(index + 1)
      return `${pattern}) cat <<'EOF_OUT'\n${reply.out}\nEOF_OUT\n    exit ${reply.rc} ;;`
    })
    return [
      `n=$(( $(cat "${state}/${name}" 2>/dev/null || echo 0) + 1 ))`,
      `echo $n > "${state}/${name}"`,
      'case "$n" in',
      ...branches,
      'esac',
    ].join('\n')
  }

  fs.writeFileSync(
    path.join(bin, 'docker'),
    `#!/bin/bash
echo "docker $*" >> "${log}"
case "$1" in
  ps) ${options.dbNames ? 'echo savage_movie_db' : ':'} ;;
  inspect)
    if [ "${options.state}" = missing ]; then exit 1; fi
    echo "${options.state}" ;;
  exec)
    if [ "$2" = savage_movie_db ]; then cat "${root}/dbnames"; exit 0; fi
${responder('exec', options.exec)}
    ;;
  image) exit 0 ;;
  login) cat > /dev/null ;;
esac
exit 0
`,
    { mode: 0o755 }
  )

  fs.writeFileSync(
    path.join(bin, 'docker-compose'),
    `#!/bin/bash
echo "docker-compose $*" >> "${log}"
for arg in "$@"; do
  if [ "$arg" = run ]; then
${responder('run', options.run)}
  fi
done
exit 0
`,
    { mode: 0o755 }
  )

  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/bash\necho "git $*" >> "${log}"\nexit 0\n`, {
    mode: 0o755,
  })

  const result = bash(`exec bash "${root}/scripts/deploy.sh" main --force --no-prune`, {
    PATH: `${bin}:${process.env.PATH}`,
  })
  const calls = fs.readFileSync(log, 'utf-8').split('\n').filter(Boolean)

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
    calls,
    called: (fragment: string) => calls.some(call => call.includes(fragment)),
    indexOf: (fragment: string) => calls.findIndex(call => call.includes(fragment)),
    exploited: fs.existsSync(marker),
    env: fs.readFileSync(envFile, 'utf-8'),
  }
}

describe('deploy.sh: проверка конфига nginx перед перезапуском', () => {
  it('нормальный конфиг: до up -d проверка свежим контейнером, после — работающим, restart как раньше', () => {
    const result = runDeploy({ state: 'running' })

    expect(result.status, result.output).toBe(0)
    expect(result.called(FRESH)).toBe(true)
    expect(result.called(EXEC)).toBe(true)
    expect(result.called('up -d --remove-orphans --no-build')).toBe(true)
    expect(result.called('restart nginx')).toBe(true)
    expect(result.output).toContain('Deploy completed.')

    // pull -> проверка свежего образа -> up -> проверка работающего -> restart
    const order = ['pull', FRESH, 'up -d', EXEC, 'restart nginx'].map(part => result.indexOf(part))
    expect(order.every(index => index >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('новый образ nginx не принимает конфиг, а старый бинарник принимает: стоп до up -d', () => {
    // up -d пересоздал бы контейнер на новом образе, и он бы не поднялся (restart: unless-stopped)
    const result = runDeploy({
      state: 'running',
      run: [{ rc: 1, out: NGINX_BROKEN }],
      exec: [{ rc: 0, out: NGINX_OK }],
    })

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('unknown directive "limit_reqq"')
    expect(result.output).toContain('nginx не перезапускаю')
    expect(result.called('up -d')).toBe(false)
    expect(result.called('restart nginx')).toBe(false)
    expect(result.called('docker exec')).toBe(false)
    expect(result.output).not.toContain('Deploy completed.')
  })

  it('свежий контейнер не дал вердикта до up -d: вердикт даёт docker exec, и он тоже останавливает', () => {
    const result = runDeploy({
      state: 'running',
      run: [{ rc: 1, out: NO_VERDICT }],
      exec: [{ rc: 1, out: NGINX_BROKEN }],
    })

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('unknown directive')
    expect(result.called('up -d')).toBe(false)
    expect(result.called('restart nginx')).toBe(false)
  })

  it('свежий контейнер не дал вердикта, а docker exec даёт «всё в порядке»: деплой идёт дальше', () => {
    const result = runDeploy({ state: 'running', run: [{ rc: 1, out: NO_VERDICT }] })

    expect(result.status, result.output).toBe(0)
    expect(result.called('restart nginx')).toBe(true)
  })

  it('конфиг сломан только после up -d: перезапуска нет, код возврата не 0', () => {
    const result = runDeploy({ state: 'running', exec: [{ rc: 1, out: NGINX_BROKEN }] })

    expect(result.status).not.toBe(0)
    expect(result.called('up -d')).toBe(true)
    expect(result.called('restart nginx')).toBe(false)
    expect(result.output).toContain('nginx: configuration file /etc/nginx/nginx.conf test failed')
  })

  it('контейнер не запущен: обе проверки идут одноразовым контейнером, docker exec не нужен', () => {
    const result = runDeploy({ state: 'exited' })

    expect(result.status, result.output).toBe(0)
    expect(result.called('docker exec')).toBe(false)
    expect(result.calls.filter(call => call.includes(FRESH))).toHaveLength(2)
    expect(result.called('restart nginx')).toBe(true)
  })

  it('контейнера нет и конфиг сломан: не перезапускаем и не поднимаем', () => {
    const result = runDeploy({ state: 'missing', run: [{ rc: 1, out: NGINX_BROKEN }] })

    expect(result.status).not.toBe(0)
    expect(result.called(FRESH)).toBe(true)
    expect(result.called('restart nginx')).toBe(false)
    expect(result.called('up -d')).toBe(false)
    expect(result.output).toContain('unknown directive')
  })

  it('docker exec упал сам после up -d (контейнер перезапускается): вердикт даёт одноразовый контейнер', () => {
    const result = runDeploy({
      state: 'running',
      exec: [{ rc: 126, out: DOCKER_ERROR }],
      run: [{ rc: 0, out: NGINX_OK }],
    })

    expect(result.status, result.output).toBe(0)
    expect(result.calls.filter(call => call.includes(FRESH))).toHaveLength(2)
    expect(result.called('restart nginx')).toBe(true)
  })

  it('вердикта нет ни от одного способа: безопасная остановка без up -d и перезапуска', () => {
    const result = runDeploy({
      state: 'running',
      exec: [{ rc: 126, out: DOCKER_ERROR }],
      run: [{ rc: 1, out: NO_VERDICT }],
    })

    expect(result.status).not.toBe(0)
    expect(result.called('restart nginx')).toBe(false)
    expect(result.called('up -d')).toBe(false)
  })

  describe('до up -d не найден upstream (сервисы остановлены)', () => {
    it.each([
      ['frontend', NGINX_NO_UPSTREAM],
      ['backend', NGINX_NO_BACKEND],
    ])('%s не запущен: это не ошибка конфига, проверим ещё раз после запуска', (_name, out) => {
      const result = runDeploy({
        state: 'missing',
        run: [
          { rc: 1, out },
          { rc: 0, out: NGINX_OK },
        ],
      })

      expect(result.status, result.output).toBe(0)
      expect(result.output).toContain('проверю ещё раз после запуска')
      expect(result.called('up -d')).toBe(true)
      expect(result.called('restart nginx')).toBe(true)
    })

    it('опечатка в имени upstream (fronted) ошибкой остаётся: стоп до up -d', () => {
      const result = runDeploy({ state: 'missing', run: [{ rc: 1, out: NGINX_TYPO_UPSTREAM }] })

      expect(result.status).not.toBe(0)
      expect(result.output).toContain('host not found in upstream "fronted"')
      expect(result.output).not.toContain('проверю ещё раз')
      expect(result.called('up -d')).toBe(false)
      expect(result.called('restart nginx')).toBe(false)
    })

    it('рядом с потерянным upstream есть другая ошибка: допуск не действует', () => {
      const result = runDeploy({
        state: 'missing',
        run: [{ rc: 1, out: NGINX_NO_UPSTREAM_AND_BROKEN }],
      })

      expect(result.status).not.toBe(0)
      expect(result.output).toContain('unknown directive')
      expect(result.called('up -d')).toBe(false)
    })

    it('после up -d потерянный upstream уже ошибка: restart не выполняется', () => {
      const result = runDeploy({
        state: 'missing',
        run: [
          { rc: 1, out: NGINX_NO_UPSTREAM },
          { rc: 1, out: NGINX_NO_UPSTREAM },
        ],
      })

      expect(result.status).not.toBe(0)
      expect(result.called('up -d')).toBe(true)
      expect(result.called('restart nginx')).toBe(false)
    })
  })
})

describe('is_safe_env_db_value / find_unsafe_db_name_in_env', () => {
  const safe = [
    'savage_movie',
    '',
    'sav-age',
    'sav.age',
    '"savage_movie"',
    "'savage_movie'",
    'savage_movie  # основная база',
    'savage_movie # $(не исполняется: это комментарий)',
    'savage_movie ',
  ]
  const unsafe = [
    'x$(touch /tmp/x)',
    'x`touch /tmp/x`',
    'x;touch /tmp/x',
    'x&touch /tmp/x',
    'x|touch /tmp/x',
    'x>/tmp/x',
    'x touch /tmp/x',
    '"x$(touch /tmp/x)"',
    "'a'$(touch /tmp/x)",
    'x\\nP=$(touch /tmp/x)',
    'a\tb',
  ]

  const check = (value: string) =>
    bash('. "$1"; is_safe_env_db_value "$2"', {}, [LIB, value]).status

  it.each(safe)('значение %j безопасно для source', value => {
    expect(check(value)).toBe(0)
  })

  it.each(unsafe)('значение %j небезопасно', value => {
    expect(check(value)).toBe(1)
  })

  it('ищет опасную строку DB_NAME в файле: первую, вторую, с export и с отступом', () => {
    const find = (content: string) => {
      const file = path.join(tmp(), '.env')
      fs.writeFileSync(file, content)
      return bash('. "$1"; find_unsafe_db_name_in_env "$2"', {}, [LIB, file])
    }

    expect(find('DB_NAME=savage_movie\nJWT_SECRET=a$b\n').status).toBe(1)
    expect(find('JWT_SECRET=x\n').status).toBe(1)
    expect(find('# DB_NAME=x$(id)\n').status).toBe(1)
    expect(find('DB_NAME=x$(id)\n').status).toBe(0)
    expect(find('DB_NAME=savage_movie\nDB_NAME=x`id`\n').status).toBe(0)
    expect(find('export DB_NAME=x;id\n').status).toBe(0)
    expect(find('  DB_NAME=x;id\n').status).toBe(0)
    // последняя строка без перевода строки тоже проверяется
    expect(find('JWT_SECRET=x\nDB_NAME=x;id').status).toBe(0)
    // значение печатается экранированным и не содержит управляющих символов
    expect(find('DB_NAME=x$(id)\n').stdout).toBe('x\\$\\(id\\)')
  })

  it('сообщение не показывает остальные строки .env (секреты)', () => {
    const file = path.join(tmp(), '.env')
    fs.writeFileSync(file, 'JWT_SECRET=super-secret-value\nDB_NAME=x;id\n')
    const result = bash('. "$1"; find_unsafe_db_name_in_env "$2"', {}, [LIB, file])

    expect(result.stdout).not.toContain('super-secret-value')
  })
})

describe('deploy.sh: DB_NAME, который уже лежит в .env', () => {
  const POISONED = [
    ['x$(touch {MARKER})', 'подстановка команды'],
    ['x`touch {MARKER}`', 'обратные кавычки'],
    ['x;touch {MARKER}', 'точка с запятой'],
    ['x touch {MARKER}', 'пробел: `VAR=x команда` запускает команду'],
    ['"x$(touch {MARKER})"', 'подстановка в двойных кавычках'],
  ] as const

  it.each(POISONED)(
    'значение %j (%s) не исполняется: деплой остановлен до source и до git reset',
    payload => {
      const result = runDeploy({
        state: 'running',
        env: `JWT_SECRET=dummy\nDB_NAME=${payload}\n`,
        dbNames: payload, // база с таким именем существует, поэтому sync .env не переписывает
      })

      expect(result.exploited, result.output).toBe(false)
      expect(result.status).not.toBe(0)
      expect(result.output).toContain('DB_NAME небезопасное значение')
      expect(result.calls.filter(call => call.startsWith('git'))).toEqual([])
      expect(result.called('up -d')).toBe(false)
      expect(result.called('restart nginx')).toBe(false)
    }
  )

  it('отравлена вторая строка DB_NAME или строка с export: тоже стоп', () => {
    for (const env of [
      'DB_NAME=savage_movie\nDB_NAME=x$(touch {MARKER})\n',
      'export DB_NAME=x;touch {MARKER}\n',
    ]) {
      const result = runDeploy({ state: 'running', env })

      expect(result.exploited, env).toBe(false)
      expect(result.status, env).not.toBe(0)
    }
  })

  it('для контроля: без проверки та же .env исполнила бы команду (так было до исправления)', () => {
    const work = tmp()
    const marker = path.join(work, 'PWNED')
    const envFile = path.join(work, '.env')
    fs.writeFileSync(envFile, `DB_NAME=x$(touch ${marker})\n`)

    bash('set -a; . "$ENV_FILE"; set +a', { ENV_FILE: envFile })

    expect(fs.existsSync(marker)).toBe(true)
  })

  it.each([
    ['DB_NAME=savage_movie\nJWT_SECRET=dummy\n'],
    ['DB_NAME="savage_movie"\nJWT_SECRET=dummy\n'],
    ["DB_NAME='savage_movie'\nJWT_SECRET=dummy\n"],
    ['DB_NAME=savage-movie\nJWT_SECRET=dummy\n'],
    ['DB_NAME=savage_movie # основная\nJWT_SECRET=dummy\n'],
    ['JWT_SECRET=dummy\n'],
    ['DB_NAME=\nJWT_SECRET=dummy\n'],
  ])('привычный .env %j не мешает деплою', env => {
    const result = runDeploy({ state: 'running', env })

    expect(result.status, result.output).toBe(0)
    expect(result.exploited).toBe(false)
    expect(result.called('restart nginx')).toBe(true)
    expect(result.output).toContain('Deploy completed.')
  })

  it('самолечение: отравленное значение заменяется именем живой базы, деплой идёт дальше', () => {
    const result = runDeploy({
      state: 'running',
      env: 'DB_NAME=x$(touch {MARKER})\nJWT_SECRET=dummy\n',
      dbNames: 'savage_movie',
    })

    expect(result.exploited, result.output).toBe(false)
    expect(result.status, result.output).toBe(0)
    expect(result.env).toContain('DB_NAME=savage_movie\n')
    expect(result.env).not.toContain('touch')
  })
})
