<template>
  <v-card elevation="0" rounded="lg" class="map-card">
    <!-- Metric toggle + Country picker -->
    <div class="map-toolbar">
      <v-btn-toggle
        :model-value="metric"
        mandatory
        density="compact"
        rounded="pill"
        color="primary"
        class="metric-toggle"
        @update:model-value="$emit('update:metric', $event)"
      >
        <v-btn value="artists" size="small" prepend-icon="mdi-microphone-variant">Artists</v-btn>
        <v-btn value="songs" size="small" prepend-icon="mdi-music-note">Songs</v-btn>
        <v-btn value="albums" size="small" prepend-icon="mdi-album">Albums</v-btn>
      </v-btn-toggle>

      <span class="map-hint">Top 10 pins · click for details</span>

      <v-select
        :model-value="selectedCountry"
        :items="countryOptions"
        item-title="name"
        item-value="code"
        density="compact"
        variant="outlined"
        hide-details
        rounded="pill"
        prepend-inner-icon="mdi-earth"
        style="max-width: 190px;"
        color="primary"
        @update:model-value="$emit('update:selectedCountry', $event)"
      />
    </div>

    <!-- Map container -->
    <div ref="mapContainer" class="map-container" />
  </v-card>

  <!-- Discography modal -->
  <v-dialog v-model="showDiscography" max-width="480" scrollable>
    <v-card rounded="xl" class="discography-card" elevation="0">
      <v-card-title class="discography-header pa-5 pb-3">
        <div class="d-flex align-center gap-3">
          <v-icon color="primary" size="22">mdi-microphone-variant</v-icon>
          <div>
            <div class="discography-artist">{{ discographyArtist?.name }}</div>
            <div class="discography-sub">{{ discographyAlbums.length }} album{{ discographyAlbums.length !== 1 ? 's' : '' }} · {{ formatStreams(discographyArtist?.streams ?? 0) }} total streams</div>
          </div>
        </div>
      </v-card-title>

      <v-divider opacity="0.08" />

      <v-card-text class="pa-4">
        <div v-if="discographyAlbums.length === 0" class="text-center pa-6" style="color:rgba(255,255,255,0.3);font-size:13px;">
          No albums found in current dataset
        </div>
        <div
          v-for="(album, i) in discographyAlbums"
          :key="album.id"
          class="discography-row"
        >
          <div class="discography-rank">{{ i + 1 }}</div>
          <div class="discography-icon">
            <v-icon size="18" color="primary" opacity="0.7">mdi-album</v-icon>
          </div>
          <div class="discography-info">
            <div class="discography-title">{{ album.title }}</div>
            <div class="discography-streams">{{ formatStreams(album.streams) }} streams</div>
          </div>
          <div :class="['discography-trend', album.trend >= 0 ? 'trend-up' : 'trend-down']">
            <v-icon size="13">{{ album.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
            {{ Math.abs(album.trend).toFixed(1) }}%
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn block variant="tonal" color="primary" rounded="pill" @click="showDiscography = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'
import L from 'leaflet'
import type { Map as LeafletMap, Marker, TileLayer } from 'leaflet'
import type { Artist, Song, Album, Metric } from '../types'

const props = defineProps<{
  metric: Metric
  topArtists: Artist[]
  topSongs: Song[]
  topAlbums: Album[]
  selectedCountry: string
  countryName?: string
  countryLat?: number
  countryLng?: number
  globalTopArtists: Artist[]
  globalTopSongs: Song[]
  globalTopAlbums: Album[]
  allAlbums: Album[]
  countryOptions: { code: string; name: string }[]
}>()

const emit = defineEmits<{
  'update:metric': [value: Metric]
  'update:selectedCountry': [value: string]
  'addToPlaylist': [song: Song]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
const markers: Marker[] = []
let tileLayerRef: TileLayer | null = null

const theme = useTheme()

function getTileUrl(isDark: boolean) {
  return isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

function updateTileLayer() {
  if (!map) return
  if (tileLayerRef) { tileLayerRef.remove(); tileLayerRef = null }
  tileLayerRef = L.tileLayer(getTileUrl(theme.global.current.value.dark), {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map)
}

// Discography modal state
const showDiscography = ref(false)
const discographyArtist = ref<Artist | null>(null)
const discographyAlbums = computed(() =>
  discographyArtist.value
    ? props.allAlbums.filter(al => al.artist === discographyArtist.value!.name)
    : []
)

// 10 on-land city coordinates + names per country
const COUNTRY_CITIES: Record<string, { lat: number; lng: number; name: string }[]> = {
  US: [
    { lat: 40.71, lng: -74.01, name: 'New York' },
    { lat: 34.05, lng: -118.24, name: 'Los Angeles' },
    { lat: 41.88, lng: -87.63, name: 'Chicago' },
    { lat: 29.76, lng: -95.37, name: 'Houston' },
    { lat: 33.45, lng: -112.07, name: 'Phoenix' },
    { lat: 39.95, lng: -75.17, name: 'Philadelphia' },
    { lat: 29.42, lng: -98.49, name: 'San Antonio' },
    { lat: 32.72, lng: -117.15, name: 'San Diego' },
    { lat: 32.78, lng: -96.80, name: 'Dallas' },
    { lat: 37.34, lng: -121.89, name: 'San Jose' },
  ],
  GB: [
    { lat: 51.50, lng: -0.12, name: 'London' },
    { lat: 53.48, lng: -2.24, name: 'Manchester' },
    { lat: 52.48, lng: -1.90, name: 'Birmingham' },
    { lat: 53.80, lng: -1.55, name: 'Leeds' },
    { lat: 53.41, lng: -2.99, name: 'Liverpool' },
    { lat: 55.95, lng: -3.19, name: 'Edinburgh' },
    { lat: 55.86, lng: -4.25, name: 'Glasgow' },
    { lat: 51.45, lng: -2.59, name: 'Bristol' },
    { lat: 51.48, lng: -3.18, name: 'Cardiff' },
    { lat: 54.97, lng: -1.61, name: 'Newcastle' },
  ],
  JP: [
    { lat: 35.69, lng: 139.69, name: 'Tokyo' },
    { lat: 34.69, lng: 135.50, name: 'Osaka' },
    { lat: 35.18, lng: 136.91, name: 'Nagoya' },
    { lat: 43.06, lng: 141.35, name: 'Sapporo' },
    { lat: 33.59, lng: 130.40, name: 'Fukuoka' },
    { lat: 34.69, lng: 135.20, name: 'Kobe' },
    { lat: 35.01, lng: 135.77, name: 'Kyoto' },
    { lat: 34.39, lng: 132.45, name: 'Hiroshima' },
    { lat: 38.27, lng: 140.87, name: 'Sendai' },
    { lat: 35.61, lng: 140.12, name: 'Chiba' },
  ],
  BR: [
    { lat: -23.55, lng: -46.63, name: 'São Paulo' },
    { lat: -22.91, lng: -43.17, name: 'Rio de Janeiro' },
    { lat: -15.78, lng: -47.93, name: 'Brasília' },
    { lat: -12.97, lng: -38.50, name: 'Salvador' },
    { lat: -3.72, lng: -38.54, name: 'Fortaleza' },
    { lat: -19.92, lng: -43.94, name: 'Belo Horizonte' },
    { lat: -3.10, lng: -60.02, name: 'Manaus' },
    { lat: -25.43, lng: -49.27, name: 'Curitiba' },
    { lat: -8.06, lng: -34.87, name: 'Recife' },
    { lat: -30.03, lng: -51.23, name: 'Porto Alegre' },
  ],
  KR: [
    { lat: 37.57, lng: 126.98, name: 'Seoul' },
    { lat: 35.18, lng: 129.08, name: 'Busan' },
    { lat: 37.46, lng: 126.71, name: 'Incheon' },
    { lat: 35.87, lng: 128.60, name: 'Daegu' },
    { lat: 36.35, lng: 127.38, name: 'Daejeon' },
    { lat: 35.16, lng: 126.85, name: 'Gwangju' },
    { lat: 37.29, lng: 127.01, name: 'Suwon' },
    { lat: 35.54, lng: 129.31, name: 'Ulsan' },
    { lat: 35.23, lng: 128.68, name: 'Changwon' },
    { lat: 37.66, lng: 126.83, name: 'Goyang' },
  ],
  DE: [
    { lat: 52.52, lng: 13.40, name: 'Berlin' },
    { lat: 53.55, lng: 9.99, name: 'Hamburg' },
    { lat: 48.14, lng: 11.58, name: 'Munich' },
    { lat: 50.94, lng: 6.96, name: 'Cologne' },
    { lat: 50.11, lng: 8.68, name: 'Frankfurt' },
    { lat: 48.78, lng: 9.18, name: 'Stuttgart' },
    { lat: 51.23, lng: 6.78, name: 'Düsseldorf' },
    { lat: 51.34, lng: 12.37, name: 'Leipzig' },
    { lat: 51.52, lng: 7.47, name: 'Dortmund' },
    { lat: 51.46, lng: 7.01, name: 'Essen' },
  ],
  NG: [
    { lat: 6.46, lng: 3.41, name: 'Lagos' },
    { lat: 12.00, lng: 8.52, name: 'Kano' },
    { lat: 7.39, lng: 3.90, name: 'Ibadan' },
    { lat: 9.05, lng: 7.49, name: 'Abuja' },
    { lat: 4.78, lng: 7.01, name: 'Port Harcourt' },
    { lat: 6.34, lng: 5.63, name: 'Benin City' },
    { lat: 11.85, lng: 13.16, name: 'Maiduguri' },
    { lat: 11.09, lng: 7.72, name: 'Zaria' },
    { lat: 5.12, lng: 7.37, name: 'Aba' },
    { lat: 8.13, lng: 4.25, name: 'Ogbomosho' },
  ],
  IN: [
    { lat: 19.08, lng: 72.88, name: 'Mumbai' },
    { lat: 28.70, lng: 77.10, name: 'Delhi' },
    { lat: 12.97, lng: 77.59, name: 'Bangalore' },
    { lat: 17.37, lng: 78.48, name: 'Hyderabad' },
    { lat: 23.02, lng: 72.57, name: 'Ahmedabad' },
    { lat: 13.08, lng: 80.27, name: 'Chennai' },
    { lat: 22.57, lng: 88.36, name: 'Kolkata' },
    { lat: 21.20, lng: 72.84, name: 'Surat' },
    { lat: 18.52, lng: 73.86, name: 'Pune' },
    { lat: 26.91, lng: 75.79, name: 'Jaipur' },
  ],
  MX: [
    { lat: 19.43, lng: -99.13, name: 'Mexico City' },
    { lat: 20.67, lng: -103.35, name: 'Guadalajara' },
    { lat: 25.69, lng: -100.32, name: 'Monterrey' },
    { lat: 19.04, lng: -98.20, name: 'Puebla' },
    { lat: 32.52, lng: -117.04, name: 'Tijuana' },
    { lat: 21.12, lng: -101.68, name: 'León' },
    { lat: 31.73, lng: -106.49, name: 'Juárez' },
    { lat: 25.54, lng: -103.44, name: 'Torreón' },
    { lat: 20.59, lng: -100.39, name: 'Querétaro' },
    { lat: 22.15, lng: -100.98, name: 'San Luis Potosí' },
  ],
  AU: [
    { lat: -33.87, lng: 151.21, name: 'Sydney' },
    { lat: -37.81, lng: 144.96, name: 'Melbourne' },
    { lat: -27.47, lng: 153.02, name: 'Brisbane' },
    { lat: -31.95, lng: 115.86, name: 'Perth' },
    { lat: -34.92, lng: 138.60, name: 'Adelaide' },
    { lat: -28.00, lng: 153.43, name: 'Gold Coast' },
    { lat: -35.28, lng: 149.13, name: 'Canberra' },
    { lat: -32.93, lng: 151.77, name: 'Newcastle' },
    { lat: -42.88, lng: 147.33, name: 'Hobart' },
    { lat: -12.46, lng: 130.84, name: 'Darwin' },
  ],
  SE: [
    { lat: 59.33, lng: 18.07, name: 'Stockholm' },
    { lat: 57.71, lng: 11.97, name: 'Gothenburg' },
    { lat: 55.61, lng: 13.00, name: 'Malmö' },
    { lat: 59.86, lng: 17.64, name: 'Uppsala' },
    { lat: 59.61, lng: 16.55, name: 'Västerås' },
    { lat: 59.27, lng: 15.22, name: 'Örebro' },
    { lat: 58.41, lng: 15.62, name: 'Linköping' },
    { lat: 56.05, lng: 12.69, name: 'Helsingborg' },
    { lat: 57.78, lng: 14.16, name: 'Jönköping' },
    { lat: 58.59, lng: 16.18, name: 'Norrköping' },
  ],
  FR: [
    { lat: 48.85, lng: 2.35, name: 'Paris' },
    { lat: 43.30, lng: 5.37, name: 'Marseille' },
    { lat: 45.75, lng: 4.84, name: 'Lyon' },
    { lat: 43.60, lng: 1.44, name: 'Toulouse' },
    { lat: 43.71, lng: 7.26, name: 'Nice' },
    { lat: 47.22, lng: -1.55, name: 'Nantes' },
    { lat: 48.58, lng: 7.75, name: 'Strasbourg' },
    { lat: 44.84, lng: -0.57, name: 'Bordeaux' },
    { lat: 50.63, lng: 3.07, name: 'Lille' },
    { lat: 48.11, lng: -1.68, name: 'Rennes' },
  ],
}

function createMusicIcon(rank: number, isTop3: boolean) {
  const size = isTop3 ? 36 : 28
  const fontSize = isTop3 ? 16 : 13
  const borderColor = isTop3 ? '#00BCD4' : 'rgba(0,188,212,0.5)'
  const bg = isTop3 ? 'rgba(0,188,212,0.25)' : 'rgba(0,188,212,0.12)'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        box-shadow: 0 0 ${isTop3 ? 12 : 6}px ${borderColor};
        backdrop-filter: blur(4px);
        cursor: pointer;
        transition: transform 0.15s;
        position: relative;
      ">
        ♪
        <span style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #00BCD4;
          color: #0A0A0F;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        ">${rank}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function formatStreams(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function trendHtml(trend: number) {
  const up = trend >= 0
  const color = up ? '#22c55e' : '#ef4444'
  const arrow = up ? '↑' : '↓'
  return `<span style="color:${color};font-weight:600">${arrow} ${Math.abs(trend).toFixed(1)}%</span>`
}

// Resolve the Song to add for a given item (used for all metrics)
function resolveSong(index: number): Song | null {
  if (props.metric === 'songs') {
    return props.topSongs[index] ?? null
  }
  if (props.metric === 'artists') {
    const artist = props.topArtists[index]
    if (!artist) return null
    // Try to find matching song in topSongs, fall back to globalTopSongs
    const found = [...props.topSongs, ...props.globalTopSongs].find(s => s.artist === artist.name)
    if (found) return found
    // Synthesise a minimal Song from artist data
    return {
      id: artist.id + '_song',
      title: artist.topSong,
      artist: artist.name,
      album: '—',
      streams: artist.streams,
      duration: '—',
      trend: artist.trend,
    }
  }
  if (props.metric === 'albums') {
    const album = props.topAlbums[index]
    if (!album) return null
    const found = [...props.topSongs, ...props.globalTopSongs].find(s => s.album === album.title)
    if (found) return found
    return {
      id: album.id + '_song',
      title: album.title,
      artist: album.artist,
      album: album.title,
      streams: album.streams,
      duration: '—',
      trend: album.trend,
    }
  }
  return null
}

// Returns global rank (1-based) of an item by id, or 0 if not found
function globalRank(index: number): number {
  if (props.selectedCountry === 'ALL') return index + 1
  if (props.metric === 'songs') {
    const id = props.topSongs[index]?.id
    const gi = props.globalTopSongs.findIndex(s => s.id === id)
    return gi >= 0 ? gi + 1 : 0
  }
  if (props.metric === 'artists') {
    const id = props.topArtists[index]?.id
    const gi = props.globalTopArtists.findIndex(a => a.id === id)
    return gi >= 0 ? gi + 1 : 0
  }
  if (props.metric === 'albums') {
    const id = props.topAlbums[index]?.id
    const gi = props.globalTopAlbums.findIndex(al => al.id === id)
    return gi >= 0 ? gi + 1 : 0
  }
  return 0
}

interface PinItem {
  lat: number
  lng: number
  label: string
  sub: string
  streams: number
  trend: number
  city: string
  countryRank: number
  globalRankValue: number
  songPayload: Song | null
}

function getActiveItems(): PinItem[] {
  const countrySelected = props.selectedCountry !== 'ALL' && props.countryLat != null && props.countryLng != null
  const cities = countrySelected ? COUNTRY_CITIES[props.selectedCountry] : null

  function pinCoords(itemLat: number | undefined, itemLng: number | undefined, index: number): { lat: number; lng: number; city: string } {
    if (countrySelected && cities?.[index]) {
      return { lat: cities[index].lat, lng: cities[index].lng, city: cities[index].name }
    }
    if (countrySelected) {
      const offsets: [number, number][] = [
        [0,0],[1.5,-2],[-1.2,2.2],[2,-1.5],[-2,-1],[0.5,3],[-2.5,0.5],[2.5,-0.3],[0.8,-3.5],[-0.8,2.8],
      ]
      const [dLat, dLng] = offsets[index] ?? [0, 0]
      return { lat: props.countryLat! + dLat, lng: props.countryLng! + dLng, city: '' }
    }
    return { lat: itemLat ?? 0, lng: itemLng ?? 0, city: '' }
  }

  if (props.metric === 'artists') {
    return props.topArtists.slice(0, 10).map((a, i) => {
      const { lat, lng, city } = pinCoords(a.lat, a.lng, i)
      return { lat, lng, city, label: a.name, sub: a.topSong, streams: a.streams, trend: a.trend, countryRank: i + 1, globalRankValue: globalRank(i), songPayload: resolveSong(i) }
    })
  } else if (props.metric === 'songs') {
    return props.topSongs.slice(0, 10).map((s, i) => {
      const { lat, lng, city } = pinCoords(s.lat, s.lng, i)
      return { lat, lng, city, label: s.title, sub: s.artist, streams: s.streams, trend: s.trend, countryRank: i + 1, globalRankValue: globalRank(i), songPayload: resolveSong(i) }
    })
  } else {
    return props.topAlbums.slice(0, 10).map((al, i) => {
      const { lat, lng, city } = pinCoords(al.lat, al.lng, i)
      return { lat, lng, city, label: al.title, sub: al.artist, streams: al.streams, trend: al.trend, countryRank: i + 1, globalRankValue: globalRank(i), songPayload: resolveSong(i) }
    })
  }
}

const BTN_STYLE = `width:100%;padding:7px 0;border:none;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.15s;letter-spacing:0.03em;`

function buildPopupHtml(item: PinItem): string {
  const countryLabel = props.selectedCountry !== 'ALL' ? (props.countryName ?? props.selectedCountry) : 'Global'
  const gRank = item.globalRankValue
  const isArtist = props.metric === 'artists'

  // For artists: store artist index so we can look them up on click
  const artistJson = isArtist ? encodeURIComponent(JSON.stringify({ index: item.countryRank - 1 })) : ''
  const songJson = !isArtist && item.songPayload ? encodeURIComponent(JSON.stringify(item.songPayload)) : ''

  const subLine = !isArtist
    ? `<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:10px;">${item.sub}</div>`
    : `<div style="margin-bottom:10px;"></div>`

  const actionBtn = isArtist
    ? `<button data-discography="${artistJson}" style="${BTN_STYLE}background:rgba(124,77,255,0.18);color:#b39ddb;"
        onmouseover="this.style.background='rgba(124,77,255,0.32)'" onmouseout="this.style.background='rgba(124,77,255,0.18)'">
        <span style="font-size:15px;line-height:1;">🎵</span> See Discography
      </button>`
    : songJson
      ? `<button data-add-playlist="${songJson}" style="${BTN_STYLE}background:rgba(0,188,212,0.18);color:#00BCD4;"
          onmouseover="this.style.background='rgba(0,188,212,0.32)'" onmouseout="this.style.background='rgba(0,188,212,0.18)'">
          <span style="font-size:15px;line-height:1;">+</span> Add to Playlist
        </button>`
      : ''

  return `
    <div style="font-family:system-ui,sans-serif;min-width:190px;padding:2px 0;">
      ${item.city ? `
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:8px;">
          <span style="font-size:13px;">📍</span>
          <span style="font-size:12px;font-weight:700;color:#00BCD4;letter-spacing:0.03em;">${item.city}</span>
        </div>` : ''}
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:2px;line-height:1.3;">${item.label}</div>
      ${subLine}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;">
          <div style="font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:2px;">#${item.countryRank} in ${countryLabel}</div>
          <div style="font-size:12px;font-weight:700;color:#fff;">${formatStreams(item.streams)}</div>
        </div>
        ${gRank > 0 ? `
        <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;">
          <div style="font-size:9px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:2px;">Global Rank</div>
          <div style="font-size:12px;font-weight:700;color:#fff;">#${gRank} worldwide</div>
        </div>` : ''}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:11px;color:rgba(255,255,255,0.4);">Streams</span>
        ${trendHtml(item.trend)}
      </div>

      ${actionBtn}
    </div>
  `
}

function clearMarkers() {
  markers.forEach(m => m.remove())
  markers.length = 0
}

function placeMarkers() {
  if (!map) return
  clearMarkers()
  getActiveItems().forEach((item, i) => {
    const isTop3 = i < 3
    const icon = createMusicIcon(item.countryRank, isTop3)
    const marker = L.marker([item.lat, item.lng], { icon })
      .addTo(map!)
      .bindPopup(buildPopupHtml(item), { className: 'dark-popup', maxWidth: 240 })
    markers.push(marker)
  })
}

function flyToCountry() {
  if (!map) return
  if (props.selectedCountry === 'ALL' || props.countryLat == null || props.countryLng == null) {
    map.flyTo([20, 0], 2, { duration: 1.2 })
  } else {
    map.flyTo([props.countryLat, props.countryLng], 5, { duration: 1.2 })
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
    attributionControl: false,
    minZoom: 1,
    maxZoom: 12,
  })

  updateTileLayer()

  // Wire popup button clicks (Add to Playlist + See Discography)
  map.on('popupopen', (e) => {
    const container = e.popup.getElement()

    const addBtn = container?.querySelector<HTMLButtonElement>('[data-add-playlist]')
    addBtn?.addEventListener('click', () => {
      try {
        const song = JSON.parse(decodeURIComponent(addBtn.dataset.addPlaylist ?? '')) as Song
        emit('addToPlaylist', song)
        map?.closePopup()
      } catch { /* ignore */ }
    })

    const discBtn = container?.querySelector<HTMLButtonElement>('[data-discography]')
    discBtn?.addEventListener('click', () => {
      try {
        const { index } = JSON.parse(decodeURIComponent(discBtn.dataset.discography ?? ''))
        discographyArtist.value = props.topArtists[index] ?? null
        showDiscography.value = true
        map?.closePopup()
      } catch { /* ignore */ }
    })
  })

  placeMarkers()
})

onBeforeUnmount(() => {
  clearMarkers()
  map?.remove()
  map = null
})

watch(() => props.metric, () => placeMarkers())
watch(() => [props.topArtists, props.topSongs, props.topAlbums], () => placeMarkers(), { deep: true })
watch(() => [props.selectedCountry, props.countryLat, props.countryLng], flyToCountry)
watch(() => theme.global.current.value.dark, () => updateTileLayer())
</script>
<style scoped>
.map-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
  height: 100%;
  min-height: 500px;
  max-height: calc(100vh - 100px);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
  gap: 12px;
}

.metric-toggle :deep(.v-btn) {
  font-size: 12px;
}

.map-hint {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.map-container {
  flex: 1;
  min-height: 460px;
}

/* Discography modal */
.discography-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.discography-header {
  background: #13131A;
}

.discography-artist {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.2;
}

.discography-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.discography-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 6px;
  border-radius: 8px;
  transition: background 0.15s;
}

.discography-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.discography-rank {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.discography-icon {
  flex-shrink: 0;
}

.discography-info {
  flex: 1;
  min-width: 0;
}

.discography-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discography-streams {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 1px;
}

.discography-trend {
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 20px;
}

.trend-up {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>

<style>
/* Dark popup theme — global because Leaflet renders popups outside component */
.dark-popup .leaflet-popup-content-wrapper {
  background: #1a1a2e;
  border: 1px solid rgba(0, 188, 212, 0.3);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  color: #fff;
}

.dark-popup .leaflet-popup-tip {
  background: #1a1a2e;
}
.dark-popup .leaflet-popup-content {
  margin: 10px 14px;
}

.leaflet-container {
  background: #0d0d1a;
}
</style>
