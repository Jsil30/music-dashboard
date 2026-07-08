<template>
  <div class="summary-cards">
    <!-- Total Streams Card -->
    <v-card elevation="0" rounded="lg" class="metric-card mb-4">
      <v-card-text class="pa-4">
        <div class="card-label mb-2">
          <v-icon color="primary" size="16">mdi-broadcast</v-icon>
          <span class="ml-2">Total Streams</span>
        </div>
        <div class="d-flex align-center justify-space-between">
          <span class="metric-value">{{ formatStreams(totalStreams) }}</span>
          <TrendBadge :trend="trendPercent" />
        </div>
        <div class="metric-sub mt-1">Worldwide streams this period</div>
      </v-card-text>
    </v-card>

    <!-- Top Artists Card -->
    <v-card elevation="0" rounded="lg" class="metric-card mb-4">
      <v-card-text class="pa-4">
        <div class="card-label mb-3">
          <v-icon color="primary" size="16">mdi-microphone-variant</v-icon>
          <span class="ml-2">Top Artists</span>
        </div>
        <div
          v-for="(artist, i) in topArtists.slice(0, 10)"
          :key="artist.id"
          class="rank-row"
          :class="{ 'rank-row--top3': i < 3 }"
        >
          <span class="rank-num">{{ i + 1 }}</span>
          <div class="rank-info">
            <span class="rank-name">{{ artist.name }}</span>
            <span class="rank-sub">{{ formatStreams(artist.streams) }} streams</span>
          </div>
          <TrendBadge :trend="artist.trend" compact />
        </div>
      </v-card-text>
    </v-card>

    <!-- Top Songs Card -->
    <v-card elevation="0" rounded="lg" class="metric-card mb-4">
      <v-card-text class="pa-4">
        <div class="card-label mb-3">
          <v-icon color="primary" size="16">mdi-music-note</v-icon>
          <span class="ml-2">Top Songs</span>
        </div>
        <div
          v-for="(song, i) in topSongs.slice(0, 10)"
          :key="song.id"
          class="rank-row rank-row--clickable"
          :class="{ 'rank-row--top3': i < 3 }"
          @click="$emit('addToPlaylist', song)"
        >
          <span class="rank-num">{{ i + 1 }}</span>
          <div class="rank-info">
            <span class="rank-name">{{ song.title }}</span>
            <span class="rank-sub">{{ song.artist }}</span>
          </div>
          <div class="rank-actions">
            <TrendBadge :trend="song.trend" compact />
            <v-icon size="14" color="rgba(255,255,255,0.2)" class="add-icon ml-1">mdi-plus-circle</v-icon>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Top Albums Card -->
    <v-card elevation="0" rounded="lg" class="metric-card">
      <v-card-text class="pa-4">
        <div class="card-label mb-3">
          <v-icon color="primary" size="16">mdi-album</v-icon>
          <span class="ml-2">Top Albums</span>
        </div>
        <div
          v-for="(album, i) in topAlbums.slice(0, 10)"
          :key="album.id"
          class="rank-row"
          :class="{ 'rank-row--top3': i < 3 }"
        >
          <span class="rank-num">{{ i + 1 }}</span>
          <div class="rank-info">
            <span class="rank-name">{{ album.title }}</span>
            <span class="rank-sub">{{ album.artist }}</span>
          </div>
          <TrendBadge :trend="album.trend" compact />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { Artist, Song, Album } from '../types'
import TrendBadge from './TrendBadge.vue'

defineProps<{
  topArtists: Artist[]
  topSongs: Song[]
  topAlbums: Album[]
  totalStreams: number
  trendPercent: number
}>()

defineEmits<{
  addToPlaylist: [song: Song]
}>()

function formatStreams(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}
</script>

<style scoped>
.metric-card {
  background: #13131A !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.card-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.02em;
  line-height: 1;
}

.metric-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.rank-row--clickable {
  cursor: pointer;
}

.rank-row--clickable:hover {
  background: rgba(255, 255, 255, 0.04);
}

.rank-row--clickable:hover .add-icon {
  color: rgba(0, 188, 212, 0.7) !important;
}

.rank-row--top3 .rank-name {
  color: rgba(255, 255, 255, 0.9);
}

.rank-num {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.25);
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-sub {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.add-icon {
  transition: color 0.15s;
}
</style>
