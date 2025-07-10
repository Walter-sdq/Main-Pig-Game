import React from 'react'

const RulesModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        
        <h2>📖 Game Rules</h2>
        
        <ul className="rules-list">
          <li>
            <strong>Welcome to the Pig Game!</strong>
          </li>
          <li>
            Dice numbers range from 1 - 6. Whatever you roll gets added to your current score.
          </li>
          <li>
            Clicking <strong>Hold</strong> records your current score and switches player turns.
          </li>
          <li>
            Rolling a <strong>1</strong> 
            <img 
              src="/img/dice-1.png" 
              alt="dice showing 1" 
              style={{ width: '2rem', height: '2rem', margin: '0 0.5rem', verticalAlign: 'middle' }}
            />
            causes you to lose your current score and switches player turn.
          </li>
          <li>
            The first person to reach <strong>100 points wins</strong> 🏆
          </li>
          <li>
            <strong>Keyboard shortcuts:</strong>
            <br />
            • Press <kbd>R</kbd> to roll dice
            <br />
            • Press <kbd>H</kbd> to hold
            <br />
            • Press <kbd>Escape</kbd> to start new game
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RulesModal