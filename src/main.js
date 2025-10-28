// Reproductor simple (module)
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => Array.from(document.querySelectorAll(sel))

const coverEl = $('#cover')
const titleEl = $('#title')
const artistEl = $('#artist')
const playBtn = $('#play')
const prevBtn = $('#prev')
const nextBtn = $('#next')
const progressEl = $('#progress')
const currentTimeEl = $('#currentTime')
const durationEl = $('#duration')
const volumeEl = $('#volume')
const playlistEl = $('#playlist')
const searchEl = $('#search')

/**
 * Array storing the application's track list.
 *
 * Each entry is a Track object describing a single audio item.
 *
 * @typedef {Object} Track
 * @property {string|number} id - Unique identifier for the track.
 * @property {string} title - Track title.
 * @property {string} [artist] - Artist or creator name.
 * @property {number} [duration] - Duration in seconds.
 * @property {string} [album] - Album name.
 * @property {string} [url] - Resource URL or file path.
 * @property {Object<string, any>} [meta] - Additional metadata (tags, artwork, etc.).
 *
 * @type {Track[]}
 * @name tracks
 */
let tracks = [
  {
    "id": "t1",
    "title": "Absolution",
    "album": "Mi Álbum 1"
  },
  {
    "id": "t2",
    "title": "Addicted",
    "album": "Mi Álbum 2"
  }
]
let currentIndex = 0
let audio = new Audio()
audio.preload = 'metadata'
audio.crossOrigin = 'anonymous'

let playlistNodes = []

const DEFAULT_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <rect width="100%" height="100%" fill="#444" />
  <path d="M9 18V5l12-2v13" stroke="#fff" stroke-width="1.2" />
  <circle cx="6" cy="18" r="3" fill="#666" />
  <circle cx="18" cy="18" r="3" fill="#666" />
</svg>
`)

async function loadTracks() {
  try {
    const res = await fetch('/tracks.json')
    tracks = await res.json()
  } catch (e) {
    console.error('No se pudo cargar tracks.json', e)
    tracks = []
  }
  renderPlaylist()
  populateAlbumSelect()
  if (tracks.length) {
    // try to autoplay the first track on load; browsers may block this without user interaction
    loadTrack(0, { autoplay: true })
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = ''
  playlistNodes = tracks.map((t, i) => {
    const el = document.createElement('div')
    el.className = 'track'
    el.dataset.index = i
    el.innerHTML = `
      <img class="small-cover" src="${t.cover || DEFAULT_COVER}" alt="">
      <div class="meta">
        <div class="t">${t.title}</div>
        <div class="a">${t.artist} • ${t.album || ''}</div>
      </div>
      <div class="dur">${t.duration || ''}</div>
    `
    // when clicking a track, load it and autoplay immediately
    el.addEventListener('click', () => { loadTrack(i, { autoplay: true }) })
    playlistEl.appendChild(el)
    return el
  })
}

function uniqueAlbums() {
  const set = new Set()
  tracks.forEach(t => set.add(t.album || 'Local'))
  return Array.from(set)
}

function populateAlbumSelect() {
  if (!albumSelect) return
  const albums = uniqueAlbums()
  albumSelect.innerHTML = '<option value="__all">Todos</option>' + albums.map(a => `<option value="${a}">${a}</option>`).join('')
  albumSelect.addEventListener('change', (e) => {
    const val = e.target.value
    if (val === '__all') {
      // reload full list
      loadTracksFromJson()
    } else {
      // filter in-memory
      const filtered = tracks.filter(t => (t.album || 'Local') === val)
      renderFilteredPlaylist(filtered)
    }
  }, { once: true })
}

function loadTracksFromJson() {
  // re-render using current tracks (no network refetch)
  renderPlaylist()
}

function renderFilteredPlaylist(filtered) {
  playlistEl.innerHTML = ''
  playlistNodes = filtered.map((t, i) => {
    const el = document.createElement('div')
    el.className = 'track'
    el.dataset.index = tracks.indexOf(t)
    el.innerHTML = `
      <img class="small-cover" src="${t.cover || DEFAULT_COVER}" alt="">
      <div class="meta">
        <div class="t">${t.title}</div>
        <div class="a">${t.artist} • ${t.album || ''}</div>
      </div>
      <div class="dur">${t.duration || ''}</div>
    `
    el.addEventListener('click', () => { loadTrack(tracks.indexOf(t)); play() })
    playlistEl.appendChild(el)
    return el
  })
}

function loadTrack(index) {
  // loadTrack(index, { autoplay: true }) will autoplay when appropriate
  if (!tracks[index]) return
  currentIndex = index
  const t = tracks[index]
  const wasPlaying = !audio.paused && !audio.ended
  audio.src = t.src
  coverEl.src = t.cover || DEFAULT_COVER
  titleEl.textContent = t.title
  artistEl.textContent = t.artist
  albumNameEl.textContent = t.album || ''
  // reset UI
  progressEl.value = 0
  currentTimeEl.textContent = '0:00'
  durationEl.textContent = '0:00'
  // load metadata
  audio.load()
  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration)
    progressEl.max = Math.floor(audio.duration)
  }, { once: true })
  // actualizar estado visual de la playlist
  playlistNodes.forEach(n => n.classList.remove('active'))
  const active = playlistNodes[index]
  if (active) active.classList.add('active')
}

// extended loadTrack with options wrapper so callers can request autoplay
function loadTrack(index, opts = {}) {
  // if caller passed an options object, use this function as the implementation
  if (opts && (typeof opts.autoplay !== 'undefined')) {
    // original implementation moved into inner function to preserve behavior
    const originalIndex = index
    if (!tracks[originalIndex]) return
    currentIndex = originalIndex
    const t = tracks[originalIndex]
    const wasPlaying = !audio.paused && !audio.ended
    audio.src = t.src
    coverEl.src = t.cover || DEFAULT_COVER
    titleEl.textContent = t.title
    artistEl.textContent = t.artist
    albumNameEl.textContent = t.album || ''
    // reset UI
    progressEl.value = 0
    currentTimeEl.textContent = '0:00'
    durationEl.textContent = '0:00'
    // load metadata
    audio.load()
    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatTime(audio.duration)
      progressEl.max = Math.floor(audio.duration)
    }, { once: true })
    // update playlist visual
    playlistNodes.forEach(n => n.classList.remove('active'))
    const active = playlistNodes[originalIndex]
    if (active) active.classList.add('active')

    // autoplay if requested or if the player was already playing
    if (opts.autoplay || wasPlaying) {
      audio.play().then(() => {
        playBtn.textContent = '❚❚'
      }).catch(() => {
        // autoplay may be blocked by browser; ignore silently
      })
    }
    return
  }
  // fallback when called without opts (legacy usage)
  // keep backward compatibility: if a second argument isn't passed, treat as no-autoplay
  if (typeof index === 'number') {
    // call the new implementation with autoplay=false
    return loadTrack(index, { autoplay: false })
  }
}

function formatTime(seconds = 0) {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const m = Math.floor(seconds / 60)
  return `${m}:${s}`
}

function togglePlay() {
  if (audio.paused) play()
  else pause()
}
function play() {
  audio.play()
  playBtn.textContent = '❚❚'
}
function pause() {
  audio.pause()
  playBtn.textContent = '►'
}

function prev() {
  const i = (currentIndex - 1 + tracks.length) % tracks.length
  // ensure immediate playback when moving prev
  loadTrack(i, { autoplay: true })
}
function next() {
  const i = (currentIndex + 1) % tracks.length
  // ensure immediate playback when moving next or when a track ends
  loadTrack(i, { autoplay: true })
}

// events
playBtn.addEventListener('click', togglePlay)
prevBtn.addEventListener('click', prev)
nextBtn.addEventListener('click', next)

audio.addEventListener('timeupdate', () => {
  progressEl.value = Math.floor(audio.currentTime)
  currentTimeEl.textContent = formatTime(audio.currentTime)
})

audio.addEventListener('ended', next)

progressEl.addEventListener('input', (e) => {
  audio.currentTime = Number(e.target.value)
})

volumeEl.addEventListener('input', (e) => {
  audio.volume = Number(e.target.value)
})

// keyboard space to toggle play
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault()
    togglePlay()
  }
})

loadTracks()

