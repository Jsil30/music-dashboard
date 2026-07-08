<template>
  <div class="summary-cards">

    <!-- Total Streams — full width banner -->
    <v-card elevation="0" rounded="lg" class="metric-card streams-card">
      <v-card-text class="pa-4">
        <div class="streams-inner">
          <div class="streams-left">
            <div class="card-label mb-1">
              <v-icon color="primary" size="15">mdi-broadcast</v-icon>
              <span class="ml-2">Total Streams</span>
            </div>
            <div class="streams-number">{{ formatStreams(totalStreams) }}</div>
            <div class="metric-sub">Streams this period</div>
          </div>
          <TrendBadge :trend="trendPercent" class="streams-badge" />
        </div>
      </v-card-text>
    </v-card>

    <!-- Top Songs — full width -->
    <v-card elevation="0" rounded="lg" class="metric-card">
      <v-card-text class="pa-3">
          <div class="card-label mb-2">
            <v-icon color="primary" size="15">mdi-music-note</v-icon>
            <span class="ml-2">Top Songs</span>
          </div>
        <div class="songs-grid">
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
              <v-icon size="13" color="rgba(255,255,255,0.2)" class="add-icon ml-1">mdi-plus-circle</v-icon>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Bottom row: Top Artists + Top Albums -->
    <div class="two-cards">
      <!-- Top Artists -->
      <v-card elevation="0" rounded="lg" class="metric-card">
        <v-card-text class="pa-3">
          <div class="card-label mb-2">
            <v-icon color="primary" size="15">mdi-microphone-variant</v-icon>
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

      <!-- Top Albums -->
      <v-card elevation="0" rounded="lg" class="metric-card">
        <v-card-text class="pa-3">
          <div class="card-label mb-2">
            <v-icon color="primary" size="15">mdi-album</v-icon>
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
/* ── Outer layout ─────────────────────────────── */
.summary-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Top Songs: column-flow so items read top→bottom then left→right */
.songs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(5, auto);
  grid-auto-flow: column;
  gap: 0 40px;
}

/* Bottom row: Artists + Albums 50/50 */
.two-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

/* ── Cards ────────────────────────────────────── */
.metric-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Total Streams banner */
.streams-card {
  flex-shrink: 0;
}

.streams-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.streams-number {
  font-size: 32px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 4px 0 2px;
}

.streams-badge {
  flex-shrink: 0;
  font-size: 14px !important;
  padding: 4px 10px !important;
}

/* ── Shared label ─────────────────────────────── */
.card-label {
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.metric-sub {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.38);
}

/* ── Rank rows ────────────────────────────────── */
.rank-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 2px;
  border-radius: 5px;
  transition: background 0.15s;
}

.rank-row--clickable {
  cursor: pointer;
}

.rank-row--clickable:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.rank-row--clickable:hover .add-icon {
  color: rgba(0, 188, 212, 0.8) !important;
}

.rank-row--top3 .rank-name {
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.rank-num {
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.28);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.78);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-sub {
  display: block;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.42);
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
