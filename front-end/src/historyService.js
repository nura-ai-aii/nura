// src/historyService.js
// Firebase Firestore helper services for managing user chat history (ChatGPT-style)
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
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
