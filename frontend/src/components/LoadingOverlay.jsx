import React from 'react'

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay loading-overlay--show">
      <img
        src="/img/loadingGif.gif"
        alt="Loading..."
        className="loading-gif"
      />
    </div>
  )
}

export default LoadingOverlay