import React, { createContext, useContext, useState, useEffect } from 'react'

const SoundContext = createContext()

// Sound URLs - using placeholder URLs, replace with actual sound files
const sounds = {
  dice: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  hold: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  win: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  music: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
}

export function SoundProvider({ children }) {
  const [isMuted, setIsMuted] = useState(false)
  const [audioElements, setAudioElements] = useState({})

  useEffect(() => {
    // Initialize audio elements
    const elements = {}
    Object.keys(sounds).forEach(key => {
      elements[key] = new Audio(sounds[key])
      elements[key].preload = 'auto'
      
      // Loop background music
      if (key === 'music') {
        elements[key].loop = true
        elements[key].volume = 0.3
      } else {
        elements[key].volume = 0.5
      }
    })
    setAudioElements(elements)

    return () => {
      // Cleanup
      Object.values(elements).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  const playSound = (soundName) => {
    if (isMuted || !audioElements[soundName]) return

    try {
      audioElements[soundName].currentTime = 0
      audioElements[soundName].play().catch(e => {
        console.warn('Could not play sound:', e)
      })
    } catch (error) {
      console.warn('Sound playback failed:', error)
    }
  }

  const playMusic = () => {
    if (isMuted || !audioElements.music) return

    try {
      audioElements.music.play().catch(e => {
        console.warn('Could not play music:', e)
      })
    } catch (error) {
      console.warn('Music playback failed:', error)
    }
  }

  const pauseMusic = () => {
    if (audioElements.music) {
      audioElements.music.pause()
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    if (newMutedState) {
      pauseMusic()
    } else {
      playMusic()
    }
    
    return newMutedState
  }

  const value = {
    isMuted,
    playSound,
    playMusic,
    pauseMusic,
    toggleMute
  }

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}