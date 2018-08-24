import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Modal from 'react-modal'
import { polygon } from 'turf'
import { queue } from 'd3-queue'
import moment from 'moment'
import * as MapActions from '../../actions/map'
import * as StatsActions from '../../actions/stats'
import OverlayButton from '../OverlayButton'
import UnitSelector from '../UnitSelector'
import Histogram from './chart'
import ContributorsModal from './contributorsModal'
import SubTagsModal from './subTagsModal'
import HotProjectsModal from './hotProjectsModal'
import regionToCoords from '../Map/regionToCoords'
import searchHotProjectsInRegion from './searchHotProjects'
import searchFeatures from './searchFeatures'
import unitSystems from '../../settings/unitSystems'
import style from './style.css'


const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(60,60,60, 0.5)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '350px',
    maxWidth: '512px',
    minWidth: '300px',
    borderRadius: '4px',
    paddingTop: '25px',
    paddingBottom: '35px',
    paddingLeft: '35px',
    paddingRight: '35px'
  }
}

class Stats extends Component {
  state = {
    features: [],
    hotProjects: [],
    hotProjectsModalOpen: false,
    updating: false
  }

  applySelection(timestamp, userExperience, selection) {
    if (!Array.isArray(timestamp)) {
      timestamp = [timestamp, timestamp]
    }
    if (!Array.isArray(userExperience)) {
      userExperience = [userExperience, userExperience]
    }
    return (
      (selection.timeFilter === null || (
        timestamp[1] >= selection.timeFilter[0] && timestamp[0] <= selection.timeFilter[1]
      )) &&
      (selection.experienceFilter === null || (
        userExperience[1] >= selection.experienceFilter[0] && userExperience[0] <= selection.experienceFilter[1]
      ))
    )
  }

  render() {
    var features = this.state.features
    const activeLayer = this.props.layers.find(layer => layer.name === this.props.map.filters[0])

    // apply time and experience filters
    features.forEach(filter => {
      // do not override!
      filter.highlightedFeatures = filter.features.filter(feature => {
        if (feature.properties._timestamp) {
          return this.applySelection(
            feature.properties._timestamp,
            feature.properties._userExperience,
            this.props.stats
          )
        } else {
          return this.applySelection(
            [feature.properties._timestampMin, feature.properties._timestampMax],
            [feature.properties._userExperienceMin, feature.properties._userExperienceMax],
            this.props.stats
          )
        }
      })
    })

    // calculate number of contributors
    var contributors = {}
    var subTags = {}
    var sampledContributorCounts = false
    var featureCount = 0
    features.forEach(filter => {
      if (filter.features.length > 0 && filter.features[0].properties.tile.z < 13) {
        // on the low zoom levels we don't have complete data, but only samples.
        // estimating the total contributor count number from a sample is tricky.
        // for now just display a lower limit (e.g. "432+" contributors)
        // todo: maybe a Good-Turing estimation could be used here? see https://en.wikipedia.org/wiki/Good%E2%80%93Turing_frequency_estimation
        sampledContributorCounts = true
        filter.features.forEach(f => {
          var timestamps = f.properties._timestamps.split(";").map(Number)
          var userExperiences = f.properties._userExperiences.split(";").map(Number)
          var uids = f.properties._uids.split(";").map(Number)
          var tagValues = f.properties._tagValues.split(";")
          var matchingSamples = 0
          for (var i=0; i<timestamps.length; i++) {
            let sampleTimestamp = timestamps[i]
            let sampleUserExperience = userExperiences[i]
            if (this.applySelection(sampleTimestamp, sampleUserExperience, this.props.stats)) {
              contributors[uids[i]] = (contributors[uids[i]] || 0) + 1
              subTags[tagValues[i]] = (subTags[tagValues[i]] || 0) + 1
              matchingSamples++
            }
          }
          // from samples: scale matching data samples to total number of features in respective bin
          featureCount += f.properties._count * matchingSamples / Math.min(16, f.properties._count)
        })
      } else {
        filter.highlightedFeatures.forEach(f => {
          contributors[f.properties._uid] = (contributors[f.properties._uid] || 0) + 1
          subTags[f.properties._tagValue] = (subTags[f.properties._tagValue] || 0) + 1
          featureCount++
        })
      }
    })
    contributors = Object.keys(contributors).map(uid => ({
      uid: uid,
      contributions: contributors[uid]
    })).sort((a,b) => b.contributions - a.contributions)
    var numContributors = contributors.length
    subTags = Object.keys(subTags).map(subTag => ({
      subTag: subTag,
      count: subTags[subTag]
    })).sort((a,b) => b.count - a.count)
    var numSubTags = subTags.length
    featureCount = Math.round(featureCount)

    var timeFilter = ''
    if (this.props.stats.timeFilter) {
      timeFilter = (
        <span className="descriptor">{moment.unix(this.props.stats.timeFilter[0]).format('YYYY MMMM D')} – {moment.unix(this.props.stats.timeFilter[1]).format('YYYY MMMM D')}</span>
      )
    }

    // todo: loading animation if region is not yet fully loaded
    return (
      <div id="stats" className={this.state.updating ? 'updating' : ''}>
        <ul className="metrics">
          <li>
            <OverlayButton enabledOverlay={this.props.map.overlay} {...this.props.actions} {...this.props.statsActions}/>
            {timeFilter}
          </li>
        {features.map(filter => {
          return (<li key={activeLayer.name} title={activeLayer.description}>
            <span className="number">{
              numberWithCommas(Number((filter.filter === 'highways' || filter.filter === 'waterways'
                ? unitSystems[this.props.stats.unitSystem].distance.convert(
                  filter.highlightedFeatures.reduce((prev, feature) => prev+(feature.properties._length || 0.0), 0.0)
                )
                : featureCount //filter.highlightedFeatures.reduce((prev, feature) => prev+(feature.properties._count || 1), 0))
              )).toFixed(0))
            }</span><br/>
            {filter.filter === 'highways' || filter.filter === 'waterways'
            ? <UnitSelector
                unitSystem={this.props.stats.unitSystem}
                unit='distance'
                suffix={' of '+this.props.layers.find(f => f.name === filter.filter).title}
                setUnitSystem={this.props.statsActions.setUnitSystem}
              />
            : <span className="descriptor">{this.props.layers.find(f => f.name === filter.filter).title}</span>
            }
          </li>)
        })}
          <li>
            <span className="number">{this.state.hotProjects.length > 0
            ? <a className="link" onClick={::this.openHotModal} target="_blank">{this.state.hotProjects.length}</a>
            : this.state.hotProjects.length
            }</span><br/><span className="descriptor">HOT Projects</span>
          </li>
          <li>
            <span className="number">
              <a title={sampledContributorCounts ? "select a smaller region (~city level) to see the exact number of contributors" : ""} className="link" onClick={::this.openContributorsModal} target="_blank">{numberWithCommas(numContributors) + (sampledContributorCounts ? "+" : "")}</a>
            </span><br/><span className="descriptor">Contributors</span>
          </li>
          <li>
            <span className="number">
              <a title={sampledContributorCounts ? "select a smaller region (~city level) to see the exact number of sub-tags" : ""} className="link" onClick={::this.openSubTagsModal} target="_blank">{numberWithCommas(numSubTags) + (sampledContributorCounts ? "+" : "")}</a>
            </span><br/><span className="descriptor">Distinct Tags</span>
          </li>
        </ul>

        <div className="buttons">
          <button className="compare-toggle" onClick={::this.enableCompareView}>Compare Time Periods</button>
          <a href="#"><button className="close">Close</button></a>
        </div>

        <HotProjectsModal
          isOpen={this.state.hotProjectsModalOpen}
          onRequestClose={::this.closeHotModal}
          style={modalStyles}
          hotProjects={this.state.hotProjects}
        />
        <ContributorsModal
          isOpen={this.state.contributorsModalOpen}
          onRequestClose={::this.closeContributorsModal}
          style={modalStyles}
          contributors={contributors}
        />
        <SubTagsModal
          isOpen={this.state.subTagsModalOpen}
          onRequestClose={::this.closeSubTagsModal}
          style={modalStyles}
          tagKey = {features.length > 0 && this.props.layers.find(f => f.name === features[0].filter).filter.tagKey}
          subTags={subTags}
        />

        <Histogram key={this.props.mode||'recency'} mode={this.props.mode||'recency'} data={
          features.reduce((prev, filter) => prev.concat(filter.features), [])
        }/>
      </div>
    )
  }

  componentDidMount() {
    if (this.props.map.region) {
      ::this.update(this.props.map.region, this.props.map.filters)
    }
  }

  componentWillReceiveProps(nextProps) {
    // check for changed map parameters
    if (nextProps.map.region !== this.props.map.region
      || nextProps.map.filters !== this.props.map.filters) {
      ::this.update(nextProps.map.region, nextProps.map.filters)
    }
  }

  update(region, filters) {
    regionToCoords(region)
    .then((function(region) {
      this.setState({ updating: true, features: [] })
      var q = queue()
      filters.forEach(filter =>
        q.defer(searchFeatures, region, filter)
      )
      q.awaitAll(function(err, data) {
        if (err) throw err
        this.setState({
          features: data.map((d,index) => ({
            filter: filters[index],
            features: d.features
          })),
          updating: false
        })
      }.bind(this))
      const hotProjects = searchHotProjectsInRegion(region)
      this.setState({ hotProjects })
    }).bind(this));
  }


  openHotModal() {
    this.setState({ hotProjectsModalOpen: true })
  }
  closeHotModal() {
    this.setState({ hotProjectsModalOpen: false })
  }
  openContributorsModal() {
    this.setState({ contributorsModalOpen: true })
  }
  closeContributorsModal() {
    this.setState({ contributorsModalOpen: false })
  }
  openSubTagsModal() {
    this.setState({ subTagsModalOpen: true })
  }
  closeSubTagsModal() {
    this.setState({ subTagsModalOpen: false })
  }

  enableCompareView() {
    this.props.actions.setView('compare')
  }
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function mapStateToProps(state) {
  return {
    map: state.map,
    stats: state.stats
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(MapActions, dispatch),
    statsActions: bindActionCreators(StatsActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Stats)
