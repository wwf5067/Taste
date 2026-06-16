// Taste 在线发布后端
// 数据流：作者后台 /admin → /api/login 拿 session → /api/upload 传图 → /api/publish 发文
//        发文时：写 .md 到 REPO_DIR/docs/{section} → 就地 vitepress build → 同步 dist 到 WEB_DIST
// 以服务器为内容唯一真相源，不依赖 GitHub。

import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── 配置 ──
const {
  PUBLISH_PASSWORD,
  SESSION_SECRET,
  REPO_DIR = '/opt/taste/repo',
  WEB_DIST = '/opt/taste/web-dist',
  SECTIONS = 'health,perfume,photography,emotion',
  PORT = '8092',
  SESSION_HOURS = '12',
  MAX_IMAGE_MB = '8',
} = process.env

if (!PUBLISH_PASSWORD || !SESSION_SECRET) {
  console.error('缺少 PUBLISH_PASSWORD 或 SESSION_SECRET，请检查 .env')
  process.exit(1)
}

const SECTION_SET = new Set(SECTIONS.split(',').map((s) => s.trim()).filter(Boolean))
const DOCS_DIR = path.join(REPO_DIR, 'docs')
const UPLOAD_BASE = path.join(DOCS_DIR, 'public', 'uploads')
const SESSION_MS = Number(SESSION_HOURS) * 3600 * 1000
const MAX_IMAGE_BYTES = Number(MAX_IMAGE_MB) * 1024 * 1024

// ── 工具 ──
const pad = (n) => String(n).padStart(2, '0')
function ymd(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function ym(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// 文件名 slug：保留中文，替换路径/空白字符，防目录穿越
function slugify(title) {
  return title
    .trim()
    .replace(/[\\/:*?"<>|.\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || '未命名'
}

// ── 简易签名 session（HMAC，无需额外依赖） ──
function signSession(exp) {
  const payload = `v1.${exp}`
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}
function verifySession(token) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [, expStr, sig] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(`v1.${expStr}`).digest('hex')
  // 防时序攻击
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ── 构建锁（串行化，避免并发构建） ──
let building = false
let lastBuild = { status: 'idle', at: null, error: null } // idle|building|success|error

function runBuild() {
  return new Promise((resolve, reject) => {
    lastBuild = { status: 'building', at: new Date().toISOString(), error: null }
    // vitepress build → 输出到 docs/.vitepress/dist
    const build = spawn('npm', ['run', 'build'], { cwd: REPO_DIR, env: process.env })
    let stderr = ''
    build.stderr.on('data', (d) => (stderr += d))
    build.on('error', reject)
    build.on('close', (code) => {
      if (code !== 0) return reject(new Error(`build 退出码 ${code}: ${stderr.slice(-500)}`))
      // 同步 dist → WEB_DIST（rsync 原子更新）
      const dist = path.join(DOCS_DIR, '.vitepress', 'dist') + '/'
      const sync = spawn('rsync', ['-a', '--delete', dist, WEB_DIST + '/'])
      let serr = ''
      sync.stderr.on('data', (d) => (serr += d))
      sync.on('error', reject)
      sync.on('close', (sc) => {
        if (sc !== 0) return reject(new Error(`rsync 退出码 ${sc}: ${serr.slice(-500)}`))
        resolve()
      })
    })
  })
}

async function buildAndPublish() {
  if (building) throw new Error('正在发布上一篇，请稍候再试')
  building = true
  try {
    await runBuild()
    lastBuild = { status: 'success', at: new Date().toISOString(), error: null }
  } catch (e) {
    lastBuild = { status: 'error', at: new Date().toISOString(), error: String(e.message || e) }
    throw e
  } finally {
    building = false
  }
}

// ── app ──
const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

function requireAuth(req, res, next) {
  if (verifySession(req.cookies?.taste_session)) return next()
  return res.status(401).json({ error: '未登录或登录已过期' })
}

// 登录
app.post('/api/login', loginLimiter, (req, res) => {
  const { password } = req.body || {}
  const ok =
    typeof password === 'string' &&
    password.length === PUBLISH_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(PUBLISH_PASSWORD))
  if (!ok) return res.status(401).json({ error: '口令不正确' })
  const exp = Date.now() + SESSION_MS
  res.cookie('taste_session', signSession(exp), {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: SESSION_MS,
  })
  res.json({ ok: true })
})

app.post('/api/logout', (req, res) => {
  res.clearCookie('taste_session')
  res.json({ ok: true })
})

// 当前会话/配置信息（前端用来填板块下拉、判断是否已登录）
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ ok: true, sections: [...SECTION_SET] })
})

// 图片上传
const imageFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)
  cb(ok ? null : new Error('只允许 jpg/png/webp/gif 图片'), ok)
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES }, fileFilter: imageFilter })

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: '没有收到图片' })
    try {
      const dir = path.join(UPLOAD_BASE, ym())
      await fsp.mkdir(dir, { recursive: true })
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[req.file.mimetype]
      const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
      await fsp.writeFile(path.join(dir, name), req.file.buffer)
      // 站点内引用路径（public 映射到根）
      res.json({ ok: true, url: `/uploads/${ym()}/${name}` })
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) })
    }
  })
})

// 发布文章
app.post('/api/publish', requireAuth, async (req, res) => {
  try {
    const { title, section, date, tags, body } = req.body || {}
    if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: '标题不能为空' })
    if (!SECTION_SET.has(section)) return res.status(400).json({ error: '板块不合法' })
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ymd()
    const year = dateStr.slice(0, 4)
    const slug = slugify(title)
    const fileName = `${year}-${slug}.md`
    const sectionDir = path.join(DOCS_DIR, section)

    // 防目录穿越：解析后的路径必须仍在 sectionDir 内
    const target = path.join(sectionDir, fileName)
    if (!target.startsWith(sectionDir + path.sep)) return res.status(400).json({ error: '非法文件名' })

    await fsp.mkdir(sectionDir, { recursive: true })
    if (fs.existsSync(target)) return res.status(409).json({ error: `已存在同名文章：${section}/${fileName}` })

    // 组装 frontmatter + 正文
    const tagList = Array.isArray(tags) ? tags : String(tags || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    const fm = ['---', `title: ${title.trim()}`, `date: ${dateStr}`]
    if (tagList.length) {
      fm.push('tags:')
      for (const t of tagList) fm.push(`  - ${t}`)
    }
    fm.push('---')
    const content = `${fm.join('\n')}\n\n# ${title.trim()}\n\n${(body || '').trim() || '（正文）'}\n`
    await fsp.writeFile(target, content, 'utf8')

    await buildAndPublish()
    res.json({ ok: true, path: `${section}/${fileName}`, url: `/${section}/${year}-${slug}` })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// 构建状态轮询
app.get('/api/status', requireAuth, (req, res) => {
  res.json({ ...lastBuild, building })
})

// 后台静态前端
app.use('/admin', express.static(path.join(__dirname, 'public')))

app.listen(Number(PORT), () => {
  console.log(`Taste 发布后端已启动: http://0.0.0.0:${PORT}  (REPO_DIR=${REPO_DIR})`)
})
