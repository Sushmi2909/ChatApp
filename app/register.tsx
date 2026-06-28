import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

export default function RegisterScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')

    async function handleRegister() {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log("User created:", user.uid)

        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            uid: user.uid,
            createdAt: new Date()
        })

        console.log("User saved to Firestore!")
        Alert.alert("Success", "Account created!")
        router.push('/login' as any)
    } catch (error) {
        console.log("Error:", error)
        Alert.alert("Error", (error as any).message)
    }
}

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000000' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 30,alignSelf:'center', color: '#ffffff' }}>REGISTER</Text>
            <TextInput
                placeholder="Name"
                placeholderTextColor={"#959393"}
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1,color:'#ffffff', borderColor: '#cccccc', padding: 12, borderRadius: 50, marginBottom: 15 }}
            />
            <TextInput
                placeholder="Email"
                placeholderTextColor={"#959393"}
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1,color:'#ffffff', borderColor: '#cccccc', padding: 12, borderRadius: 50, marginBottom: 15 }}
            />
            <TextInput
                placeholder="Password"
                placeholderTextColor={"#959393"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1,color:'#ffffff', borderColor: '#cccccc', padding: 12, borderRadius: 50, marginBottom: 20 }}
            />
            <TouchableOpacity
                onPress={handleRegister}
                style={{ backgroundColor: '#ffffff', padding: 15, borderRadius: 50, alignItems: 'center' }}>
                <Text style={{ color: '#000000', fontSize: 16 }}>Register</Text>
            </TouchableOpacity>
        </View>
    )
}