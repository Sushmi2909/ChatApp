import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

export default function CreateGroupScreen() {
    const router = useRouter()
    const [groupName, setGroupName] = useState('')
    const [email, setEmail] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedMembers, setSelectedMembers] = useState<any[]>([])

    async function handleSearch() {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email))
            const snapshot = await getDocs(q)
            if (snapshot.empty) {
                Alert.alert("Not found", "No user with that email")
                return
            }
            const users = snapshot.docs.map(doc => doc.data())
            setSearchResults(users as any)
        } catch (error) {
            Alert.alert("Error", (error as any).message)
        }
    }

    function toggleMember(user: any) {
        const exists = selectedMembers.find(m => m.uid === user.uid)
        if (exists) {
            setSelectedMembers(selectedMembers.filter(m => m.uid !== user.uid))
        } else {
            setSelectedMembers([...selectedMembers, user])
        }
    }

    async function createGroup() {
        if (!groupName.trim()) {
            Alert.alert("Error", "Please enter a group name")
            return
        }
        if (selectedMembers.length < 1) {
            Alert.alert("Error", "Please add at least one member")
            return
        }

        try {
            const currentUser = auth.currentUser
            if (!currentUser) return

            const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid))
            const currentUserData = currentUserDoc.data()

            const groupId = `group_${Date.now()}`
            const allMembers = [currentUser.uid, ...selectedMembers.map(m => m.uid)]

            const users: any = {
                [currentUser.uid]: { name: currentUserData?.name, email: currentUser.email }
            }
            selectedMembers.forEach(m => {
                users[m.uid] = { name: m.name, email: m.email }
            })

            await setDoc(doc(db, 'chats', groupId), {
                isGroup: true,
                groupName: groupName,
                members: allMembers,
                createdBy: currentUser.uid,
                users: users,
                lastMessage: '',
                lastMessageTime: new Date()
            })

            router.push(`/message?chatId=${groupId}&name=${groupName}&isGroup=true` as any)
        } catch (error) {
            Alert.alert("Error", (error as any).message)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#131313', padding: 20, paddingTop: 60 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#ffffff' }}>Create Group</Text>

            <TextInput
                placeholder="Group name"
                placeholderTextColor={'#888888'}
                value={groupName}
                onChangeText={setGroupName}
                style={{ borderWidth: 1, color: '#ffffff', borderColor: '#cccccc84', padding: 12, borderRadius: 50, marginBottom: 15 }}
            />

            {/* Selected members */}
            {selectedMembers.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 8 }}>
                    {selectedMembers.map(m => (
                        <TouchableOpacity
                            key={m.uid}
                            onPress={() => toggleMember(m)}
                            style={{ backgroundColor: '#333333', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={{ color: '#ffffff', fontSize: 14 }}>{m.name}</Text>
                            <Text style={{ color: '#888888', fontSize: 12 }}>✕</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <TextInput
                placeholder="Search member by email"
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
                data={searchResults}
                keyExtractor={(item: any) => item.uid}
                renderItem={({ item }: any) => {
                    const isSelected = selectedMembers.find(m => m.uid === item.uid)
                    return (
                        <TouchableOpacity
                            onPress={() => toggleMember(item)}
                            style={{ padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#333333', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#b8b8b8' }}>{item.name}</Text>
                                <Text style={{ color: '#888888' }}>{item.email}</Text>
                            </View>
                            {isSelected && <Text style={{ color: '#4a90e2', fontSize: 20 }}>✓</Text>}
                        </TouchableOpacity>
                    )
                }}
            />

            {selectedMembers.length > 0 && (
                <TouchableOpacity
                    onPress={createGroup}
                    style={{ backgroundColor: '#4a90e2', padding: 15, borderRadius: 50, alignItems: 'center', marginTop: 15 }}>
                    <Text style={{ color: '#ffffff', fontSize: 16 }}>Create Group ({selectedMembers.length + 1} members)</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}