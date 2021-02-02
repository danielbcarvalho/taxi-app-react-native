import React, { Component } from 'react'
import { Text, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native'

export default class LoginForm extends Component {
    render() {
        return (
            <View>
                <TextInput
                    style={styles.input}
                    placeholder='your@email.com'
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoCorrect={false}
                    placeholderTextColor='#3A3743'
                />
                <TextInput
                    style={styles.input}
                    autoCapitalize='none'
                    autoCorrect={false}
                    secureTextEntry
                    placeholder='password'
                    placeholderTextColor='#3A3743'
                />
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Sign in</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    input: {
        height: 40,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        color: '#3A3743',
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#562EAC',
        paddingVertical: 20
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 20,
    }
})
