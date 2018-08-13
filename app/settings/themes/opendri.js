const blue = '#8DCCFD'
const orange = '#FFBA8A'
const UIBlue = '#1477c9'

const baseButton = {
  backgroundColor: 'transparent',
  color: UIBlue,
  boxShadow: 'none'
}

export default {
  externalLink: {
    position: 'absolute',
    bottom: '5px',
    right: '0',
    color: UIBlue,
    fontSize: '0.8rem'
  },
  legend: {
    bottom: '50px'
  },
  thresholdSelector: {
    display: 'none'
  },
  embedHeader: {
    padding: '10px 0',
    boxShadow: 'none'
  },
  dateFrom: {
    after: {
      marginLeft: '6px'
    },
    afterContent: ' - '
  },
  dateTo: {
    after: {
    },
    afterContent: ''
  },
  dropDown: {
    color: UIBlue,
    textDecoration: 'underline'
  },
  dropDownList: {
    boxShadow: 'initial',
    borderRadius: 'initial',
    top: '-10px',
    border: '1px solid #BEC9D5'
  },
  buttons: {
    button: baseButton,
    hover: {
      ...baseButton,
      textDecoration: 'underline',
    },
    active: {
      ...baseButton,
      textDecoration: 'underline'
    }
  },
  swiper: {
    backgroundColor: UIBlue,
    borderColor: UIBlue,
    poly: {
      shape: 'polyline',
      color: UIBlue,
      weight: 2
    }
  },

  layerStyles: {
    buildings: {
      "raw": {
        "fill-color": blue,
        "fill-outline-color": blue
      },
      "raw-highlight": {
        "fill-color": orange,
        "fill-outline-color": orange
      },
      "aggregated": {
        "fill-color": blue
      },
      "aggregated-highlight": {
        "fill-color": orange
      }
    },
    highways: {
      "raw": {
        "line-color": blue
      },
      "raw-highlight": {
        "line-color": blue
      },
      "aggregated": {
        "fill-color": blue
      },
      "aggregated-highlight": {
        "fill-color": orange
      }
    },
    waterways: {
      "raw": {
        "line-color": blue
      },
      "raw-highlight": {
        "line-color": blue
      },
      "aggregated": {
        "fill-color": blue
      },
      "aggregated-highlight": {
        "fill-color": orange
      }
    },
    builtup: {
      "aggregated": {
        "fill-color": '#666'
      },
      "aggregated-highlight": {
        "fill-color": '#666'
      }
    }
  }
}
