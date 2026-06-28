import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function registerForPushNotifications() {
    try {
        if (!Device.isDevice) {
            console.log('Must use physical device')
            return
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        if (finalStatus !== 'granted') {
            console.log('Permission not granted')
            return
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'c0adbd1f-d7c7-4ce7-beea-94ce7c58403d'
        })

        const user = auth.currentUser
        if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
                pushToken: tokenData.data
            })
        }

        return tokenData.data
    } catch (error: any) {
        console.log('Push notification error:', error.message)
    }
}