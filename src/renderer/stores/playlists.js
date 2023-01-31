import { defineStore } from 'pinia'
import { DBPlaylistHandlers } from '../../../datastores/handlers/index'

export const usePlaylistsStore = defineStore('playlists', {
  state: () => {
    return {
      playlists: [
        {
          playlistName: 'Favorites',
          protected: true,
          videos: []
        },
        {
          playlistName: 'WatchLater',
          protected: true,
          removeOnWatched: true,
          videos: []
        }
      ]
    }
  },
  getters: {
    getFavorites() {
      return this.playlists[0]
    },
    getWatchLater() {
      return this.playlists[1]
    }
  },
  actions: {
    async addPlaylist(payload) {
      try {
        await DBPlaylistHandlers.create(payload)
        this.playlists.push(payload)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async addPlaylists(payload) {
      try {
        await DBPlaylistHandlers.create(payload)
        this.playlists = this.playlists.concat(payload)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async addVideo(payload) {
      try {
        const { playlistName, videoData } = payload
        await DBPlaylistHandlers.upsertVideoByPlaylistName(playlistName, videoData)
        const playlist = this.playlists.find(playlist => playlist.playlistName === payload.playlistName)
        if (playlist) {
          playlist.videos.push(payload.videoData)
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async addVideos(payload) {
      try {
        const { playlistId, videoIds } = payload
        await DBPlaylistHandlers.upsertVideoIdsByPlaylistId(playlistId, videoIds)
        const playlist = this.playlists.find(playlist => playlist._id === payload.playlistId)
        if (playlist) {
          playlist.videos = playlist.videos.concat(payload.playlistIds)
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async grabAllPlaylists() {
      try {
        const payload = await DBPlaylistHandlers.find()
        if (payload.length === 0) {
          this.addPlaylists(payload)
        } else {
          this.playlists = payload
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removeAllPlaylists() {
      try {
        await DBPlaylistHandlers.deleteAll()
        this.playlists = this.playlists.filter(playlist => playlist.protected !== true)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removeAllVideos(playlistName) {
      try {
        await DBPlaylistHandlers.deleteAllVideosByPlaylistName(playlistName)
        const playlist = this.playlists.find(playlist => playlist.playlistName === playlistName)
        if (playlist) {
          playlist.videos = []
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removePlaylist(playlistId) {
      try {
        await DBPlaylistHandlers.delete(playlistId)
        this.playlists = this.playlists.filter(playlist => playlist._id !== playlistId || playlist.protected)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removePlaylists(playlistIds) {
      try {
        await DBPlaylistHandlers.deleteMultiple(playlistIds)
        this.playlists = this.playlists.filter(playlist => !playlistIds.contains(playlist._id) || playlist.protected)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removeVideo(payload) {
      try {
        const { playlistName, videoId } = payload
        await DBPlaylistHandlers.deleteVideoIdByPlaylistName(playlistName, videoId)
        const playlist = this.playlists.findIndex(playlist => playlist.playlistName === payload.playlistName)
        if (playlist !== -1) {
          this.playlists[playlist].videos = this.playlists[playlist].videos.filter(video => video.videoId !== payload.videoId)
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removeVideos(payload) {
      try {
        const { playlistName, videoIds } = payload
        await DBPlaylistHandlers.deleteVideoIdsByPlaylistName(playlistName, videoIds)
        const playlist = this.playlists.findIndex(playlist => playlist._id === payload.playlistId)
        if (playlist !== -1) {
          playlist.videos = playlist.videos.filter(video => payload.videoId.indexOf(video) === -1)
        }
      } catch (errMessage) {
        console.error(errMessage)
      }
    }
  }
})
