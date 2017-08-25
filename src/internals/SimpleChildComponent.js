import React from "react";
import ReactDOM from "react-dom";
import objectPath from "object-path";
import PropTypes from "prop-types";

import EventComponent from "./EventComponent";
import exposeGetters from "./exposeGetters";

class SimpleChildComponent extends EventComponent {
  /* Contract
   *  statics:
   *    _GoogleMapsClassName:
   *  state:
   *    instance
   */
  constructor (...args) {
    super(...args);
    this.state = {};
  }

  _createOrUpdateInstance () {
    const {props} = this;
    if (!props.googleMapsApi || !props.map) {
      return;
    }
    const {googleMapsApi, ...googleMapsConfig} = props;
    var {instance} = this.state;
    if (instance) {
      if (googleMapsConfig.map === instance.getMap()) {
        // Set map and animation props only on the first run:
        delete googleMapsConfig.map;
        delete googleMapsConfig.animation;
      }
      instance.setOptions(this._handleMissingContent(googleMapsConfig));
    } else {
      const googleMapsClassName = this.constructor._GoogleMapsClassName;
      if (!objectPath.has(googleMapsApi, googleMapsClassName)) {
        const msg = "This react-google-maps component can't find the corresponding " +
        "Google Maps API class 'google.maps." + googleMapsClassName + "'. You may have to include " +
        "additional Google Maps libraries in your javascript src URL. " +
        "See: https://developers.google.com/maps/documentation/javascript/libraries";
        console.warn(msg);
        return;
      }
      const GoogleMapsClass = objectPath.get(googleMapsApi, googleMapsClassName);
      instance = new GoogleMapsClass(this._handleMissingContent(googleMapsConfig));

      exposeGetters(this, GoogleMapsClass.prototype, instance);
      this.setState({instance});
    }
    return instance;
  }

  _handleMissingContent(config) {
    const googleMapsClassName = this.constructor._GoogleMapsClassName;
    if (("InfoWindow" !== googleMapsClassName && "InfoBox" !== googleMapsClassName) || config.content) {
      return config;
    } else {
      var detachedDiv = document.createElement("div"),
          childComponent = React.Children.only(this.props.children);
      if (childComponent.props.wrapperClassName) {
          detachedDiv.className = childComponent.props.wrapperClassName;
      }
      ReactDOM.render(childComponent, detachedDiv);
      config.content = detachedDiv;
      return config;
    }
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    const {instance} = this.state;
    if (instance) {
      instance.setMap(null);
    }
  }

  render () {
    return <noscript />;
  }

}

SimpleChildComponent.propTypes = {
  ...EventComponent.propTypes,
  map: PropTypes.object,
};

export default SimpleChildComponent;
