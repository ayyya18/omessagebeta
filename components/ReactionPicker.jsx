import React from 'react';
import Picker from 'emoji-picker-react';
import './ReactionPicker.css';

const ReactionPicker = ({ onSelect, onClose, pickerStyle }) => {
  const handleEmojiClick = (emojiObject) => {
    if (onSelect) onSelect(emojiObject);
    if (onClose) onClose();
  };

  return (
    <div className="reaction-picker-popup">
      <Picker onEmojiClick={handleEmojiClick} pickerStyle={pickerStyle || { width: 260, height: 220 }} disableSearchBar disableSkinTonePicker preload />
    </div>
  );
};

export default ReactionPicker;
