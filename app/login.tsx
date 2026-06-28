import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';

export default function LoginScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleLogin() {
        try {
            await signInWithEmailAndPassword(auth, email, password)
            router.push('/chat' as any)
        } catch (error) {
            Alert.alert("Error", (error as any).message)
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000000' }}>
            <Text style={{alignSelf:'center',fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#ffeeee' }}>LOGIN</Text>
            <TextInput
                placeholder="Email" 
                placeholderTextColor="#c8c5c5"
                value={email}
                onChangeText={setEmail}
                style={{color:'#f3f2f2', borderWidth: 1, borderColor: '#fff5f5', padding: 12, borderRadius: 30, marginBottom: 15 }}
            />
            <TextInput
                placeholder="Password"
                placeholderTextColor="#c8c5c5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{color:'#f3f2f2', borderWidth: 1, borderColor: '#cccccc', padding: 12, borderRadius: 30, marginBottom: 20 }}
            />
            <TouchableOpacity
                onPress={handleLogin}
                style={{ backgroundColor: '#fcfcfc', padding: 15, borderRadius: 30, alignItems: 'center' }}>
                <Text style={{ color: '#010101', fontSize: 16 }}>Click to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 15 }}>
                <Text style={{ color: '#838d99', textAlign: 'center' }}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    )
}