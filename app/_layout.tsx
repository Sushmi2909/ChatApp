import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { auth, db } from '../firebase';
import { registerForPushNotifications } from '../notifications';

export default function Layout() {
    const router = useRouter()

    useEffect(() => {
       const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {

                router.replace('/chat' as any)
                // register for push notifications
                registerForPushNotifications()

                // set online when logged in
                updateDoc(doc(db, 'users', user.uid), {
                    online: true,
                    lastSeen: serverTimestamp()
                })

                // track app state changes
                const subscription = AppState.addEventListener('change', (state) => {
                    if (state === 'active') {
                        updateDoc(doc(db, 'users', user.uid), {
                            online: true,
                            lastSeen: serverTimestamp()
                        })
                    } else {
                        updateDoc(doc(db, 'users', user.uid), {
                            online: false,
                            lastSeen: serverTimestamp()
                        })
                    }
                })

                return () => subscription.remove()
            } else {
                router.replace('/' as any)
            }
        })

        return unsubscribeAuth
    }, [])

    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}