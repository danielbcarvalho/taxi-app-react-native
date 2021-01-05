import React, {Component} from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Keyboard,
  Text,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';
import MapView, {Polyline, Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import apiKey from '../google_api_key';
import PolyLine from '@mapbox/polyline';
import {io} from 'socket.io-client';
import BottomButton from '../components/BottomButton';

export default class Passenger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: null,
      destination: '',
      predictions: [],
      pointCoords: [],
      routeResponse: {},
      lookingForDriver: false,
    };
  }

  componentDidMount() {
    //Get current location and set initial region to this
    Geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
        this.getRouteDirections();
      },
      (error) => this.setState({error: error.message}),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 2000},
    );
  }

  async getRouteDirections(placeId, destinationName) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${this.state.latitude},${this.state.longitude}&destination=place_id:${placeId}&key=${apiKey}`,
      );
      const json = await response.json();
      console.log(json);
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      const pointCoords = points.map((point) => {
        return {latitude: point[0], longitude: point[1]};
      });
      this.setState({
        pointCoords,
        predictions: [],
        destination: destinationName,
        routeResponse: json,
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoords, {
        edgePadding: {top: 20, bottom: 20, left: 80, right: 80},
      });
    } catch (err) {
      console.log('Lol', err);
    }
  }

  async onChangeDestination(destination) {
    //call places API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${destination}&key=${apiKey}&location=${this.state.latitude}, ${this.state.longitude}&radius=2000`;
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();
      this.setState({
        predictions: json.predictions,
      });
    } catch (err) {
      console.log('L', err);
    }
  }

  async resquestDriver() {
    const socket = io('http://192.168.0.120:3000/');

    socket.on('connect', () => {
      console.log('L', 'client connected');
      //Request a Taxi!
      socket.emit('taxiRequest', this.state.routeResponse);
    });
  }

  render() {
    let marker = null;
    let getDriver = null;

    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
        />
      );
      getDriver = (
        <BottomButton
          onPressFunction={() => this.resquestDriver()}
          buttonText="REQUEST 🚗"
        />
      );
    }
    const predictions = this.state.predictions.map((prediction) => (
      <TouchableHighlight
        onPress={() =>
          this.getRouteDirections(
            prediction.place_id,
            prediction.structured_formatting.main_text,
          )
        }
        key={prediction.place_id}>
        <View>
          <Text style={styles.suggestions}>
            {prediction.structured_formatting.main_text}
          </Text>
        </View>
      </TouchableHighlight>
    ));

    return (
      <View style={styles.mapStyle}>
        <MapView
          ref={(map) => {
            this.map = map;
          }}
          style={styles.mapStyle}
          region={{
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}
          showsUserLocation={true}>
          <Polyline
            coordinates={this.state.pointCoords}
            strokeWidth={2}
            strokeColor="red"
          />
          {marker}
        </MapView>

        <TextInput
          placeholder="Enter destination..."
          style={styles.destinationInput}
          value={this.state.destination}
          clearButtonMode="always"
          onChangeText={(destination) => {
            this.setState({destination, pointCoords: []});
            this.onChangeDestination(destination);
          }}
        />
        {predictions}
        {getDriver}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bottomButton: {
    backgroundColor: 'black',
    padding: 20,
    paddingRight: 40,
    paddingLeft: 40,
    marginTop: 'auto',
    margin: 20,
    alignSelf: 'center',
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 20,
  },
  suggestions: {
    backgroundColor: 'white',
    fontSize: 14,
    padding: 5,
    borderWidth: 0.5,
    marginRight: 20,
    marginLeft: 20,
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 50,
    marginRight: 20,
    marginLeft: 20,
    padding: 5,
    backgroundColor: 'white',
  },
  mapStyle: {
    ...StyleSheet.absoluteFillObject,
  },
});
