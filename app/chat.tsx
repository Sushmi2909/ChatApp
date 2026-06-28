import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../components/Avatar';
import { auth, db } from '../firebase';

export default function ChatScreen() {
    const router = useRouter()
    const [chats, setChats] = useState([])
    const [showMenu, setShowMenu] = useState(false)
    const [contacts, setContacts] = useState<any>({})

    function getChatName(item: any) {
        if (item.isGroup) return item.groupName
        if (!item.users || !auth.currentUser) return 'Unknown'
        const otherUid = Object.keys(item.users).find(uid => uid !== auth.currentUser?.uid)
        if (!otherUid) return 'Unknown'
        
        // check for custom nickname
        const nickname = contacts?.[otherUid]?.customName
        if (nickname) return nickname
        
        return item.users[otherUid].name
    }

    function getChatRoute(item: any) {
    const chatName = getChatName(item)
    if (item.isGroup) {
        return `/message?chatId=${item.id}&name=${chatName}&isGroup=true`
    }
    return `/message?chatId=${item.id}&name=${chatName}`
}

    useEffect(() => {
        const currentUser = auth.currentUser
        if (!currentUser) return

        onSnapshot(doc(db, 'users', currentUser.uid), (snap:any) => {
        const data = snap.data()
        setContacts(data?.contacts || {})
        })

        const q = query(
            collection(db, 'chats'),
            where('members', 'array-contains', currentUser.uid)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setChats(chatList as any)
        })

        return unsubscribe
    }, [])

    function handleLogout() {
        auth.signOut()
        router.push('/' as any)
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000000f5' }}>

            {/* Header */}
            <View style={{ padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image
                        source={require('../assets/images/comment-dots.png')}
                        style={{ width: 28, height: 28, tintColor: '#ffffff' }}
                    />
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>CHATS</Text>
                </View>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                    <Text style={{ fontSize: 24, color: '#ffffff' }}>⋮</Text>
                </TouchableOpacity>
            </View>

            {/* Dropdown menu */}
            {showMenu && (
                <View style={{ position: 'absolute', top: 100, right: 15, backgroundColor: '#ffffff', borderRadius: 12, elevation: 5, zIndex: 999, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, minWidth: 170 }}>
                    <TouchableOpacity
                        onPress={() => { router.push('/profile' as any); setShowMenu(false) }}
                        style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eeeeee' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Image source={require('../assets/images/user.png')} style={{ width: 20, height: 20, tintColor: '#000000' }} />
                            <Text style={{ fontSize: 16, color: '#000000' }}>Profile</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => { handleLogout(); setShowMenu(false) }}
                        style={{ padding: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Image source={require('../assets/images/exit.png')} style={{ width: 20, height: 20, tintColor: '#ff4444' }} />
                            <Text style={{ fontSize: 16, color: '#ff4444' }}>Logout</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Chat list */}
            <FlatList
                data={chats}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }: any) => {
                    const unreadCount = item[`unread_${auth.currentUser?.uid}`] || 0
                    return (
                        <TouchableOpacity
                            onPress={() => router.push(getChatRoute(item) as any)}
                            style={{ paddingHorizontal: 15, paddingVertical: 12, borderColor: '#707070', borderRadius: 50, borderWidth: 0.5, flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 12 }}>

                            {/* Avatar */}
                            {item.isGroup ? (
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#ffffff', fontSize: 18 }}>👥</Text>
                                </View>
                            ) : (
                                <Avatar
                                    uid={Object.keys(item.users || {}).find((uid: string) => uid !== auth.currentUser?.uid) || ''}
                                    name={getChatName(item)}
                                    size={40}
                                />
                            )}

                            {/* Chat info */}
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {item.isGroup && (
                                        <View style={{ backgroundColor: '#333333', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                                            <Text style={{ color: '#888888', fontSize: 10 }}>GROUP</Text>
                                        </View>
                                    )}
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>{getChatName(item)}</Text>
                                </View>
                                <Text style={{ color: '#a2a2a2', marginTop: 4 }}>{item.lastMessage || 'No messages yet'}</Text>
                            </View>

                            {/* Unread badge */}
                            {unreadCount > 0 && (
                                <View style={{ backgroundColor: '#b287b1fd', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }}>
                                    <Text style={{ color: '#fffafa', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                }}
            />

            {/* Floating + button */}
            <TouchableOpacity
                onPress={() => router.push('/search' as any)}
                style={{
                    position: 'absolute',
                    bottom: 50,
                    right: 25,
                    backgroundColor: '#ffffff',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowRadius: 5
                }}>
                <Text style={{ color: '#000000', fontSize: 40, lineHeight: 40 }}>+</Text>
            </TouchableOpacity>
        </View>
    )
}