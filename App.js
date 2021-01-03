import React, {Component} from 'react';
import {StyleSheet, Button, View, TouchableOpacity, Text} from 'react-native';
import Driver from './screens/Driver';
import Passenger from './screens/Passenger';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDriver: false,
      isPassenger: false,
    };
  }

  render() {
    if (this.state.isDriver) {
      return <Driver />;
    }
    if (this.state.isPassenger) {
      return <Passenger />;
    }
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.buttons}
          onPress={() => this.setState({isPassenger: true})}>
          <Text style={styles.textButtons}>Passenger</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttons}
          onPress={() => this.setState({isDriver: true})}>
          <Text style={styles.textButtons}>Driver</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  buttons: {
    backgroundColor: 'green',
    borderWidth: 0.5,
    padding: 20,
  },
  textButtons: {
    color: 'white',
    textAlign: 'center',
    fontSize: 24,
  },
});
