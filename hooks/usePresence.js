import { useEffect } from 'react';
import { dbRealtime } from '../firebase';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

export default function usePresence() {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const userStatusDatabaseRef = ref(dbRealtime, '/status/' + currentUser.uid);
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };
        const isOnlineForDatabase = {
            state: 'online',
            last_changed: serverTimestamp(),
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || null
        };

        const connectedRef = ref(dbRealtime, '.info/connected');
        const unsubscribe = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === false) {
                return;
            }

            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);
            });
        });

        return () => unsubscribe();
    }, [currentUser]);
}
