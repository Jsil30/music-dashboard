<template>
  <div class="playlist-view">
    <div class="playlist-header mb-6">
      <div>
        <h2 class="playlist-title">My Playlist</h2>
        <p class="playlist-subtitle">{{ playlist.length }} song{{ playlist.length !== 1 ? 's' : '' }}</p>
      </div>
      <v-btn
        v-if="playlist.length > 0"
        variant="outlined"
        color="error"
        size="small"
        prepend-icon="mdi-delete-sweep"
        @click="$emit('clear')"
      >
        Clear All
      </v-btn>
    </div>

    <!-- Empty state -->
    <div v-if="playlist.length === 0" class="empty-state">
      <v-icon size="64" color="rgba(255,255,255,0.15)" class="mb-4">mdi-music-note-plus</v-icon>
      <p class="empty-title">Your playlist is empty</p>
      <p class="empty-sub">Go to Home and add songs from the Top Songs card</p>
    </div>

    <!-- Playlist table -->
    <div v-else class="playlist-table">
      <div class="table-header">
        <span class="col-num">#</span>
        <span class="col-title">Title</span>
        <span class="col-artist">Artist</span>
        <span class="col-album">Album</span>
        <span class="col-duration">
          <v-icon size="14">mdi-clock-outline</v-icon>
        </span>
        <span class="col-action" />
      </div>
      <v-divider opacity="0.1" class="my-2" />
      <div
        v-for="(item, index) in playlist"
        :key="item.id"
        class="table-row"
        @mouseenter="hoveredRow = index"
        @mouseleave="hoveredRow = null"
      >
        <span class="col-num">
          <v-icon v-if="hoveredRow === index" size="16" color="primary">mdi-play</v-icon>
          <span v-else>{{ index + 1 }}</span>
        </span>
        <div class="col-title">
          <span class="song-title">{{ item.title }}</span>
        </div>
        <span class="col-artist">{{ item.artist }}</span>
        <span class="col-album">{{ item.album }}</span>
        <span class="col-duration">{{ item.duration }}</span>
        <span class="col-action">
          <v-btn
            icon
            size="x-small"
            variant="text"
            color="error"
            @click="$emit('remove', item.id)"
          >
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PlaylistItem } from '../types'

defineProps<{ playlist: PlaylistItem[] }>()
defineEmits<{
  remove: [id: string]
  clear: []
}>()

const hoveredRow = ref<number | null>(null)
</script>

<style scoped>
.playlist-view {
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.playlist-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  margin: 0;
}

.playlist-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  margin: 4px 0 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

.playlist-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 60px 40px;
  gap: 12px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  align-items: center;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr 60px 40px;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: default;
  transition: background 0.15s;
  align-items: center;
}

.table-row:hover {
  background: rgba(255,255,255,0.04);
}

.col-num {
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
}

.song-title {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-artist, .col-album {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-duration {
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  text-align: right;
}

.col-action {
  display: flex;
  justify-content: center;
}
</style>
