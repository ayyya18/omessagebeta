// src/context/ChatContext.jsx
import {
  createContext,
  useContext,
  useReducer,
} from "react";
import { useAuth } from "./AuthContext"; // Pastikan path ini benar

export const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // STATE AWAL YANG BENAR (dengan isPinned dan isArchived)
  const INITIAL_STATE = {
    chatId: null,
    user: {}, // Info user ATAU grup
    isGroup: false, // Flag grup
    isPinned: false, // <-- INI YANG HILANG
    isArchived: false, // <-- INI YANG HILANG
  };

  const chatReducer = (state, action) => {
    switch (action.type) {
      case "CHANGE_USER":
        const payload = action.payload; // Payload sekarang SELALU objek chatInfo lengkap
        
        // Cek apakah ini grup
        if (payload.isGroup) {
          return {
            user: payload.userInfo, // userInfo berisi info grup
            chatId: payload.userInfo.uid, // uid adalah ID grup
            isGroup: true,
            isPinned: payload.isPinned || false, // <-- AMBIL STATUS PIN
            isArchived: payload.isArchived || false, // <-- AMBIL STATUS ARSIP
          };
        } else {
          // Logika untuk chat 1-on-1
          // userInfo akan ada, baik dari ChatList, Search, atau handleTogglePin
          const userInfo = payload.userInfo; 
          
          // Hitung chatID
          const chatID = (currentUser.uid > userInfo.uid)
                ? currentUser.uid + userInfo.uid
                : userInfo.uid + currentUser.uid;

          return {
            user: userInfo, 
            chatId: chatID,
            isGroup: false,
            isPinned: payload.isPinned || false, // <-- AMBIL STATUS PIN
            isArchived: payload.isArchived || false, // <-- AMBIL STATUS ARSIP
          };
        }
      
      case "RESET":
        return INITIAL_STATE;
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  return (
    <ChatContext.Provider value={{ data: state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook
export const useChat = () => {
  return useContext(ChatContext);
};