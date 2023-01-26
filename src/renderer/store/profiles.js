import { defineStore } from 'pinia'
import { MAIN_PROFILE_ID } from '../../../constants'
import { DBProfileHandlers } from '../../../datastores/handlers/index'
import { calculateColorLuminance, getRandomColor } from '../../helpers/colors'
import { useSettingsStore } from './settings'
export const useProfilesStore = defineStore('profiles', {
  state: () => {
    return {
      profileList: [{
        _id: MAIN_PROFILE_ID,
        name: 'All Channels',
        bgColor: '#000000',
        textColor: '#FFFFFF',
        subscriptions: []
      }],
      activeProfileId: MAIN_PROFILE_ID
    }
  },
  getters: {
    getActiveProfile() {
      const activeProfileId = this.activeProfile
      return this.profileList.find((profile) => {
        return profile._id === activeProfileId
      })
    },

    getProfileById(id) {
      return this.profileList.find(p => p._id === id)
    }
  },
  actions: {
    async grabAllProfiles(defaultName = null) {
      let profiles
      try {
        profiles = await DBProfileHandlers.find()
      } catch (errMessage) {
        console.error(errMessage)
        return
      }

      if (!Array.isArray(profiles)) return

      if (profiles.length === 0) {
        // Create a default profile and persist it
        const randomColor = getRandomColor()
        const textColor = calculateColorLuminance(randomColor)
        const defaultProfile = {
          _id: MAIN_PROFILE_ID,
          name: defaultName,
          bgColor: randomColor,
          textColor: textColor,
          subscriptions: []
        }

        try {
          await DBProfileHandlers.create(defaultProfile)
          this.setProfileList([defaultProfile])
        } catch (errMessage) {
          console.error(errMessage)
        }

        return
      }

      // We want the primary profile to always be first
      // So sort with that then sort alphabetically by profile name
      profiles = profiles.sort(profileSort)

      if (this.profileList.length < profiles.length) {
        const defaultProf = useSettingsStore().defaultProfile
        const profile = profiles.find((profile) => {
          return profile._id === defaultProf
        })

        if (profile) {
          this.setActiveProfile(profile._id)
        }
      }

      this.setProfileList(profiles)
    },
    async updateSubscriptionDetails({ channelThumbnailUrl, channelName, channelId }) {
      const thumbnail = channelThumbnailUrl?.replace(/=s\d*/, '=s176') ?? null // change thumbnail size if different
      const profileList = this.profileList
      for (const profile of profileList) {
        const currentProfileCopy = JSON.parse(JSON.stringify(profile))
        const channel = currentProfileCopy.subscriptions.find((channel) => {
          return channel.id === channelId
        }) ?? null
        if (channel === null) { continue }
        let updated = false
        if (channel.name !== channelName || (channel.thumbnail !== thumbnail && thumbnail !== null)) {
          if (thumbnail !== null) {
            channel.thumbnail = thumbnail
          }
          channel.name = channelName
          updated = true
        }
        if (updated) {
          this.updateProfile(currentProfileCopy)
        } else { // channel has not been updated, stop iterating through profiles
          break
        }
      }
    },

    async createProfile(profile) {
      try {
        const newProfile = await DBProfileHandlers.create(profile)
        this.addProfileToList(newProfile)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async updateProfile(profile) {
      try {
        await DBProfileHandlers.upsert(profile)
        this.upsertProfileToList(profile)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    async removeProfile(profileId) {
      try {
        await DBProfileHandlers.delete(profileId)
        this.removeProfileFromList(profileId)
      } catch (errMessage) {
        console.error(errMessage)
      }
    },

    compactProfiles() {
      DBProfileHandlers.persist()
    },

    updateActiveProfile(id) {
      this.activeProfileId = id
    },

    setProfileList(profileList) {
      this.profileList = profileList
    },

    setActiveProfile(activeProfile) {
      this.activeProfile = activeProfile
    },

    addProfileToList(profile) {
      this.profileList.push(profile)
      this.profileList.sort(profileSort)
    },

    upsertProfileToList(updatedProfile) {
      const i = this.profileList.findIndex((p) => {
        return p._id === updatedProfile._id
      })

      if (i === -1) {
        this.profileList.push(updatedProfile)
      } else {
        this.profileList.splice(i, 1, updatedProfile)
      }

      this.profileList.sort(profileSort)
    },

    removeProfileFromList(profileId) {
      const i = this.profileList.findIndex((profile) => {
        return profile._id === profileId
      })

      this.profileList.splice(i, 1)
    }
  }
})

function profileSort(a, b) {
  if (a._id === MAIN_PROFILE_ID) return -1
  if (b._id === MAIN_PROFILE_ID) return 1
  return a.name.localeCompare(b.name)
}
