import { createContext, useContext, useReducer } from "react";
import { useAuth } from "./AuthContext";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const INITIAL_STATE = {
    chatId: null,
    user: {},
    isGroup: false,
    isPinned: false,
    isArchived: false,
  };

  const chatReducer = (state, action) => {
    switch (action.type) {
      case "CHANGE_USER":
        const payload = action.payload;
        if (payload.isGroup) {
          return {
            user: payload.userInfo,
            chatId: payload.userInfo.uid,
            isGroup: true,
            isPinned: payload.isPinned || false,
            isArchived: payload.isArchived || false,
          };
        } else {
          const userInfo = payload.userInfo;
          const chatID = currentUser.uid > userInfo.uid
                ? currentUser.uid + userInfo.uid
                : userInfo.uid + currentUser.uid;

          return {
            user: userInfo, 
            chatId: chatID,
            isGroup: false,
            isPinned: payload.isPinned || false,
            isArchived: payload.isArchived || false,
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

export const useChat = () => useContext(ChatContext);