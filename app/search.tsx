import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

export default function SearchScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [results, setResults] = useState([])

    async function startChat(otherUser: any) {
        try {
            const currentUser = auth.currentUser
            if (!currentUser) return

            const chatId = [currentUser.uid, otherUser.uid].sort().join('_')
            const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid))
            const currentUserData = currentUserDoc.data()

            await setDoc(doc(db, 'chats', chatId), {
                members: [currentUser.uid, otherUser.uid],
                users: {
                    [currentUser.uid]: { name: currentUserData?.name, email: currentUser.email },
                    [otherUser.uid]: { name: otherUser.name, email: otherUser.email }
                },
                lastMessage: '',
                lastMessageTime: new Date()
            })

            router.push(`/message?chatId=${chatId}&name=${otherUser.name}` as any)
        } catch (error) {
            Alert.alert("Error", (error as any).message)
        }
    }

    async function handleSearch() {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email))
            const snapshot = await getDocs(q)
            if (snapshot.empty) {
                Alert.alert("Not found", "No user with that email")
                return
            }
            const users = snapshot.docs.map(doc => doc.data())
            setResults(users as any)
        } catch (error) {
            Alert.alert("Error", (error as any).message)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#131313', padding: 20, paddingTop: 60 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#faf5f5' }}>Find User</Text>

            <TextInput
                placeholder="Enter email"
                placeholderTextColor={'#888888'}
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, color: '#ffffff', borderColor: '#cccccc84', padding: 12, borderRadius: 50, marginBottom: 15 }}
            />

            <TouchableOpacity
                onPress={handleSearch}
                style={{ backgroundColor: '#727272', padding: 15, borderRadius: 50, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>Search</Text>
            </TouchableOpacity>

            <FlatList
                data={results}
                keyExtractor={(item: any) => item.uid}
                renderItem={({ item }: any) => (
                    <TouchableOpacity
                        onPress={() => startChat(item)}
                        style={{ padding: 15, borderBottomWidth: 0.5 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#b8b8b8' }}>{item.name}</Text>
                        <Text style={{ color: '#888888' }}>{item.email}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Create Group button */}
            <TouchableOpacity
                onPress={() => router.push('/creategroup' as any)}
                style={{ backgroundColor: '#333333', padding: 15, borderRadius: 50, alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>+ Create Group</Text>
            </TouchableOpacity>
        </View>
    )
}