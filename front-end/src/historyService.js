// src/historyService.js
// Firebase Firestore helper services for managing user chat history (ChatGPT-style)
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";

// Save or update a chat session under /users/{uid}/sessions/{sessionId}
export const saveChatSession = async (uid, sessionId, messages, title) => {
  if (!uid || !sessionId || !messages || messages.length === 0) return;
  try {
    const sessionRef = doc(db, "users", uid, "sessions", sessionId);
    await setDoc(sessionRef, {
      title: title || "New Conversation",
      messages: messages,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving chat session in Firestore:", error);
  }
};

// Retrieve all chat sessions for a user, ordered by last update
export const getChatSessions = async (uid) => {
  if (!uid) return [];
  try {
    const sessionsRef = collection(db, "users", uid, "sessions");
    const q = query(sessionsRef, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Handle serializing Firestore Timestamp to ms number
      const ms = data.updatedAt ? data.updatedAt.toMillis() : Date.now();
      sessions.push({ 
        sessionId: doc.id, 
        title: data.title, 
        messages: data.messages, 
        updatedAt: ms 
      });
    });
    return sessions;
  } catch (error) {
    console.error("Error fetching chat sessions from Firestore:", error);
    return [];
  }
};

// Delete a chat session
export const deleteChatSession = async (uid, sessionId) => {
  if (!uid || !sessionId) return;
  try {
    const sessionRef = doc(db, "users", uid, "sessions", sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error("Error deleting chat session from Firestore:", error);
  }
};

// Create a new public shared chat under /shared_chats/{chatId}
export const createSharedChat = async (uid, title, messages) => {
  if (!uid || !messages || messages.length === 0) return null;
  try {
    const sharedChatsRef = collection(db, "shared_chats");
    const newSharedDoc = doc(sharedChatsRef); // Automatically generates unique random ID
    const chatId = newSharedDoc.id;
    await setDoc(newSharedDoc, {
      title: title || "Shared Conversation",
      messages: messages,
      createdAt: serverTimestamp(),
      ownerUid: uid
    });
    return chatId;
  } catch (error) {
    console.error("Error creating public shared chat in Firestore:", error);
    return null;
  }
};

// Retrieve a public shared chat
export const getSharedChat = async (chatId) => {
  if (!chatId) return null;
  try {
    const docRef = doc(db, "shared_chats", chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching shared chat:", error);
    return null;
  }
};

// Delete a public shared chat
export const deleteSharedChat = async (chatId) => {
  if (!chatId) return;
  try {
    const docRef = doc(db, "shared_chats", chatId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting shared chat:", error);
  }
};
