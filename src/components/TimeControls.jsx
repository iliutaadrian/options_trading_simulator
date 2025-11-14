import React from 'react';

const TimeControls = ({
  currentIndex,
  totalDays,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStepBackward,
  onStepForward,
  onSpeedChange,
  onSliderChange,
  currentDate
}) => {
  return (
    <div className="time-controls">
      <div className="control-row">
        <div className="date-display">
          <h2>{currentDate}</h2>
          <p>Day {currentIndex + 1} of {totalDays}</p>
        </div>

        <div className="playback-buttons">
          <button
            onClick={onStepBackward}
            disabled={currentIndex <= 0}
            className="control-btn"
            title="Previous Day"
          >
            ⏮
          </button>

          {isPlaying ? (
            <button onClick={onPause} className="control-btn play-btn" title="Pause">
              ⏸
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={currentIndex >= totalDays - 1}
              className="control-btn play-btn"
              title="Play"
            >
              ▶
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={currentIndex >= totalDays - 1}
            className="control-btn"
            title="Next Day"
          >
            ⏭
          </button>
        </div>

        <div className="speed-controls">
          <label>Speed:</label>
          <select value={playbackSpeed} onChange={(e) => onSpeedChange(Number(e.target.value))}>
            <option value={7500}>0.5x</option>
            <option value={5000}>1x</option>
            <option value={2500}>2x</option>
            <option value={1000}>4x</option>
          </select>
        </div>
      </div>

      <div className="timeline-slider">
        <input
          type="range"
          min="0"
          max={totalDays - 1}
          value={currentIndex}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="slider"
        />
      </div>
    </div>
  );
};

export default TimeControls;
