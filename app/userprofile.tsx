import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

export default function UserProfileScreen() {
    const { uid, name: paramName } = useLocalSearchParams()
    const router = useRouter()
    const [userData, setUserData] = useState({ name: '', email: '', photoURL: '' })
    const [customName, setCustomName] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        async function fetchUser() {
            if (!uid) return
            const docSnap = await getDoc(doc(db, 'users', String(uid)))
            if (docSnap.exists()) {
                const data = docSnap.data()
                setUserData({ name: data.name, email: data.email, photoURL: data.photoURL || '' })
            }

            // check if current user has saved a custom name for this contact
            const currentUser = auth.currentUser
            if (!currentUser) return
            const myDoc = await getDoc(doc(db, 'users', currentUser.uid))
            const myData = myDoc.data()
            const savedName = myData?.contacts?.[String(uid)]?.customName
            setCustomName(savedName || '')
        }
        fetchUser()
    }, [])

    async function saveCustomName() {
        if (!customName.trim()) {
            Alert.alert('Error', 'Name cannot be empty')
            return
        }
        try {
            const currentUser = auth.currentUser
            if (!currentUser) return
            await updateDoc(doc(db, 'users', currentUser.uid), {
                [`contacts.${uid}.customName`]: customName
            })
            Alert.alert('Success', 'Contact name saved!')
            setIsEditing(false)
        } catch (error) {
            Alert.alert('Error', 'Failed to save name')
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000000', paddingTop: 60, padding: 20 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
                <Text style={{ color: '#4a90e2', fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>

            {/* Profile picture */}
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                {userData.photoURL ? (
                    <Image
                        source={{ uri: userData.photoURL }}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                    />
                ) : (
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#4a90e2', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 40, color: '#ffffff', fontWeight: 'bold' }}>
                            {userData.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Real name */}
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 5 }}>Name</Text>
            <Text style={{ fontSize: 18, color: '#ffffff', marginBottom: 20 }}>{userData.name}</Text>

            {/* Email */}
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 5 }}>Email</Text>
            <Text style={{ fontSize: 18, color: '#ffffff', marginBottom: 30 }}>{userData.email}</Text>

            {/* Custom name */}
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 5 }}>Your nickname for this contact</Text>
            {isEditing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TextInput
                        value={customName}
                        onChangeText={setCustomName}
                        placeholder="Enter nickname"
                        placeholderTextColor="#888888"
                        style={{ flex: 1, borderWidth: 1, borderColor: '#cccccc', padding: 10, borderRadius: 8, fontSize: 16, color: '#ffffff' }}
                        autoFocus
                    />
                    <TouchableOpacity onPress={saveCustomName} style={{ backgroundColor: '#4a90e2', padding: 10, borderRadius: 8 }}>
                        <Text style={{ color: '#ffffff' }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditing(false)}>
                        <Text style={{ color: '#888888' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, color: '#ffffff', flex: 1 }}>
                        {customName || 'No nickname set'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={{ color: '#4a90e2' }}>Edit</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}