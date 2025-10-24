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
  
  const INITIAL_STATE = {
    chatId: null,
    user: {}, // Info user ATAU grup
    isGroup: false, // Flag baru
  };

  const chatReducer = (state, action) => {
    switch (action.type) {
      case "CHANGE_USER":
        const payload = action.payload;
        
        // Cek apakah ini grup
        if (payload.isGroup) {
          return {
            user: payload.userInfo, // userInfo berisi info grup
            chatId: payload.userInfo.uid, // uid adalah ID grup
            isGroup: true,
          };
        } else {
          // Logika untuk chat 1-on-1 (tetap sama)
          return {
            user: payload, // payload adalah info user
            chatId:
              currentUser.uid > payload.uid
                ? currentUser.uid + payload.uid
                : payload.uid + currentUser.uid,
            isGroup: false,
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