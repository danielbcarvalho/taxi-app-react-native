import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, {Polyline, Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import BottomButton from '../components/BottomButton';
import apiKey from '../google_api_key';
import PolyLine from '@mapbox/polyline';
import {io} from 'socket.io-client';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';

export default class Driver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: 0,
      longitude: 0,
      error: null,
      pointCoords: [],
      lookingForPassengers: false,
      buttonText: 'FIND PASSENGER',
    };
    this.lookForPassengers = this.lookForPassengers.bind(this);
    this.acceptPassengerRequest = this.acceptPassengerRequest.bind(this);
    this.socket = null;
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
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 50,
      distanceFilter: 50,
      debug: false,
      startOnBoot: false,
      stopOnTerminate: true,
      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: false,
    });

    BackgroundGeolocation.on('authorization', (status) => {
      console.log(
        '[INFO] BackgroundGeolocation authorization status: ' + status,
      );
      if (status !== BackgroundGeolocation.AUTHORIZED) {
        // we need to set delay or otherwise alert may not be shown
        setTimeout(
          () =>
            Alert.alert(
              'App requires location tracking permission',
              'Would you like to open app settings?',
              [
                {
                  text: 'Yes',
                  onPress: () => BackgroundGeolocation.showAppSettings(),
                },
                {
                  text: 'No',
                  onPress: () => console.log('No Pressed'),
                  style: 'cancel',
                },
                ,
              ],
            ),
          1000,
        );
      }
    });
  }

  async getRouteDirections(placeId) {
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
        routeResponse: json,
      });
      this.map.fitToCoordinates(pointCoords, {
        edgePadding: {top: 20, bottom: 20, left: 80, right: 80},
      });
    } catch (err) {
      console.log('Lol', err);
    }
  }

  async lookForPassengers() {
    if (this.state.lookingForPassengers) {
      this.setState({
        lookingForPassengers: false,
      });
      return;
    }

    this.setState({
      lookingForPassengers: true,
    });

    this.socket = io('http://192.168.0.111:3000/');

    this.socket.on('connect', () => {
      this.socket.emit('lookingForPassengers');
    });

    this.socket.on('taxiRequest', (routeResponse) => {
      console.log('L', routeResponse);
      this.getRouteDirections(routeResponse.geocoded_waypoints[0].place_id);
      this.setState({
        lookingForPassengers: false,
        passengerFound: true,
        buttonText: 'PASSENGER FOUND!',
      });
    });
  }

  acceptPassengerRequest() {
    const passengerLocation = this.state.pointCoords[
      this.state.pointCoords.length - 1
    ];

    // this.setState({
    //   lookingForPassengers: false,
    // });

    BackgroundGeolocation.on('location', (location) => {
      //Send driver location to paseenger socket io backend
      console.log('bgr acceptedride', location.latitude);
      this.socket.emit('driverLocation', {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    });

    BackgroundGeolocation.checkStatus((status) => {
      // you don't need to check status before start (this is just the example)
      if (!status.isRunning) {
        console.log('start', status.isRunning);
        BackgroundGeolocation.start(); //triggers start on start event
      }
    });

    if (Platform.OS === 'ios') {
      Linking.openURL(
        `http://maps.apple.com/?daddr=${passengerLocation.latitude},${passengerLocation.longitude}`,
      );
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${passengerLocation.latitude},${passengerLocation.longitude}`,
      );
    }
  }

  render() {
    let endMarker = null;
    let startMarker = null;
    let findingPassengerActIndicator = null;
    let passengerSearchText = 'FIND PASSENGER';
    let bottomButtonFunction = this.lookForPassengers;

    if (this.state.lookingForPassengers) {
      passengerSearchText = 'FINDING PASSENGERS...';
      findingPassengerActIndicator = (
        <ActivityIndicator
          size="large"
          animating={this.state.lookingForPassengers}
          color="white"
        />
      );
    }

    if (this.state.passengerFound) {
      passengerSearchText = 'FOUND PASSENGER! ACCEPT RIDE?';
      bottomButtonFunction = this.acceptPassengerRequest;
    }

    if (this.state.pointCoords.length > 1) {
      endMarker = (
        <Marker
          coordinate={
            this.state.pointCoords[this.state.pointCoords.length - 1]
          }>
          <Image
            style={{width: 40, height: 40}}
            source={require('../images/person-marker.png')}
          />
        </Marker>
      );
    }

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
          {endMarker}
          {startMarker}
        </MapView>

        <BottomButton
          onPressFunction={bottomButtonFunction}
          buttonText={passengerSearchText}>
          {findingPassengerActIndicator}
        </BottomButton>
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
