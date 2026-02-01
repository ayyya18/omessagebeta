// src/utils/searchIndex.js
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function indexChat(chatId, chatInfo) {
  if (!chatId || !chatInfo) return;
  try {
    await setDoc(doc(db, 'searchIndex_chats', chatId), {
      chatId,
      displayName: chatInfo.userInfo?.displayName || chatInfo.groupName || '',
      isGroup: !!chatInfo.isGroup,
      lastMessage: chatInfo.lastMessage?.text || '',
      date: chatInfo.date || null
    });
  } catch (err) { console.error('indexChat error', err); }
}

export async function indexUser(user) {
  if (!user || !user.uid) return;
  try {
    await setDoc(doc(db, 'searchIndex_users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || '',
      handle: user.handle || '',
      photoURL: user.photoURL || ''
    });
  } catch (err) { console.error('indexUser error', err); }
}

export async function deleteChatIndex(chatId) {
  if (!chatId) return;
  try {
    await deleteDoc(doc(db, 'searchIndex_chats', chatId));
  } catch (err) { console.error('deleteChatIndex error', err); }
}

export async function deleteUserIndex(uid) {
  if (!uid) return;
  try {
    await deleteDoc(doc(db, 'searchIndex_users', uid));
  } catch (err) { console.error('deleteUserIndex error', err); }
}
