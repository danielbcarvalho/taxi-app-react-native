import React, { Component } from 'react'
import { Text, StyleSheet, View } from 'react-native';
import LoginForm from '../components/LoginForm'
import LinearGradient from 'react-native-linear-gradient'

export default class Login extends Component {
    render() {
        return (
            <LinearGradient
                colors={['#7D54DF', '#8C55BB']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.headerText}> WE TAXI </Text>
                <LoginForm />
            </LinearGradient>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3A3743'
    },
    headerText: {
        fontSize: 64,
        color: '#FFF',
        textAlign: 'center',
        marginTop: 40
    }
});
