import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { db } from '../firebase';

export default function Avatar({ uid, name, size = 40 }: { uid: string, name: string, size?: number }) {
    const [photoURL, setPhotoURL] = useState('')

    useEffect(() => {
        if (!uid) return
        const unsubscribe = onSnapshot(doc(db, 'users', uid), (snap) => {
            const data = snap.data()
            setPhotoURL(data?.photoURL || '')
        })
        return unsubscribe
    }, [uid])

    if (photoURL) {
        return (
            <Image
                source={{ uri: photoURL }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
        )
    }

    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#4a90e2', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: size * 0.4 }}>
                {name?.charAt(0).toUpperCase()}
            </Text>
        </View>
    )
}