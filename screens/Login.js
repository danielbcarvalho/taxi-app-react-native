import React, { Component } from 'react'
import { Text, StyleSheet, View, Platform, Alert, Image } from 'react-native';
import LoginForm from '../components/LoginForm'
import axios from 'axios'
import LinearGradient from 'react-native-linear-gradient'
import baseURL from '../baseUrl'
axios.defaults.baseURL = baseURL

export default class Login extends Component {
    constructor(props) {
        super(props)
        this.state = {
            email: 'danielbcarvalho@gmail.com',
            password: '321',
            errorMessage: ''
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSignIn = this.handleSignIn.bind(this)
        this.handleSignUp = this.handleSignUp.bind(this)
    }

    handleChange(name, value) {
        this.setState({
            [name]: value
        })
    }

    async handleSignUp() {
        try {
            const { email, password } = this.state
            const result = await axios.post('/auth/signup', { email, password })

            this.handleSignIn();
        } catch (error) {
            const errorMessage = error.response.data.message
            Alert.alert('', errorMessage)
        }
    }

    async handleSignIn() {
        try {
            const { email, password } = this.state
            const result = await axios.post('/auth/login', { email, password })
            if (result.data.token) {
                //Alert.alert('', result.data.token)
                this.props.handleChange('token', result.data.token)
            } else {
                Alert.alert('', result.data)
            }

        } catch (error) {
            console.log(error)
        }
    }

    render() {
        return (
            <LinearGradient
                colors={['#7D54DF', '#9C55BB']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.headerText}>WeTaxi </Text>
                <LoginForm
                    email={this.state.email}
                    password={this.state.password}
                    handleChange={this.handleChange}
                    handleSignIn={this.handleSignIn}
                    handleSignUp={this.handleSignUp}
                />
                <Text>{this.state.errorMessage}</Text>
                <Image
                    source={require('../images/wetaxi.png')}
                    style={styles.logo}
                />

            </LinearGradient>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerText: {
        fontSize: 64,
        color: '#FFF',
        textAlign: 'center',
        marginTop: 180,
        marginBottom: 40
    },
    errorMessage: {
        marginHorizontal: 10,
        fontSize: 18,
        color: '#fff'
    },
    logo: {
        //flex: 1,
        marginTop: 100,
        height: 100,
        width: 100,
        alignSelf: 'center',
    }
});
