import React, {Component} from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Keyboard,
  Text,
  TouchableHighlight,
  ActivityIndicator,
  Image,
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
      latitude: null,
      longitude: null,
      error: null,
      destination: '',
      predictions: [],
      pointCoords: [],
      routeResponse: {},
      lookingForDriver: false,
      buttonText: 'REQUEST 🚗',
      driverIsOnTheWar: false,
    };
  }

  componentDidMount() {
    //Get current location and set initial region to this
    const watchId = Geolocation.watchPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.getRouteDirections();
      },
      (error) => console.error(error),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 2000},
    );
  }

  componentWillUnmount() {
    Geolocation.clearWatch(this.watchId);
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
    this.setState({lookingForDriver: true});

    const socket = io('http://192.168.0.111:3000/');

    socket.on('connect', () => {
      console.log('L', 'client connected');
      //Request a Taxi!
      socket.emit('taxiRequest', this.state.routeResponse);
    });

    socket.on('driverLocation', (driverLocation) => {
      const pointCoords = [...this.state.pointCoords, driverLocation];

      this.map.fitToCoordinates(pointCoords, {
        edgePadding: {top: 40, bottom: 20, left: 20, right: 20},
      });
      //this.getRouteDirections(routeResponse.geocoded_waypoints[0].place_id);
      this.setState({
        buttonText: 'TAXI ACCEPTED THE RIDE!',
        lookingForDriver: false,
        driverIsOnTheWar: true,
        driverLocation,
      });
    });
  }

  render() {
    let marker = null;
    let getDriver = null;
    let findingDriverActIndicator = null;
    let driverMarker = null;

    if (this.state.latitude === null) {
      return null;
    }

    if (this.state.driverIsOnTheWar) {
      driverMarker = (
        <Marker coordinate={this.state.driverLocation}>
          <Image
            source={require('../images/carIcon.png')}
            style={{width: 40, height: 40}}
          />
        </Marker>
      );
    }

    if (this.state.lookingForDriver) {
      findingDriverActIndicator = (
        <ActivityIndicator
          size="large"
          animating={this.state.lookingForDriver}
          color="white"
        />
      );
    }

    if (this.state.pointCoords.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
        />
      );
      getDriver = (
        <BottomButton
          onPressFunction={() => this.resquestDriver()}
          buttonText={this.state.buttonText}>
          {findingDriverActIndicator}
        </BottomButton>
      );
    }
    const predictions = this.state.predictions.map((prediction) => (
      <TouchableHighlight
        onPress={() => {
          console.log('L', 'Onpress');
          this.getRouteDirections(
            prediction.place_id,
            prediction.structured_formatting.main_text,
          );
        }}
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
          inicialRegion={{
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
          {driverMarker}
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
