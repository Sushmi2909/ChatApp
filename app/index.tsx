import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000'
      }}>

      {/* Greeting Image */}
      <Image
        source={require('../assets/images/greeting.png')}
        style={{
          tintColor:'#ffffff',
          width: 180,
          height: 180,
          marginBottom: 20,
          resizeMode: 'contain'
        }}
      />

      <Text
        style={{
          color: 'rgb(253, 251, 251)',
          fontSize: 20
        }}>
        Welcome to ChatApp!
      </Text>

      <Text
        style={{
          color: '#5c5c5cff',
          fontSize: 15
        }}>
        Please LogIn to Continue
      </Text>

      <View>
        <TouchableOpacity
          onPress={() => router.push('/login')}
          style={{
            backgroundColor: '#1e2839',
            padding: 15,
            borderRadius: 30,
            marginTop: 20
          }}>

          <Text
            style={{
              color: '#ffffff',
              fontSize: 16
            }}>
            Go to Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/register')}
          style={{
            backgroundColor: '#ffffff',
            alignContent: 'center',
            padding: 15,
            borderRadius: 30,
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#000000'
          }}>

          <Text
            style={{
              alignSelf: 'center',
              color: '#000000',
              fontSize: 16
            }}>
            Register
          </Text>

        </TouchableOpacity>
      </View>

    </View>
  )
}