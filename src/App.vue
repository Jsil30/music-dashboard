<template>
  <v-app :theme="appTheme" :style="{ background: appBg }">
    <!-- App Bar -->
    <v-app-bar
      flat
      :style="{ background: appBarBg, backdropFilter: 'blur(12px)', borderBottom: appBarBorder }"
      height="64"
    >
      <template #prepend>
        <v-icon color="primary" size="26">mdi-equalizer</v-icon>
      </template>

      <v-app-bar-title class="app-title">
        SoundPulse <span class="title-accent">Global</span>
      </v-app-bar-title>

      <!-- Navigation -->
      <v-btn-toggle
        v-model="currentView"
        mandatory
        density="compact"
        variant="text"
        class="mx-2"
      >
        <v-btn value="home" size="small" prepend-icon="mdi-home-variant">Home</v-btn>
        <v-btn value="playlist" size="small" prepend-icon="mdi-playlist-music">
          Playlist
          <v-badge
            v-if="playlist.length > 0"
            :content="playlist.length"
            color="primary"
            inline
            class="ml-1"
          />
        </v-btn>
      </v-btn-toggle>

      <!-- Theme toggle -->
      <v-btn
        :icon="appTheme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        size="small"
        class="ml-2"
        @click="toggleTheme"
      />
    </v-app-bar>

    <!-- Main content -->
    <v-main :style="{ background: appBg, paddingTop: '64px', paddingLeft: '0', paddingRight: '0' }">
      <!-- Home View -->
      <div v-if="currentView === 'home'" class="home-layout">
        <v-container fluid class="py-4 py-sm-6 py-lg-10 px-4 px-sm-6 px-lg-10">
          <v-row>
            <!-- Left: Summary Cards -->
            <v-col cols="12" lg="4">
              <SummaryCards
                :top-artists="currentData.topArtists"
                :top-songs="currentData.topSongs"
                :top-albums="currentData.topAlbums"
                :total-streams="currentData.totalStreams"
                :trend-percent="currentData.trendPercent"
                @add-to-playlist="addToPlaylist"
              />
            </v-col>

            <!-- Right: Map -->
            <v-col cols="12" lg="8">
              <WorldMap
                :metric="mapMetric"
                :top-artists="currentData.topArtists"
                :top-songs="currentData.topSongs"
                :top-albums="currentData.topAlbums"
                :selected-country="selectedCountry"
                :country-lat="selectedCountryData?.lat"
                :country-lng="selectedCountryData?.lng"
                :country-name="selectedCountryData?.name"
                :global-top-artists="metrics.global.topArtists"
                :global-top-songs="metrics.global.topSongs"
                :global-top-albums="metrics.global.topAlbums"
                :all-albums="allAlbums"
                :country-options="countryOptions"
                @update:metric="mapMetric = $event"
                @update:selected-country="selectedCountry = $event"
                @add-to-playlist="addToPlaylist"
              />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Playlist View -->
      <div v-else-if="currentView === 'playlist'">
        <PlaylistView
          :playlist="playlist"
          @remove="removeFromPlaylist"
          @clear="playlist = []"
        />
      </div>
    </v-main>

    <!-- Snackbar feedback -->
    <v-snackbar v-model="snack.show" :timeout="2200" location="bottom right" color="surface" rounded="pill">
      <v-icon color="primary" size="18" class="mr-2">mdi-check-circle</v-icon>
      {{ snack.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import metricsRaw from './data/metrics.json'
import SummaryCards from './components/SummaryCards.vue'
import WorldMap from './components/WorldMap.vue'
import PlaylistView from './components/PlaylistView.vue'
import { useTheme } from 'vuetify'
import type { Metrics, Metric, PlaylistItem, Song } from './types'

const metrics = metricsRaw as unknown as Metrics
const theme = useTheme()

const appTheme = computed(() => theme.global.name.value)

function toggleTheme() {
  theme.change(theme.global.current.value.dark ? 'light' : 'dark')
}

const appBg = computed(() => theme.global.current.value.dark ? '#0A0A0F' : '#F0F2F5')
const appBarBg = computed(() =>
  theme.global.current.value.dark ? 'rgba(13,13,26,0.95)' : 'rgba(255,255,255,0.95)'
)
const appBarBorder = computed(() =>
  theme.global.current.value.dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)'
)

const currentView = ref<'home' | 'playlist'>('home')
const selectedCountry = ref<string>('ALL')
const mapMetric = ref<Metric>('artists')
const playlist = ref<PlaylistItem[]>([])
const snack = ref({ show: false, text: '' })

// Convert ISO 3166-1 alpha-2 code to flag emoji
const flagEmoji = (code: string) =>
  [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')

const countryOptions = computed(() => [
  { code: 'ALL', name: '🌍 All Countries' },
  ...Object.entries(metrics.countries).map(([code, c]) => ({
    code,
    name: `${flagEmoji(code)} ${c.name}`,
  })),
])

const selectedCountryData = computed(() =>
  selectedCountry.value === 'ALL'
    ? null
    : metrics.countries[selectedCountry.value] ?? null
)

// All unique albums across global + every country, for the discography modal
const allAlbums = computed(() => {
  const seen = new Set<string>()
  const albums = []
  for (const al of metrics.global.topAlbums) {
    if (!seen.has(al.id)) { seen.add(al.id); albums.push(al) }
  }
  for (const c of Object.values(metrics.countries)) {
    for (const al of c.topAlbums) {
      if (!seen.has(al.id)) { seen.add(al.id); albums.push(al) }
    }
  }
  return albums
})

const currentData = computed(() => {
  if (selectedCountry.value === 'ALL') {
    return {
      topArtists: metrics.global.topArtists,
      topSongs: metrics.global.topSongs,
      topAlbums: metrics.global.topAlbums,
      totalStreams: metrics.global.totalStreams,
      trendPercent: metrics.global.trendPercent,
    }
  }
  const c = metrics.countries[selectedCountry.value]
  return {
    topArtists: c?.topArtists ?? [],
    topSongs: c?.topSongs ?? [],
    topAlbums: c?.topAlbums ?? [],
    totalStreams: c?.totalStreams ?? 0,
    trendPercent: c?.trendPercent ?? 0,
  }
})

function addToPlaylist(song: Song) {
  if (playlist.value.some(p => p.id === song.id)) {
    snack.value = { show: true, text: `"${song.title}" is already in your playlist` }
    return
  }
  playlist.value.push({
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    addedAt: new Date().toISOString(),
  })
  snack.value = { show: true, text: `Added "${song.title}" to playlist` }
}

function removeFromPlaylist(id: string) {
  playlist.value = playlist.value.filter(p => p.id !== id)
}
</script>

<style scoped>
.app-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.title-accent {
  color: #00BCD4;
}

.home-layout {
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.card-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}

:deep(.country-picker .v-field) {
  font-size: 13px;
}

:deep(.v-btn-toggle .v-btn) {
  font-size: 12px;
  font-weight: 500;
}

/* ── Responsive app bar horizontal padding ───────────────────
   Mirrors the container's px-4 / px-sm-6 / px-lg-10 so the
   icon and content always start / end at the same x position. */
:deep(.v-toolbar__prepend) {
  padding-left: 16px;
  margin-right: 4px;
}
:deep(.v-toolbar__content) {
  padding-right: 16px;
}

@media (min-width: 600px) {
  :deep(.v-toolbar__prepend) { padding-left: 24px; }
  :deep(.v-toolbar__content) { padding-right: 24px; }
}

@media (min-width: 1280px) {
  :deep(.v-toolbar__prepend) { padding-left: 40px; }
  :deep(.v-toolbar__content) { padding-right: 40px; }
}
</style>
