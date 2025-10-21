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
    user: {}, // Info user yang sedang kita ajak chat
  };

  const chatReducer = (state, action) => {
    switch (action.type) {
      case "CHANGE_USER":
        return {
          user: action.payload,
          chatId:
            currentUser.uid > action.payload.uid
              ? currentUser.uid + action.payload.uid
              : action.payload.uid + currentUser.uid,
        };
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