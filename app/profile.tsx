import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uploadToCloudinary } from '../cloudinary';
import { auth, db } from '../firebase';

export default function ProfileScreen() {
    const router = useRouter()
    const [userData, setUserData] = useState({ name: '', email: '', photoURL: '' })
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState('')
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    useEffect(() => {
        async function fetchUser() {
            const user = auth.currentUser
            if (!user) return
            const docRef = doc(db, 'users', user.uid)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data()
                setUserData({ name: data.name, email: data.email, photoURL: data.photoURL || '' })
                setNewName(data.name)
            }
        }
        fetchUser()
    }, [])

    async function handlePickPhoto() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7
            })

            if (result.canceled) return

            setUploadingPhoto(true)
            const uri = result.assets[0].uri
            const url = await uploadToCloudinary(uri, 'image')

            if (!url) {
                Alert.alert('Error', 'Failed to upload photo')
                setUploadingPhoto(false)
                return
            }

            const user = auth.currentUser
            if (!user) return

            await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
            setUserData({ ...userData, photoURL: url })
            setUploadingPhoto(false)
            Alert.alert('Success', 'Profile photo updated!')
        } catch (error) {
            console.log('Photo error:', error)
            setUploadingPhoto(false)
        }
    }

    async function handleSaveName() {
        if (!newName.trim()) {
            Alert.alert('Error', 'Name cannot be empty')
            return
        }
        try {
            const user = auth.currentUser
            if (!user) return
            await updateDoc(doc(db, 'users', user.uid), { name: newName })
            setUserData({ ...userData, name: newName })
            setIsEditing(false)
            Alert.alert('Success', 'Name updated!')
        } catch (error) {
            Alert.alert('Error', 'Failed to update name')
        }
    }

    function handleLogout() {
        auth.signOut()
        router.replace('/' as any)
    }

    return (
        <View style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 60, padding: 20, backgroundColor: '#000000' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', alignSelf: 'center', marginBottom: 30, color: '#ffffff' }}>Profile</Text>

            {/* Profile Picture */}
            <TouchableOpacity onPress={handlePickPhoto} style={{ alignSelf: 'center', marginBottom: 30 }}>
                {uploadingPhoto ? (
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color="#ffffff" />
                    </View>
                ) : userData.photoURL ? (
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
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4a90e2', borderRadius: 12, padding: 4 }}>
                    <Text style={{ color: '#ffffff', fontSize: 12 }}>✏️</Text>
                </View>
            </TouchableOpacity>

            {/* Name section */}
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 5 }}>Name</Text>
            {isEditing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        style={{ flex: 1, borderWidth: 1, borderColor: '#cccccc', padding: 10, borderRadius: 8, fontSize: 18, color: '#ffffff', marginRight: 10 }}
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveName} style={{ backgroundColor: '#4a90e2', padding: 10, borderRadius: 8 }}>
                        <Text style={{ color: '#ffffff' }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={{ padding: 10, marginLeft: 5 }}>
                        <Text style={{ color: '#888888' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, color: '#ffffff', flex: 1 }}>{userData.name}</Text>
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={{ color: '#4a90e2' }}>Edit</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Email section */}
            <Text style={{ fontSize: 14, color: '#888888', marginBottom: 5 }}>Email</Text>
            <Text style={{ fontSize: 18, color: '#ffffff', marginBottom: 30 }}>{userData.email}</Text>

            <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#000000', borderRadius: 8 }}>
                <Text style={{ color: '#ca0000', fontSize: 16 }}>Logout</Text>
            </TouchableOpacity>
        </View>
    )
}