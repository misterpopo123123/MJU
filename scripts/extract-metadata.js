#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '..', 'public', 'assets')
const outFile = path.join(__dirname, '..', 'public', 'tracks.json')

async function build() {
  const { parseFile } = await import('music-metadata')
  const files = fs.readdirSync(assetsDir)
  const mp3s = files.filter(f => f.toLowerCase().endsWith('.mp3'))
  const tracks = []
  for (let i = 0; i < mp3s.length; i++) {
    const file = mp3s[i]
    const filePath = path.join(assetsDir, file)
    try {
      const metadata = await parseFile(filePath)
      const common = metadata.common || {}
      const format = metadata.format || {}
      const id = 't' + (i + 1)
      const title = common.title || path.basename(file, path.extname(file))
      const artist = common.artist || 'Unknown'
      const album = common.album || 'Local'
      const duration = Math.floor(format.duration || 0)
      const coverCandidates = files.filter(f => {
        const lower = f.toLowerCase()
        return (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) && lower.includes(path.basename(album).toLowerCase())
      })
      const cover = coverCandidates.length ? '/assets/' + coverCandidates[0] : '/assets/flawed-mangoes.jpg'
      tracks.push({ id, title, artist, album, duration, src: '/assets/' + file, cover })
    } catch (e) {
      console.error('Error reading', file, e.message)
    }
  }
  if (fs.existsSync(outFile)) fs.copyFileSync(outFile, outFile + '.autobak')
  fs.writeFileSync(outFile, JSON.stringify(tracks, null, 2))
  console.log('Wrote', tracks.length, 'tracks to', outFile)
}

build().catch(e => { console.error(e); process.exit(1) })
