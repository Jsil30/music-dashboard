<template>
  <v-app theme="dark" :style="{ background: '#0A0A0F' }">
    <!-- App Bar -->
    <v-app-bar
      flat
      :style="{ background: 'rgba(13,13,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }"
      height="64"
    >
      <template #prepend>
        <v-icon color="primary" size="26" class="ml-2">mdi-equalizer</v-icon>
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

      <!-- Country Picker -->
      <v-select
        v-model="selectedCountry"
        :items="countryOptions"
        item-title="name"
        item-value="code"
        density="compact"
        variant="outlined"
        hide-details
        rounded="pill"
        prepend-inner-icon="mdi-earth"
        class="country-picker mx-3"
        style="max-width: 200px;"
        color="primary"
      />
    </v-app-bar>

    <!-- Main content -->
    <v-main :style="{ background: '#0A0A0F', paddingTop: '64px' }">
      <!-- Home View -->
      <div v-if="currentView === 'home'" class="home-layout">
        <v-container fluid class="pa-4 pa-md-6">
          <v-row>
            <!-- Left: Summary Cards -->
            <v-col cols="12" lg="4" class="d-flex flex-column gap-4">
              <SummaryCards
                :top-artists="currentData.topArtists"
                :top-songs="currentData.topSongs"
                :top-albums="currentData.topAlbums"
                :total-streams="currentData.totalStreams"
                :trend-percent="currentData.trendPercent"
                @add-to-playlist="addToPlaylist"
              />

              <!-- Add to playlist quick-add -->
              <v-card elevation="0" rounded="lg" class="quick-add-card mt-2">
                <v-card-text class="pa-4">
                  <div class="card-label mb-3">
                    <v-icon color="primary" size="18">mdi-playlist-plus</v-icon>
                    <span class="ml-2">Add to Playlist</span>
                  </div>
                  <v-select
                    v-model="selectedSongToAdd"
                    :items="currentData.topSongs"
                    :item-title="(s: any) => `${s.title} — ${s.artist}`"
                    item-value="id"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Pick a song…"
                    color="primary"
                    class="mb-3"
                    return-object
                  />
                  <v-btn
                    block
                    color="primary"
                    variant="tonal"
                    :disabled="!selectedSongToAdd"
                    prepend-icon="mdi-plus"
                    rounded="pill"
                    @click="addSelectedSong"
                  >
                    Add Song
                  </v-btn>
                </v-card-text>
              </v-card>
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
                @update:metric="mapMetric = $event"
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
import type { Metrics, Metric, PlaylistItem, Song } from './types'

const metrics = metricsRaw as unknown as Metrics

const currentView = ref<'home' | 'playlist'>('home')
const selectedCountry = ref<string>('ALL')
const mapMetric = ref<Metric>('artists')
const playlist = ref<PlaylistItem[]>([])
const selectedSongToAdd = ref<Song | null>(null)
const snack = ref({ show: false, text: '' })

const countryOptions = computed(() => [
  { code: 'ALL', name: '🌍 All Countries' },
  ...Object.entries(metrics.countries).map(([code, c]) => ({
    code,
    name: c.name,
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

function addSelectedSong() {
  if (!selectedSongToAdd.value) return
  addToPlaylist(selectedSongToAdd.value)
  selectedSongToAdd.value = null
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
  color: rgba(255,255,255,0.9);
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

.quick-add-card {
  background: #13131A !important;
  border: 1px solid rgba(255,255,255,0.06);
}

:deep(.country-picker .v-field) {
  font-size: 13px;
}

:deep(.v-btn-toggle .v-btn) {
  font-size: 12px;
  font-weight: 500;
}
</style>
