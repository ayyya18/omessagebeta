// src/context/ChatContext.jsx
import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useState
} from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

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

  // Fix: Use ref to access latest currentUser inside reducer
  const currentUserRef = useRef(currentUser);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Listen to total unread count
  useEffect(() => {
    if (!currentUser?.uid) {
      setTotalUnreadCount(0);
      return;
    }

    const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let count = 0;
        Object.values(data).forEach(chat => {
          if (chat.unreadCount && typeof chat.unreadCount === 'number') {
            count += chat.unreadCount;
          }
        });
        setTotalUnreadCount(count);
      } else {
        setTotalUnreadCount(0);
      }
    }, (err) => {
      console.error("Error fetching unread count:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  const chatReducer = (state, action) => {
    const currentAuthUser = currentUserRef.current;

    switch (action.type) {
      case "CHANGE_USER":
        // PENTING: Cek apakah currentUser ada sebelum akses uid
        if (!currentAuthUser) return state;

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
          // Hitung chatID yang aman
          const chatID = (currentAuthUser.uid > userInfo.uid)
            ? currentAuthUser.uid + userInfo.uid
            : userInfo.uid + currentAuthUser.uid;

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
    <ChatContext.Provider value={{ data: state, dispatch, totalUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};