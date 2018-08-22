import React, { Component } from 'react'
import Modal from 'react-modal'
import * as request from 'superagent'
import { queue } from 'd3-queue'
import { parse, DOM } from 'xml-parse'

const initialHowMany = 10

class ContributorsModal extends Component {
  state = {
    howMany: initialHowMany,
    loading: false
  }

  userNames = {}

  render() {
    const total = this.props.contributors.reduce((prev, contributor) => prev + contributor.contributions, 0)
    return (
      <Modal
        isOpen={this.props.isOpen}
        onRequestClose={this.props.onRequestClose}
        className={this.state.loading ? 'updating' : ''}
        style={this.props.style}>
        <h3>Top {Math.min(this.state.howMany, this.props.contributors.length)} Contributors</h3>
        <a className="close-link" onClick={this.props.onRequestClose}>x</a>
        <ul className="contributors">
        {this.props.contributors.slice(0,this.state.howMany).map(contributor =>
          <li key={contributor.uid}>{this.userNames[contributor.uid]
            ? (<a href={"http://hdyc.neis-one.org/?"+this.userNames[contributor.uid]} target="_blank" title="get more infos about this user on hdyc">{this.userNames[contributor.uid]}</a>)
            : '#'+contributor.uid}
            <span className='percentage'>{Math.round(contributor.contributions/total*100) || '<1'}%</span>
          </li>
        )}
          <li>{this.props.contributors.length > this.state.howMany
            ? <button onClick={::this.expand}>show more</button>
            : ''}
          </li>
        </ul>
      </Modal>
    )
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isOpen) return
    this.loadUserNamesFor(nextProps.contributors.slice(0,initialHowMany).map(contributor => contributor.uid))
    this.setState({ howMany: initialHowMany })
  }

  expand() {
    this.loadUserNamesFor(this.props.contributors.slice(this.state.howMany,this.state.howMany+initialHowMany).map(contributor => contributor.uid))
    this.setState({
      howMany: this.state.howMany + initialHowMany
    })
  }

  loadUserNamesFor(uids) {
    this.setState({ loading: true })
    var q = queue()
    var uidsToRequest = uids.filter(uid => !this.userNames[uid])

    uidsToRequest.forEach(uid => {
      let req = request.get('https://api.openstreetmap.org/api/0.6/user/'+uid)
      q.defer(req.end.bind(req))
    })
    q.awaitAll(function(err, data) {
      if (err) {
        console.error(err)
      } else {
        uidsToRequest.forEach((uid, idx) => {
          const xmlDOM = new DOM(parse(data[idx].text));
          const user = xmlDOM.document.getElementsByTagName('user')[0];
          this.userNames[uid] = user.attributes.display_name;
        })
      }
      this.setState({ loading: false })
    }.bind(this))
  }
}

export default ContributorsModal
