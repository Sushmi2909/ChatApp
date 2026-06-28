import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uploadToCloudinary } from '../cloudinary';
import Avatar from '../components/Avatar';
import { auth, db } from '../firebase';

export default function MessageScreen() {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [isOnline, setIsOnline] = useState(false)
    const [lastSeen, setLastSeen] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [otherUid, setOtherUid] = useState('')
    const flatListRef = useRef<FlatList>(null)
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [selectedMessageId, setSelectedMessageId] = useState('')
    const [reactionModal, setReactionModal] = useState(false)
    const [selectedReactionMessageId, setSelectedReactionMessageId] = useState('')
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const typingTimeoutRef = useRef<any>(null)
    const { chatId, name, isGroup } = useLocalSearchParams()
    const router = useRouter()
    const [recording, setRecording] = useState<Audio.Recording | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
    const soundRef = useRef<Audio.Sound | null>(null)
    const dot1 = useRef(new Animated.Value(0)).current
    const dot2 = useRef(new Animated.Value(0)).current
    const dot3 = useRef(new Animated.Value(0)).current
    const [reactionPosition, setReactionPosition] = useState({ y: 0 })
    const [nickname, setNickname] = useState('')

    useEffect(() => {
        if (isTyping) {
            const animateDot = (dot: Animated.Value, delay: number) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
                        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ])
                ).start()
            }
            animateDot(dot1, 0)
            animateDot(dot2, 150)
            animateDot(dot3, 300)
        } else {
            dot1.stopAnimation()
            dot2.stopAnimation()
            dot3.stopAnimation()
            dot1.setValue(0)
            dot2.setValue(0)
            dot3.setValue(0)
        }
    }, [isTyping])

    async function sendPushNotification(receiverUid: string, messageText: string) {
        try {
            const receiverDoc = await getDoc(doc(db, 'users', receiverUid))
            const receiverData = receiverDoc.data()
            const pushToken = receiverData?.pushToken
            if (!pushToken) return

            const senderDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid as string))
            const senderData = senderDoc.data()
            const senderName = senderData?.name

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: pushToken, title: senderName, body: messageText, sound: 'default' })
            })
            const result = await response.json()
            console.log('Notification result:', JSON.stringify(result))
        } catch (error) {
            console.log('Notification error:', error)
        }
    }

    useEffect(() => {
        const q = query(
            collection(db, 'chats', String(chatId), 'messages'),
            orderBy('createdAt', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setMessages(msgs as any)
        })

        markMessagesAsSeen()

        async function fetchOtherUserStatus() {
            const otherUserQuery = query(collection(db, 'users'), where('name', '==', name))
            const otherUserSnap = await getDocs(otherUserQuery)
            if (!otherUserSnap.empty) {
                const otherUserData = otherUserSnap.docs[0].data()
                const uid = otherUserData.uid
                setOtherUid(uid)
                // fetch nickname
            const currentUser = auth.currentUser
            if (currentUser) {
                onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
                    const data = snap.data()
                    const savedName = data?.contacts?.[uid]?.customName
                    setNickname(savedName || '')
                })
            }

                onSnapshot(doc(db, 'users', uid), (snap) => {
                    const data = snap.data()
                    setIsOnline(data?.online || false)
                    if (data?.lastSeen) {
                        const time = data.lastSeen.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        setLastSeen(time)
                    }
                })

                onSnapshot(doc(db, 'chats', String(chatId)), (snap) => {
                    const data = snap.data()
                    setIsTyping(data?.[`typing_${uid}`] || false)
                })
            }
        }
        fetchOtherUserStatus()
        return unsubscribe
    }, [])

    async function sendMessage() {
        if (!message.trim()) return
        try {
            const chatDoc = await getDoc(doc(db, 'chats', String(chatId)))
            const chatData = chatDoc.data()
            const receiverUid = chatData?.members.find((uid: string) => uid !== auth.currentUser?.uid)

            await addDoc(collection(db, 'chats', String(chatId), 'messages'), {
                text: message,
                sender: auth.currentUser?.uid,
                createdAt: new Date(),
                senderName: (await getDoc(doc(db, 'users', auth.currentUser?.uid as string))).data()?.name,
                seen: false,
                replyTo: replyingTo ? {
                    text: replyingTo.text,
                    sender: replyingTo.sender
                } : null
            })

            await updateDoc(doc(db, 'chats', String(chatId)), {
                lastMessage: message,
                lastMessageTime: new Date(),
                [`typing_${auth.currentUser?.uid}`]: false,
                [`unread_${receiverUid}`]: (chatData?.[`unread_${receiverUid}`] || 0) + 1
            })

            if (receiverUid) sendPushNotification(receiverUid, message)
            setMessage('')
            setReplyingTo(null)
        } catch (error) {
            console.log(error)
        }
    }

    async function markMessagesAsSeen() {
        const currentUser = auth.currentUser
        if (!currentUser) return

        const q = query(
            collection(db, 'chats', String(chatId), 'messages'),
            where('seen', '==', false),
            where('sender', '!=', currentUser.uid)
        )

        const snapshot = await getDocs(q)
        const batch = writeBatch(db)
        snapshot.docs.forEach(doc => { batch.update(doc.ref, { seen: true }) })
        await batch.commit()

        await updateDoc(doc(db, 'chats', String(chatId)), {
            [`unread_${currentUser.uid}`]: 0
        })
    }
    async function pickAndSendImage() {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7
        })

        if (result.canceled) return

        const uri = result.assets[0].uri
        const url = await uploadToCloudinary(uri, 'image')

        if (!url) {
            console.log('Upload failed')
            return
        }

        const chatDoc = await getDoc(doc(db, 'chats', String(chatId)))
        const chatData = chatDoc.data()
        const receiverUid = chatData?.members.find((uid: string) => uid !== auth.currentUser?.uid)

        await addDoc(collection(db, 'chats', String(chatId), 'messages'), {
            imageUrl: url,
            text: '',
            sender: auth.currentUser?.uid,
            senderName: (await getDoc(doc(db, 'users', auth.currentUser?.uid as string))).data()?.name,
            createdAt: new Date(),
            seen: false,
            replyTo: null
        })

        await updateDoc(doc(db, 'chats', String(chatId)), {
            lastMessage: '📷 Image',
            lastMessageTime: new Date(),
            [`unread_${receiverUid}`]: (chatData?.[`unread_${receiverUid}`] || 0) + 1
        })

        if (receiverUid) sendPushNotification(receiverUid, '📷 Image')

    } catch (error) {
        console.log('Image pick error:', error)
    }
}
    function deleteMessage(messageId: string) {
        setSelectedMessageId(messageId)
        setDeleteModalVisible(true)
    }

    async function confirmDelete() {
        await deleteDoc(doc(db, 'chats', String(chatId), 'messages', selectedMessageId))
        setDeleteModalVisible(false)
    }

    async function addReaction(emoji: string) {
        const currentUser = auth.currentUser
        if (!currentUser) return

        const msgRef = doc(db, 'chats', String(chatId), 'messages', selectedReactionMessageId)
        const msgSnap = await getDoc(msgRef)
        const msgData = msgSnap.data()

        const reactions = msgData?.reactions || {}
        const usersWhoReacted = reactions[emoji] || []

        if (usersWhoReacted.includes(currentUser.uid)) {
            reactions[emoji] = usersWhoReacted.filter((uid: string) => uid !== currentUser.uid)
            if (reactions[emoji].length === 0) delete reactions[emoji]
        } else {
            reactions[emoji] = [...usersWhoReacted, currentUser.uid]
        }

        await updateDoc(msgRef, { reactions })
        setReactionModal(false)
    }
    async function startRecording() {
    try {
        await Audio.requestPermissionsAsync()
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true
        })

        const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        )
        setRecording(recording)
        setIsRecording(true)
    } catch (error) {
        console.log('Recording error:', error)
    }
}

async function stopRecordingAndSend() {
    try {
        if (!recording) return
        setIsRecording(false)
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()
        setRecording(null)

        if (!uri) return

        const url = await uploadToCloudinary(uri, 'audio')
        if (!url) return

        const chatDoc = await getDoc(doc(db, 'chats', String(chatId)))
        const chatData = chatDoc.data()
        const receiverUid = chatData?.members.find((uid: string) => uid !== auth.currentUser?.uid)

        await addDoc(collection(db, 'chats', String(chatId), 'messages'), {
            audioUrl: url,
            text: '',
            sender: auth.currentUser?.uid,
            senderName: (await getDoc(doc(db, 'users', auth.currentUser?.uid as string))).data()?.name,
            createdAt: new Date(),
            seen: false,
            replyTo: null
        })

        await updateDoc(doc(db, 'chats', String(chatId)), {
            lastMessage: '🎤 Voice message',
            lastMessageTime: new Date(),
            [`unread_${receiverUid}`]: (chatData?.[`unread_${receiverUid}`] || 0) + 1
        })

        if (receiverUid) sendPushNotification(receiverUid, '🎤 Voice message')

    } catch (error) {
        console.log('Stop recording error:', error)
    }
}

async function playAudio(audioUrl: string, messageId: string) {
    try {
        if (soundRef.current) {
            await soundRef.current.unloadAsync()
            soundRef.current = null
        }

        if (playingAudioId === messageId) {
            setPlayingAudioId(null)
            return
        }

        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl })
        soundRef.current = sound
        setPlayingAudioId(messageId)

        await sound.playAsync()

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                setPlayingAudioId(null)
            }
        })
    } catch (error) {
        console.log('Play audio error:', error)
    }
}

    function SwipeableMessage({ item }: any) {
        const translateX = useRef(new Animated.Value(0)).current

        const panResponder = PanResponder.create({
        
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx > 0 && gestureState.dx < 80) {
                    translateX.setValue(gestureState.dx)
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 50) {
                    setReplyingTo(item)
                }
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true
                }).start()
            }
            
        })

        return (
            <Animated.View
                {...panResponder.panHandlers}
                style={{ transform: [{ translateX }] }}>
                <TouchableOpacity
                    onLongPress={(e) => {
                    setSelectedReactionMessageId(item.id)
                    setReactionPosition({ y: e.nativeEvent.pageY })
                    setReactionModal(true)
                    }}
                    style={{
                        alignSelf: item.sender === auth.currentUser?.uid ? 'flex-end' : 'flex-start',
                        backgroundColor: item.sender === auth.currentUser?.uid ? '#000000' : '#2b2b2b',
                        padding: 11,
                        paddingBlockEnd: 13,
                        alignItems: 'flex-start',
                        borderRadius: 25,
                        borderColor: '#94949444',
                        borderWidth: 1,
                        marginBottom: 10,
                        maxWidth: '70%'
                    }}>

                    {/* Reply preview inside bubble */}
                    {item.replyTo && (
                        <View style={{ backgroundColor: '#333333', borderRadius: 10, padding: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#4a90e2', width: '100%' }}>
                            <Text style={{ color: '#4a90e2', fontSize: 11, marginBottom: 2 }}>
                                {item.replyTo.sender === auth.currentUser?.uid ? 'You' : String(name)}
                            </Text>
                            <Text style={{ color: '#aaaaaa', fontSize: 12 }} numberOfLines={1}>
                                {item.replyTo.text}
                            </Text>
                        </View>
                    )}
                    {/* Show sender name in group */}
            {isGroup && item.sender !== auth.currentUser?.uid && (
                <Text style={{ color: '#4a90e2', fontSize: 11, marginBottom: 3 }}>
                    {item.senderName || 'Unknown'}
                </Text>
            )}

                                {item.audioUrl ? (
            <TouchableOpacity
                onPress={() => playAudio(item.audioUrl, item.id)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 5
                }}
>
    <Image
        source={
            playingAudioId === item.id
                ? require('../assets/images/pause.png')
                : require('../assets/images/play.png')
        }
        style={{ width: (playingAudioId === item.id)? 18.5:24, height: (playingAudioId === item.id)? 18.5:24 , tintColor:'#a9a9a9' }}
        resizeMode="contain"
    />

    <View
        style={{
            width: 100,
            height: 3,
            backgroundColor: '#555555',
            borderRadius: 2
        }}
    >
        <View
            style={{
                width: playingAudioId === item.id ? '60%' : '0%',
                height: 3,
                backgroundColor: '#4a90e2',
                borderRadius: 2
            }}
        />
    </View>

    <Image
        source={require('../assets/images/radio.png')}
        style={{ width: 16, height: 16, tintColor:'#a9a9a9' }}
        resizeMode="contain"
    />
            </TouchableOpacity>
            ) : item.imageUrl ? (
                <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 200, height: 200, borderRadius: 15 }}
                    resizeMode="cover"
                />
            ) : (
                <Text style={{ color: item.sender === auth.currentUser?.uid ? '#fffbfb' : '#f7f7f7' }}>
                    {item.text}
                </Text>
            )}

                    <View style={{ flexDirection: 'row', alignSelf: 'flex-end', justifyContent: 'center', alignItems: 'flex-end', marginTop: 4, gap: 3 }}>
                        <Text style={{ color: item.sender === auth.currentUser?.uid ? '#6f6f6f' : '#888888', fontSize: 10, alignSelf: 'flex-end' }}>
                            {item.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {item.sender === auth.currentUser?.uid && (
    item.seen ? (
        <View style={{ flexDirection: 'row' }}>
            <Text style={{ color: '#86b7ff', fontSize: 10 }}>✓</Text>
            <Text style={{ color: '#86b7ff', fontSize: 10, marginLeft: -2 }}>✓</Text>
        </View>
    ) : (
        <Text style={{ color: '#6f6f6f', fontSize: 10 }}>✓</Text>
    )
)}
                    </View>

                    {/* Reactions */}
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
                            {Object.entries(item.reactions).map(([emoji, users]: any) => (
                                users.length > 0 && (
                                    <TouchableOpacity
                                        key={emoji}
                                        onPress={() => {
                                            setSelectedReactionMessageId(item.id)
                                            addReaction(emoji)
                                        }}
                                        style={{ backgroundColor: '#333333', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                        <Text style={{ fontSize: 12 }}>{emoji}</Text>
                                        <Text style={{ fontSize: 10, color: '#ffffff' }}>{users.length}</Text>
                                    </TouchableOpacity>
                                )
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#000000' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}>

            {/* Header */}
            <View style={{ padding: 20, paddingTop: 55, borderBottomWidth: 0.2, borderBottomColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity onPress={() => router.push(`/userprofile?uid=${otherUid}&name=${nickname || name}` as any)}>
    <Avatar
        uid={otherUid}
        name={String(name)}
        size={40}
    />
</TouchableOpacity>
        <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fffefe' }}>{nickname || name}</Text>
            {isTyping ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={{ fontSize: 12, color: '#4CAF50' }}>typing </Text>
                    <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CAF50', transform: [{ translateY: dot1 }] }} />
                    <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CAF50', transform: [{ translateY: dot2 }] }} />
                    <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#4CAF50', transform: [{ translateY: dot3 }] }} />
                </View>
            ) : (
                <Text style={{ fontSize: 12, color: isOnline ? '#4CAF50' : '#ffffff' }}>
                    {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
                </Text>
            )}
        </View>
    </View>
    <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
        <Text style={{ fontSize: 24, color: '#fdfdfd' }}>⋮</Text>
    </TouchableOpacity>
</View>

            {/* Dropdown menu */}
            {showMenu && (
                <View style={{ position: 'absolute', top: 110, right: 15, backgroundColor: '#ffffff', borderRadius: 8, elevation: 5, zIndex: 999, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 }}>
                    <TouchableOpacity
                        onPress={() => { setShowSearch(true); setShowMenu(false) }}
                        style={{ padding: 15 }}>
                        <Text style={{ fontSize: 16, color: '#000000' }}>Search</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Search bar */}
            {showSearch && (
                <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eeeeee', alignItems: 'center' }}>
                    <TextInput
                        placeholder="Search messages..."
                        placeholderTextColor={'#7b7b7b'}
                        value={searchText}
                        onChangeText={setSearchText}
                        style={{ flex: 1, borderWidth: 1, borderColor: '#cccccc', padding: 8, borderRadius: 20, marginRight: 10 }}
                        autoFocus
                    />
                    <TouchableOpacity onPress={() => { setShowSearch(false); setSearchText('') }}>
                        <Text style={{ color: '#ffffff' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                data={messages.filter((msg: any) =>
                    msg.text?.toLowerCase().includes(searchText.toLowerCase())
                )}
                keyExtractor={(item: any) => item.id}
                style={{ flex: 1, padding: 15, marginBottom: 5 }}
                renderItem={({ item }: any) => <SwipeableMessage item={item} />}
            />

            {/* Reply preview above input */}
            {replyingTo && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 10, borderTopWidth: 0.5, borderTopColor: '#333333' }}>
                    <View style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: '#4a90e2', paddingLeft: 8 }}>
                        <Text style={{ color: '#4a90e2', fontSize: 12 }}>
                            {replyingTo.sender === auth.currentUser?.uid ? 'You' : String(name)}
                        </Text>
                        <Text style={{ color: '#aaaaaa', fontSize: 12 }} numberOfLines={1}>
                            {replyingTo.text}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 5 }}>
                        <Text style={{ color: '#ffffff', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}
              

            {/* Input bar */}
            <View style={{ flexDirection: 'row', paddingBottom: 20, borderTopColor: '#eeeeee' }}>
                
                <TouchableOpacity
                    onPress={pickAndSendImage}
                    style={{ padding: 10, justifyContent: 'center' }}>
                    <Image
                        source={require('../assets/images/camera.png')}
                        style={{ width: 24, height: 24 , tintColor:'#ffffff'}}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
    
                <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor={'#929292'}
                    value={message}
                    onChangeText={(text) => {
                        setMessage(text)
                        updateDoc(doc(db, 'chats', String(chatId)), {
                            [`typing_${auth.currentUser?.uid}`]: true
                        })
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => {
                            updateDoc(doc(db, 'chats', String(chatId)), {
                                [`typing_${auth.currentUser?.uid}`]: false
                            })
                        }, 2000)
                    }}
                    style={{ flex: 1, color: '#ffffff', borderWidth: 1, borderColor: '#c1bfbf6b', padding: 10, borderRadius: 20, marginRight: 10 }}
                />
                <TouchableOpacity
                    onPressIn={startRecording}
                    onPressOut={stopRecordingAndSend}
                    style={{ padding: 10, justifyContent: 'center' }}>
                    <Image
                        source={
                            isRecording
                                ? require('../assets/images/record-button.png')
                                : require('../assets/images/radio.png')
                        }
                        style={{ width: 24, height: 24, tintColor: !isRecording ? '#fafafa' : undefined }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={sendMessage}
                    style={{ backgroundColor: '#a8a8a8', marginRight: 5, padding: 10, borderRadius: 20, justifyContent: 'center' }}>
                    <Text style={{ color: '#ffffff' }}>Send</Text>
                </TouchableOpacity>
            </View>

            {/* Reaction Modal */}
            <Modal
                transparent
                visible={reactionModal}
                animationType="fade">
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
                    onPress={() => setReactionModal(false)}>
                    <View style={{ 
    position: 'absolute', 
    top: reactionPosition.y > 400 ? reactionPosition.y - 80 : reactionPosition.y + 20,
    alignSelf: 'center', 
    backgroundColor: '#1a1a1a', 
    borderRadius: 30, 
    padding: 10, 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'center' 
}}>
                        {['❤️', '😂', '😍', '😮', '😢', '👍'].map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => addReaction(emoji)}>
                                <Text style={{ fontSize: 28 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => {
                            setReactionModal(false)
                            setSelectedMessageId(selectedReactionMessageId)
                            setDeleteModalVisible(true)
                        }}>
                            <Image
                                source={require('../assets/images/trash.png')}
                                style={{ width: 28, height: 28, tintColor: '#ff4444' }}
                            />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Delete Modal */}
            <Modal
                transparent
                visible={deleteModalVisible}
                animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 25, width: '80%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 8 }}>Delete Message</Text>
                        <Text style={{ fontSize: 14, color: '#888888', marginBottom: 25 }}>Are you sure you want to delete this message?</Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity
                                onPress={() => setDeleteModalVisible(false)}
                                style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#670000', alignItems: 'center' }}>
                                <Text style={{ color: '#670000' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmDelete}
                                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#670000', alignItems: 'center' }}>
                                <Text style={{ color: '#ffffff' }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    )
}