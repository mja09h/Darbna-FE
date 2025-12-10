import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'

const welcome = () => {
  return (
    <View style={styles.container}>
        <Image source={require('../../assets/darbna-logo.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to Darbna</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}

export default welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2c120c',
        
    }, 
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ad5410',
    },
    logo: {
        width: 300,
        height: 300,
        borderRadius: 300,
        margin: 30,
    },
    button: {
        backgroundColor: '#ad5410',
        padding: 10,
        borderRadius: 100,
        marginVertical: 30,

    },
    buttonText: {
        color: '#2c120c',
        fontWeight: 'bold',
        marginHorizontal: 90,
        marginVertical: 5,
        fontFamily: 'Poppins',
        textAlign: 'center',
        fontSize: 20,
    },
})